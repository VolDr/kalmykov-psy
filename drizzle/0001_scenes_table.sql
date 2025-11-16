-- Create scenes table for storing Excalidraw-like canvas data
CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster queries by updated_at
CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON scenes (updated_at DESC);
