// src/lib/canvas/index.ts
// Main entry point for the canvas module

// Models
export * from './model/shapes';
export * from './model/history';

// Engine
export * from './engine/magnets';

// Stores
export * from './stores';

// Clipboard operations
export * from './clipboard';

// Grouping operations
export * from './grouping';

// Properties and styling
export * from './properties';

// Text editing
export * from './text-editing';

// Layers management
export * from './layers';

// Keyboard shortcuts
export * from './keyboard';

// Sync (Multiplayer)
export * from './sync/types';
export * from './sync/client';
export * from './sync/server';

// Validation
export * from './validation';

// UI Components
export { default as Canvas } from './ui/Canvas.svelte';
