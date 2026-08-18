-- Глубина вложенных запусков «шаг стартует другую цепочку» переезжает из памяти
-- процесса в саму запись очереди: иначе цикл A → B → A с задержкой сбрасывал
-- счётчик на каждом проходе крона и крутился мимо MAX_CHAIN_DEPTH бесконечно.
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "chain_depth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Метка начала выдачи разбора опросника. Пара delivery_started_at + delivered_at
-- отличает «упало на середине» (повторить) от «человек ещё не прошёл шлагбаум»
-- (повторять нечего) — без неё подметание слало бы разборы неподписавшимся.
ALTER TABLE "quiz_results" ADD COLUMN IF NOT EXISTS "delivery_started_at" timestamp with time zone;
