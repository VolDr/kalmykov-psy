<script lang="ts">
	import { writable, get } from 'svelte/store';
	import { onDestroy } from 'svelte';
	import {
		createSyncClient,
		createHistoryStore,
		generateClientId,
		createAddShapesOp,
		createUpdateShapesOp,
		createDeleteShapesOp,
		type Presence,
		type RectShape,
		type SyncClient
	} from '$lib/canvas';

	// Local state
	let wsUrl = $state('ws://localhost:3001');
	let sceneId = $state('test-scene-001');
	let clientId = $state(generateClientId());
	let userName = $state('DebugClient');
	let userId = $state('user-debug-001');

	// Stores
	const historyStore = createHistoryStore(50);
	const cameraStore = writable({ x: 0, y: 0, scale: 1 });

	// Client instance
	let syncClient: SyncClient | null = $state(null);

	// UI state
	let connected = $state(false);
	let status = $state('disconnected');
	let messageLog: string[] = $state([]);
	let remoteUsers: Presence[] = $state([]);
	let localShapes = $state(0);

	// Message counter
	let sentCount = $state(0);
	let receivedCount = $state(0);
	let offlineQueueSize = $state(0);

	// Subscriptions cleanup
	const unsubscribers: (() => void)[] = [];

	function log(msg: string) {
		const timestamp = new Date().toLocaleTimeString();
		messageLog = [...messageLog.slice(-100), `[${timestamp}] ${msg}`];
		console.log(msg);
	}

	function connect() {
		if (syncClient) return;

		log(`Connecting to ${wsUrl} with clientId: ${clientId}`);

		const client = createSyncClient({
			url: wsUrl,
			sceneId,
			clientId,
			historyStore,
			cameraStore,
			userName,
			userId,
			reconnectAttempts: 3,
			reconnectDelay: 1000,
			presenceDebounceMs: 50,
			maxOfflineQueueSize: 100
		});

		syncClient = client;

		// Subscribe to status
		const statusUnsub = client.status.subscribe((s) => {
			status = s;
			connected = s === 'connected';
			offlineQueueSize = client.offlineQueueSize();
			log(`Status: ${s}`);
		});
		unsubscribers.push(statusUnsub);

		// Subscribe to remote presences
		const presenceUnsub = client.remotePresences.subscribe((presences) => {
			remoteUsers = Array.from(presences.values());
			log(`Remote users: ${presences.size}`);
		});
		unsubscribers.push(presenceUnsub);

		// Subscribe to shapes changes
		const shapesUnsub = historyStore.subscribe((state) => {
			localShapes = state.shapes.length;
		});
		unsubscribers.push(shapesUnsub);

		client.connect();
	}

	function disconnect() {
		if (!syncClient) return;
		log('Disconnecting...');
		syncClient.disconnect();
		syncClient = null;
		connected = false;

		// Cleanup subscriptions
		unsubscribers.forEach((unsub) => unsub());
		unsubscribers.length = 0;
	}

	function sendTestAddOperation() {
		if (!syncClient) {
			log('ERROR: Not connected');
			return;
		}

		const testRect: RectShape = {
			id: `rect-${Date.now()}`,
			type: 'rect',
			x: Math.random() * 500,
			y: Math.random() * 500,
			width: 100,
			height: 50,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke:
				'#' +
				Math.floor(Math.random() * 16777215)
					.toString(16)
					.padStart(6, '0'),
			strokeWidth: 2
		};

		const op = createAddShapesOp(sceneId, clientId, [testRect]);
		syncClient.sendOperation(op);
		sentCount++;
		log(`SENT addShapes: ${testRect.id}`);
	}

	function sendTestUpdateOperation() {
		if (!syncClient) {
			log('ERROR: Not connected');
			return;
		}

		const state = get(historyStore);
		if (state.shapes.length === 0) {
			log('ERROR: No shapes to update');
			return;
		}

		const shape = { ...state.shapes[0], x: Math.random() * 500 };
		const op = createUpdateShapesOp(sceneId, clientId, [shape]);
		syncClient.sendOperation(op);
		sentCount++;
		log(`SENT updateShapes: ${shape.id}`);
	}

	function sendTestDeleteOperation() {
		if (!syncClient) {
			log('ERROR: Not connected');
			return;
		}

		const state = get(historyStore);
		if (state.shapes.length === 0) {
			log('ERROR: No shapes to delete');
			return;
		}

		const id = state.shapes[0].id;
		const op = createDeleteShapesOp(sceneId, clientId, [id]);
		syncClient.sendOperation(op);
		sentCount++;
		log(`SENT deleteShapes: ${id}`);
	}

	function sendPresenceUpdate() {
		if (!syncClient) {
			log('ERROR: Not connected');
			return;
		}

		syncClient.sendPresence({
			cursor: {
				x: Math.random() * 800,
				y: Math.random() * 600
			},
			selectedIds: []
		});
		log('SENT presence update');
	}

	function clearLog() {
		messageLog = [];
	}

	function regenerateClientId() {
		clientId = generateClientId();
		log(`New clientId: ${clientId}`);
	}

	function copyDebugInfo() {
		const info = `
WSS URL: ${wsUrl}
SceneId: ${sceneId}
ClientId: ${clientId}
Status: ${status}
Sent: ${sentCount}
Received: ${receivedCount}
Offline Queue: ${offlineQueueSize}
Local Shapes: ${localShapes}
Remote Users: ${remoteUsers.length}
    `.trim();
		navigator.clipboard.writeText(info);
		log('Debug info copied to clipboard');
	}

	onDestroy(() => {
		disconnect();
	});
