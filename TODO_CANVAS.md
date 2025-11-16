# Canvas Module TODO List (Prioritized)

## Status: MVP Complete ✅

### What's Implemented
- ✅ Primitive types: rect, ellipse, text, arrow, group (model)
- ✅ Postgres storage with JSONB (API + migration)
- ✅ Undo/Redo with 50+ action history
- ✅ Hotkeys RU/EN compatible (using KeyboardEvent.code)
- ✅ Infinite canvas (pan + zoom)
- ✅ Basic operations: select, move, delete, duplicate
- ✅ Arrow magnets (snap to anchors)
- ✅ Text labels (standalone + inside shapes)
- ✅ Comprehensive test suite (62 tests)

---

## Priority 1: Core UX (Critical)

### 1.1 Shape Transformation (resize + rotate)
**Why**: Users expect to resize/rotate shapes, not just move them.
- [ ] Add Konva.Transformer on shape selection
- [ ] Handle `transformend` event → update width/height/rotation
- [ ] Normalize transforms: store actual dimensions, reset scaleX/scaleY to 1
- [ ] Update `getShapeBounds()` to account for rotation
- [ ] Multi-shape transformer for group selection
- [ ] Tests for transform operations

**Files to modify:**
- `src/lib/canvas/ui/Canvas.svelte`
- `src/lib/canvas/engine/magnets.ts`
- `src/lib/canvas/model/history.ts` (new action type: 'transform')

### 1.2 Tool Modes (drawing new shapes)
**Why**: Currently can only modify existing shapes, not create new ones via canvas.
- [ ] Create `src/lib/canvas/stores/tool.ts` with modes: select, rect, ellipse, arrow, text, pan
- [ ] Create `src/lib/canvas/ui/Toolbar.svelte` component
- [ ] Hotkeys for tool switching: V (select), R (rect), E (ellipse), A (arrow), T (text), H (pan)
- [ ] Implement drawing logic per tool:
  - rect/ellipse: mousedown → drag → mouseup creates shape
  - arrow: click start → click end with magnet snapping
  - text: click → inline editing
- [ ] Update Canvas.svelte to use tool store

**Files to create:**
- `src/lib/canvas/stores/tool.ts`
- `src/lib/canvas/ui/Toolbar.svelte`

### 1.3 Box Selection
**Why**: Users need to select multiple shapes at once by drawing a rectangle.
- [ ] Add selection box rendering (dashed rectangle)
- [ ] Calculate intersection with shape bounds
- [ ] Update selection store with all intersecting shapes
- [ ] Modifier keys: Shift to add to selection, Alt to remove

**Files to modify:**
- `src/lib/canvas/ui/Canvas.svelte`
- `src/lib/canvas/engine/magnets.ts` (add bounds intersection helper)

---

## Priority 2: Improved Arrows

### 2.1 Bidirectional Arrow Binding
**Why**: Arrows should update when connected shapes move.
- [ ] Track arrow attachments in both directions (shape knows its arrows)
- [ ] On shape update, recalculate arrow endpoints
- [ ] Option A: Store arrow points as offsets from anchors
- [ ] Option B: Recompute absolute points on render

**Files to modify:**
- `src/lib/canvas/model/history.ts`
- `src/lib/canvas/ui/Canvas.svelte`

### 2.2 Arrow Head/Tail Editing
**Why**: Users should be able to drag arrow endpoints independently.
- [ ] Render draggable handles at arrow start/end
- [ ] On handle drag → update points array
- [ ] Snap to nearest anchor on drag end

### 2.3 Bezier/Curved Arrows
**Why**: Better visual representation for complex diagrams.
- [ ] Add `curveType` to ArrowShape: 'linear' | 'bezier' | 'elbow'
- [ ] Implement path calculation for each type
- [ ] Control points for bezier curves

---

## Priority 3: Group Operations

### 3.1 Logical Grouping
**Why**: Group multiple shapes to move/transform together.
- [ ] Implement `groupSelected()` function
  - Create GroupShape with children = selected IDs
  - Record in history (type: 'group')
- [ ] Implement `ungroupSelected()` function
  - Remove GroupShape, preserve children
  - Record in history (type: 'ungroup')
- [ ] Hotkeys: Ctrl+G (group), Ctrl+Shift+G (ungroup)

