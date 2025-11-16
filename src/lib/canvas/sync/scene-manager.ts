// src/lib/canvas/sync/scene-manager.ts
// Scene data manager for applying operations to Postgres

import type { Operation } from './types';
import type { SceneData, Shape } from '../model/shapes';

export interface SceneManagerOptions {
	loadScene: (sceneId: string) => Promise<SceneData | null>;
	saveScene: (sceneId: string, data: SceneData) => Promise<void>;
}

export class SceneManager {
	private cache: Map<string, SceneData> = new Map();
	private dirtyScenes: Set<string> = new Set();
	private options: SceneManagerOptions;

	constructor(options: SceneManagerOptions) {
		this.options = options;
	}

	async applyOperation(sceneId: string, operation: Operation): Promise<void> {
		// Load scene if not cached
		if (!this.cache.has(sceneId)) {
			const data = await this.options.loadScene(sceneId);
			if (data) {
				this.cache.set(sceneId, data);
			} else {
				// Create empty scene
				this.cache.set(sceneId, { shapes: [] });
			}
		}

		const sceneData = this.cache.get(sceneId)!;

		switch (operation.type) {
			case 'addShapes':
				sceneData.shapes = [...sceneData.shapes, ...operation.shapes];
				break;

			case 'updateShapes':
				sceneData.shapes = sceneData.shapes.map((s) => {
					const found = operation.shapes.find((u) => u.id === s.id);
					return found ?? s;
				});
				break;

			case 'deleteShapes':
				sceneData.shapes = sceneData.shapes.filter((s) => !operation.ids.includes(s.id));
				break;

			case 'setCamera':
				// Camera is usually per-client, not saved to scene
				// But can be stored if needed for shared viewport
				break;
		}

		this.dirtyScenes.add(sceneId);
	}

	async saveScene(sceneId: string): Promise<void> {
		const data = this.cache.get(sceneId);
		if (!data) return;

		await this.options.saveScene(sceneId, data);
		this.dirtyScenes.delete(sceneId);
	}

	async saveDirtyScenes(): Promise<void> {
		const scenes = Array.from(this.dirtyScenes);
		for (const sceneId of scenes) {
			await this.saveScene(sceneId);
		}
	}

	getSceneData(sceneId: string): SceneData | undefined {
		return this.cache.get(sceneId);
	}

	clearCache(sceneId: string): void {
		this.cache.delete(sceneId);
		this.dirtyScenes.delete(sceneId);
	}

	isDirty(sceneId: string): boolean {
		return this.dirtyScenes.has(sceneId);
	}
}