</script>

<svelte:head>
	<title>WSS Sync Debug</title>
</svelte:head>

<div class="mx-auto max-w-6xl p-8">
	<h1 class="mb-6 text-3xl font-bold">WSS Multiplayer Sync Debug</h1>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Connection Control -->
		<div class="rounded bg-gray-100 p-4">
			<h2 class="mb-4 text-xl font-bold">Connection</h2>
			<div class="grid gap-3">
				<div>
					<label class="mb-1 block text-sm font-medium" for="ws-url">WebSocket URL</label>
					<input
						id="ws-url"
						type="text"
						bind:value={wsUrl}
						placeholder="ws://localhost:3001"
						class="w-full rounded border p-2"
						disabled={connected}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium" for="scene-id">Scene ID</label>
					<input
						id="scene-id"
						type="text"
						bind:value={sceneId}
						placeholder="Scene ID"
						class="w-full rounded border p-2"
						disabled={connected}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium" for="user-name">User Name</label>
					<input
						id="user-name"
						type="text"
						bind:value={userName}
						placeholder="User Name"
						class="w-full rounded border p-2"
						disabled={connected}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium" for="client-id">Client ID</label>
					<div class="flex gap-2">
						<input
							id="client-id"
							type="text"
							bind:value={clientId}
							class="flex-1 rounded border p-2 font-mono text-sm"
							disabled={connected}
						/>
						<button
							onclick={regenerateClientId}
							disabled={connected}
							class="rounded bg-gray-500 px-3 py-2 text-white hover:bg-gray-600 disabled:opacity-50"
						>
							New
						</button>
					</div>
				</div>

				<div class="mt-2 flex gap-2">
					<button
						onclick={connect}
						disabled={connected}
						class="flex-1 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
					>
						Connect
					</button>
					<button
						onclick={disconnect}
						disabled={!connected}
						class="flex-1 rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
					>
						Disconnect
					</button>
				</div>

				<div class="mt-2 grid grid-cols-2 gap-2 text-sm">
					<div class="rounded bg-white p-2">
						Status: <strong class="text-blue-600">{status}</strong>
					</div>
					<div class="rounded bg-white p-2">
						Queue: <strong>{offlineQueueSize}</strong>
					</div>
					<div class="rounded bg-white p-2">
						Sent: <strong class="text-green-600">{sentCount}</strong>
					</div>
					<div class="rounded bg-white p-2">
						Local Shapes: <strong>{localShapes}</strong>
					</div>
				</div>
			</div>
		</div>

		<!-- Operation Tests -->
		<div class="rounded bg-gray-100 p-4">
			<h2 class="mb-4 text-xl font-bold">Send Operations</h2>
			<div class="grid gap-3">
				<button
					onclick={sendTestAddOperation}
					disabled={!connected}
					class="rounded bg-green-500 px-4 py-3 font-medium text-white hover:bg-green-600 disabled:opacity-50"
				>
					Add Random Shape
				</button>
				<button
					onclick={sendTestUpdateOperation}
					disabled={!connected}
					class="rounded bg-yellow-500 px-4 py-3 font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
				>
					Update First Shape
				</button>
				<button
					onclick={sendTestDeleteOperation}
					disabled={!connected}
					class="rounded bg-red-500 px-4 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50"
				>
					Delete First Shape
				</button>
				<button
					onclick={sendPresenceUpdate}
					disabled={!connected}
					class="rounded bg-purple-500 px-4 py-3 font-medium text-white hover:bg-purple-600 disabled:opacity-50"
				>
					Send Presence Update
				</button>
			</div>

			<!-- Remote Users -->
			<div class="mt-4">
				<h3 class="mb-2 font-bold">Remote Users ({remoteUsers.length})</h3>
				{#if remoteUsers.length > 0}
					<div class="max-h-40 space-y-2 overflow-y-auto">
						{#each remoteUsers as user (user.clientId)}
							<div class="rounded border bg-white p-2">
								<div class="font-bold">{user.name || 'Anonymous'}</div>
								<div class="font-mono text-xs text-gray-600">
									{user.clientId.slice(0, 12)}...
								</div>
								{#if user.cursor}
									<div class="text-sm">
										Cursor: ({user.cursor.x.toFixed(0)}, {user.cursor.y.toFixed(0)})
									</div>
								{/if}
								{#if user.selectedIds && user.selectedIds.length > 0}
									<div class="text-sm">Selected: {user.selectedIds.length} shapes</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-sm text-gray-500">No remote users connected</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Message Log -->
	<div class="mt-6 rounded bg-gray-800 p-4 font-mono text-sm text-white">
		<div class="mb-2 flex items-center justify-between">
			<h2 class="font-bold">Message Log ({messageLog.length})</h2>
			<div class="flex gap-2">
				<button
					onclick={copyDebugInfo}
					class="rounded bg-gray-600 px-3 py-1 text-xs hover:bg-gray-700"
				>
					Copy Debug Info
				</button>
				<button onclick={clearLog} class="rounded bg-gray-600 px-3 py-1 text-xs hover:bg-gray-700">
					Clear
				</button>
			</div>
		</div>
		<div class="h-64 overflow-y-auto rounded bg-black p-2">
			{#each messageLog as msg}
				<div class="py-0.5">{msg}</div>
			{/each}
			{#if messageLog.length === 0}
				<div class="text-gray-500">No messages yet...</div>
			{/if}
		</div>
	</div>

	<!-- Instructions -->
	<div class="mt-6 rounded bg-blue-50 p-4">
		<h2 class="mb-2 font-bold">Instructions</h2>
		<ul class="list-inside list-disc space-y-1 text-sm">
			<li>Start a WebSocket server on the specified URL (default: ws://localhost:3001)</li>
			<li>
				Server must implement the sync protocol (see <code>src/lib/canvas/sync/server.ts</code> for example)
			</li>
			<li>Click "Connect" to establish connection and join the scene</li>
			<li>Use operation buttons to test addShapes, updateShapes, deleteShapes</li>
			<li>Open multiple tabs with different Client IDs to test multiplayer</li>
			<li>Presence updates show cursor position and selected shapes</li>
			<li>Offline queue stores operations when disconnected</li>
		</ul>
	</div>
</div>
