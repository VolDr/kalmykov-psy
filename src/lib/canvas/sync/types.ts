// src/lib/canvas/sync/types.ts

import type { Shape, Camera } from '../model/shapes';

// Operation Types for multiplayer sync
export type OpType = 'addShapes' | 'updateShapes' | 'deleteShapes' | 'setCamera';

export interface OperationBase {
	opId: string; // unique operation ID (crypto.randomUUID())
	sceneId: string;
	clientId: string; // socket/client identifier
	timestamp: number;
}

export interface AddShapesOp extends OperationBase {
	type: 'addShapes';
	shapes: Shape[];
}

export interface UpdateShapesOp extends OperationBase {
	type: 'updateShapes';
	shapes: Shape[];
}

export interface DeleteShapesOp extends OperationBase {
	type: 'deleteShapes';
	ids: string[];
}

export interface SetCameraOp extends OperationBase {
	type: 'setCamera';
	camera: Camera;
}

export type Operation = AddShapesOp | UpdateShapesOp | DeleteShapesOp | SetCameraOp;

// Presence types for cursor/selection sharing
export interface Presence {
	clientId: string;
	userId?: string;
	sceneId: string;
	cursor?: { x: number; y: number };
	selectedIds?: string[];
	color?: string; // unique color per user
	name?: string;
	lastSeen: number;
}

// Message types for WebSocket communication
export type ClientMessageType = 'operation' | 'presence' | 'join' | 'leave';

export interface JoinMessage {
	type: 'join';
	sceneId: string;
	clientId: string;
	userId?: string;
	name?: string;
}

export interface LeaveMessage {
	type: 'leave';
	sceneId: string;
	clientId: string;
}

export interface OperationMessage {
	type: 'operation';
	operation: Operation;
}

export interface PresenceMessage {
	type: 'presence';
	presence: Presence;
}

export type ClientMessage = JoinMessage | LeaveMessage | OperationMessage | PresenceMessage;

// Server-to-client messages
export type ServerMessageType =
	| 'operation'
	| 'presence'
	| 'presenceList'
	| 'joined'
	| 'userJoined'
	| 'userLeft'
	| 'error';

export interface ServerOperationMessage {
	type: 'operation';
	operation: Operation;
}

export interface ServerPresenceMessage {
	type: 'presence';
	presence: Presence;
}

export interface ServerPresenceListMessage {
	type: 'presenceList';
	presences: Presence[];
}

export interface ServerJoinedMessage {
	type: 'joined';
	clientId: string;
	sceneId: string;
}

export interface ServerUserJoinedMessage {
	type: 'userJoined';
	presence: Presence;
}

export interface ServerUserLeftMessage {
	type: 'userLeft';
	clientId: string;
}

export interface ServerErrorMessage {
	type: 'error';
	message: string;
	code?: string;
}

export type ServerMessage =
	| ServerOperationMessage
	| ServerPresenceMessage
	| ServerPresenceListMessage
	| ServerJoinedMessage
	| ServerUserJoinedMessage
	| ServerUserLeftMessage
	| ServerErrorMessage;

// Helper function to generate operation ID
export function generateOpId(): string {
	return crypto.randomUUID();
}

// Helper function to generate client ID
export function generateClientId(): string {
	return crypto.randomUUID();
}

// Helper function to create operations
export function createAddShapesOp(
	sceneId: string,
	clientId: string,
	shapes: Shape[]
): AddShapesOp {
	return {
		type: 'addShapes',
		opId: generateOpId(),
		sceneId,
		clientId,
		timestamp: Date.now(),
		shapes
	};
}

export function createUpdateShapesOp(
	sceneId: string,
	clientId: string,
	shapes: Shape[]
): UpdateShapesOp {
	return {
		type: 'updateShapes',
		opId: generateOpId(),
		sceneId,
		clientId,
		timestamp: Date.now(),
		shapes
	};
}

export function createDeleteShapesOp(
	sceneId: string,
	clientId: string,
	ids: string[]
): DeleteShapesOp {
	return {
		type: 'deleteShapes',
		opId: generateOpId(),
		sceneId,
		clientId,
		timestamp: Date.now(),
		ids
	};
}

export function createSetCameraOp(
	sceneId: string,
	clientId: string,
	camera: Camera
): SetCameraOp {
	return {
		type: 'setCamera',
		opId: generateOpId(),
		sceneId,
		clientId,
		timestamp: Date.now(),
		camera
	};
}
