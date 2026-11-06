/**
 * Longpipe's WebGPU/WebGL2 background effect. The camera image is processed
 * locally in the browser; only model weights are fetched from Longpipe CDN.
 * Keep the output MediaStream stable when switching between light/strong
 * modes, so Galene does not need to renegotiate its WebRTC connection.
 */
export type BlurStrength = 0.2 | 0.5 | 1.0;

export type BlurSession = {
	stream: MediaStream;
	ready: Promise<void>;
	setStrength(strength: BlurStrength): Promise<void>;
	stop(): void;
};

export async function createBackgroundBlur(
	input: MediaStream,
	strength: BlurStrength,
	onRuntimeError?: (message: string) => void
): Promise<BlurSession> {
	if (!input.getVideoTracks().length) {
		throw new Error('Для размытия необходимо включить камеру.');
	}

	// Dynamic import: no model is downloaded or initialized when the
	// participant selects "Off". The library is shipped by Vite in the
	// client build; no Node.js service or server GPU is required.
	const { EffectsPipeline } = await import('longpipe');
	let stopped = false;
	const pipeline = new EffectsPipeline(input, {
		background: { blur: { strength } },
		preset: 'auto',
		adaptive: true,
		audio: 'passthrough',
		onError: (error: { message: string; recoverable?: boolean }) => {
			if (!stopped && !error.recoverable) {
				onRuntimeError?.(error.message || 'Сбой обработки фона.');
			}
		}
	});

	return {
		stream: pipeline.stream,
		ready: pipeline.ready,
		async setStrength(next: BlurStrength) {
			if (stopped) return;
			await pipeline.ready;
			if (stopped) return;
			await pipeline.setBackground({ blur: { strength: next } });
		},
		stop() {
			if (stopped) return;
			stopped = true;
			pipeline.destroy();
		}
	};
}