**Files to modify:**
- `src/lib/canvas/stores.ts`
- `src/lib/canvas/model/history.ts`

### 3.2 Group Rendering
**Why**: Visual feedback for grouped elements.
- [ ] Option A: Draw bounding box around group
- [ ] Option B: Add group label/indicator
- [ ] Recursive transform: moving group moves all children

---

## Priority 4: Polish & UX

### 4.1 Inline Text Editing
**Why**: Users should edit text directly on canvas.
- [ ] Double-click on TextShape → open inline editor
- [ ] Double-click on rect/ellipse with text → edit label
- [ ] Handle keyboard input, cursor positioning
- [ ] Apply changes on blur or Enter

### 4.2 Context Menu
**Why**: Right-click actions for common operations.
- [ ] Create ContextMenu component
- [ ] Actions: Delete, Duplicate, Bring to Front, Send to Back, Group, Ungroup
- [ ] Layer management (z-index)

### 4.3 Keyboard Shortcuts Panel
**Why**: Discoverability for power users.
- [ ] Create ShortcutsPanel component
- [ ] Toggle with `?` key
- [ ] List all available shortcuts

### 4.4 Grid & Snapping
**Why**: Align shapes precisely.
- [ ] Render background grid (optional)
- [ ] Snap to grid on move/resize
- [ ] Smart guides (alignment helpers)

---

## Priority 5: Rough.js Integration

### 5.1 Hand-drawn Style Rendering
**Why**: Core Excalidraw aesthetic.
- [ ] Install roughjs: `npm install roughjs`
- [ ] Create offscreen canvas for rough rendering
- [ ] Implement RoughRect, RoughEllipse wrappers
- [ ] Cache rendered shapes by ID + hash of properties
- [ ] Display via Konva.Image

**Example implementation:**
```typescript
import rough from 'roughjs';

function renderRoughRect(rect: RectShape): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const rc = rough.canvas(canvas);
  rc.rectangle(0, 0, rect.width, rect.height, {
    roughness: rect.roughOptions?.roughness ?? 1,
    bowing: rect.roughOptions?.bowing ?? 1,
    stroke: rect.stroke,
    fill: rect.fill,
    fillStyle: 'hachure'
  });
  return canvas;
}
```

**Files to create:**
- `src/lib/canvas/engine/rough.ts`
- `src/lib/canvas/ui/RoughShape.svelte`

### 5.2 Rough Style Controls
**Why**: Customize hand-drawn appearance.
- [ ] Add roughness slider (0-3)
- [ ] Bowing control
- [ ] Fill style: hachure, solid, cross-hatch, dots
- [ ] Seed for consistent randomness

---

## Priority 6: Advanced Features

### 6.1 Copy/Paste with Clipboard
- [ ] Ctrl+C → serialize selected shapes to clipboard
- [ ] Ctrl+V → deserialize and add with offset
- [ ] Handle browser clipboard API

### 6.2 Export Options
- [ ] Export to PNG (Konva.toDataURL)
- [ ] Export to SVG
- [ ] Export to JSON (scene data)

### 6.3 Collaboration (Future)
- [ ] Real-time sync via WebSocket
- [ ] Conflict resolution for concurrent edits
- [ ] User cursors/presence indicators

### 6.4 Camera in History
- [ ] Include camera state in undo/redo
- [ ] Navigate back to previous viewports

---

## Implementation Order (Recommended)

1. **Week 1**: Shape Transformation (1.1)
2. **Week 2**: Tool Modes + Toolbar (1.2)
3. **Week 3**: Box Selection (1.3) + Inline Text Editing (4.1)
4. **Week 4**: Improved Arrows (2.1, 2.2)
5. **Week 5**: Rough.js Integration (5.1)
6. **Week 6**: Group Operations (3.1, 3.2)
7. **Week 7**: Polish (4.2, 4.3, 4.4)
8. **Week 8**: Advanced Features (6.x)

---

## Quick Wins (Can be done anytime)

- [ ] Add color picker for stroke/fill
- [ ] Add stroke width control
- [ ] Save/Load scenes from localStorage
- [ ] Keyboard navigation: Arrow keys to move selected shapes
- [ ] Zoom controls: + / - keys, zoom to fit
- [ ] Recent scenes list on demo page
