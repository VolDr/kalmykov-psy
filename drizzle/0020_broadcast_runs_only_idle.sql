-- Запуск рассылки с галочкой «только тем, у кого нет активной цепочки»: помечаем это
-- в истории запусков. У старых записей false — раньше такого режима не было.
ALTER TABLE "bot_broadcast_runs" ADD COLUMN IF NOT EXISTS "only_idle" boolean DEFAULT false NOT NULL;
