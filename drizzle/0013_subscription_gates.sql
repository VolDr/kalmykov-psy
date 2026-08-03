-- Шаги-шлагбаумы в цепочках выдачи лид-магнитов: «лм отпуск» (сценарий 2)
-- и «лм фокус» (сценарий 4).
--
-- Раньше подписку проверяла кнопка под постом канала, но в веб-превью t.me
-- inline-кнопки не отображаются, и десктопный трафик упирался в тупик. Теперь
-- посадочные ведут прямо в бота, а подписку проверяет первый шаг цепочки.
--
-- Шаг выполняется только для неподписанных (condition = 'not_subscribed'),
-- показывает ссылку на канал плюс кнопку проверки и останавливает цепочку.
-- Подписанные его не видят — им сразу уходит следующий шаг с материалом.
--
-- Позиция считается как MIN(position) - 1, чтобы шаг встал перед всеми
-- существующими, не сдвигая их. Скрипт идемпотентный: повторный запуск
-- ничего не добавит.

INSERT INTO bot_scenario_steps (
	scenario_id,
	position,
	delay_seconds,
	message_text,
	button_text,
	button_url,
	condition,
	button_action,
	add_tags
)
SELECT
	s.id,
	COALESCE((SELECT MIN(position) FROM bot_scenario_steps WHERE scenario_id = s.id), 1) - 1,
	0,
	E'Материал открыт для подписчиков канала.\n\nНажмите «Подписаться на @kalmykov_psy» ниже, потом «Я подписался(-ась) ✅» — и я сразу пришлю ссылку на статью.',
	'Подписаться на @kalmykov_psy',
	'https://t.me/kalmykov_psy',
	'not_subscribed',
	'check_subscription',
	'{gate_shown}'::text[]
FROM bot_scenarios s
WHERE s.id IN (2, 4)
	AND NOT EXISTS (
		SELECT 1 FROM bot_scenario_steps existing
		WHERE existing.scenario_id = s.id
			AND existing.button_action = 'check_subscription'
	);

-- Проверка: у каждой цепочки шлагбаум должен стоять первым
SELECT
	sc.id AS scenario_id,
	sc.name,
	st.position,
	st.condition,
	st.button_action,
	LEFT(st.message_text, 40) AS message_start
FROM bot_scenario_steps st
JOIN bot_scenarios sc ON sc.id = st.scenario_id
WHERE sc.id IN (2, 4)
ORDER BY sc.id, st.position;
