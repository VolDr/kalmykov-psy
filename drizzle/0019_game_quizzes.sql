-- Викторины для игры с друзьями. Комнаты живут в памяти сервера, в БД только сами викторины.
CREATE TABLE IF NOT EXISTS "game_quizzes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"time_limit" integer DEFAULT 20 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
