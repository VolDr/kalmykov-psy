// src/lib/canvas/index.ts
// Main entry point for the canvas module

// Models
export * from './model/shapes';
export * from './model/history';

// Engine
export * from './engine/magnets';

// Stores
export * from './stores';

// Sync (Multiplayer)
export * from './sync/types';
export * from './sync/client';

// UI Components
export { default as Canvas } from './ui/Canvas.svelte';
