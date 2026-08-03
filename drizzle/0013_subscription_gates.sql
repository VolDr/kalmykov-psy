-- Рекламные копии цепочек выдачи лид-магнитов со шлагбаумом подписки.
--
-- Оригиналы (сценарии 2 «лм отпуск» и 4 «лм фокус») не трогаем: они обслуживают
-- органику — человек приходит из канала по кнопке под постом, где подписка уже
-- проверена. Ломать этот путь нельзя, и смешивать в нём два источника тоже:
-- source_key и воронка в /admin/bot/contacts должны считаться раздельно,
-- иначе замер рекламы бессмысленен.
--
-- Копии триггерятся ключами otpusk_ad и focus_ad — на них ведут посадочные
-- /ads/vacation и /ads/attention. Первым шагом идёт шлагбаум: он выполняется
-- только для неподписанных, показывает ссылку на канал плюс кнопку проверки
-- и останавливает цепочку. Подписанные его не видят.
--
-- Скрипт идемпотентный: повторный запуск ничего не продублирует.

-- 1. Канал для проверки подписки.
-- У копий нет привязанного поста канала, поэтому isContactSubscribed() падает
-- на запасной путь — канал из общих настроек бота. Если его не заполнить,
-- проверка всегда вернёт «подписан» и шлагбаум никого не остановит.
INSERT INTO quiz_bot_settings (channel_chat_id)
SELECT '@kalmykov_psy'
WHERE NOT EXISTS (SELECT 1 FROM quiz_bot_settings);

UPDATE quiz_bot_settings
SET channel_chat_id = '@kalmykov_psy', updated_at = now()
WHERE channel_chat_id IS NULL OR btrim(channel_chat_id) = '';

-- 2. Сами цепочки — копии настроек оригиналов с новым триггером
INSERT INTO bot_scenarios (
	name, kind, trigger_type, trigger_value,
	enabled, cancels_others, protected_from_cancel, cooldown_days
)
SELECT
	s.name || ' (реклама)',
	s.kind,
	s.trigger_type,
	s.trigger_value || '_ad',
	s.enabled,
	s.cancels_others,
	s.protected_from_cancel,
	s.cooldown_days
FROM bot_scenarios s
WHERE s.id IN (2, 4)
	AND NOT EXISTS (
		SELECT 1 FROM bot_scenarios existing
		WHERE existing.trigger_value = s.trigger_value || '_ad'
	);

-- 3. Шаги — копируются как есть, вместе с задержками, кнопками и вложениями
INSERT INTO bot_scenario_steps (
	scenario_id, position, delay_seconds, message_text,
	button_text, button_url, condition, button_action,
	start_scenario_id, add_tags, set_stage,
	file_name, file_path, file_telegram_id
)
SELECT
	copy.id, src_step.position, src_step.delay_seconds, src_step.message_text,
	src_step.button_text, src_step.button_url, src_step.condition, src_step.button_action,
	src_step.start_scenario_id, src_step.add_tags, src_step.set_stage,
	src_step.file_name, src_step.file_path, src_step.file_telegram_id
FROM bot_scenarios copy
JOIN bot_scenarios src ON src.trigger_value || '_ad' = copy.trigger_value AND src.id IN (2, 4)
JOIN bot_scenario_steps src_step ON src_step.scenario_id = src.id
WHERE copy.trigger_value IN ('otpusk_ad', 'focus_ad')
	AND NOT EXISTS (
		SELECT 1 FROM bot_scenario_steps existing WHERE existing.scenario_id = copy.id
	);

-- 4. Шлагбаум первым шагом. Позиция MIN(position) - 1, чтобы не сдвигать копии.
INSERT INTO bot_scenario_steps (
	scenario_id, position, delay_seconds, message_text,
	button_text, button_url, condition, button_action, add_tags
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
WHERE s.trigger_value IN ('otpusk_ad', 'focus_ad')
	AND NOT EXISTS (
		SELECT 1 FROM bot_scenario_steps existing
		WHERE existing.scenario_id = s.id AND existing.button_action = 'check_subscription'
	);

-- Проверка: у копий шлагбаум должен стоять первым, оригиналы — без изменений
SELECT
	sc.id AS scenario_id,
	sc.name,
	sc.trigger_value,
	st.position,
	COALESCE(st.condition::text, 'всегда') AS condition,
	st.button_action,
	LEFT(COALESCE(st.message_text, ''), 40) AS message_start
FROM bot_scenarios sc
JOIN bot_scenario_steps st ON st.scenario_id = sc.id
WHERE sc.trigger_value IN ('otpusk', 'focus', 'otpusk_ad', 'focus_ad')
ORDER BY sc.trigger_value, st.position;
