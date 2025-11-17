-- Migration: Add canvas_scene_id to clients table
-- This allows each client to have their own canvas scene

ALTER TABLE clients ADD COLUMN IF NOT EXISTS canvas_scene_id UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_canvas_shared BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_canvas_scene_id ON clients(canvas_scene_id);
