/**
 * Adaptation of Galene's MIT-licensed background-blur filter.
 * Original: https://github.com/jech/galene/blob/master/static/filter.js
 * Copyright (c) 2020-2026 Juliusz Chroboczek.
 *
 * Segmentation is performed in a Web Worker, using an optional MediaPipe
 * package served by our Galene instance. Unfiltered frames stay in-browser.
 */
export type BlurSession = {
	stream: MediaStream;
	stop: () => void;
};

type MaskResult = { bitmap: ImageBitmap; mask: ImageBitmap };

function workerSendReceive<T>(worker: Worker, data: unknown, transfer?: Transferable[]): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			worker.onmessage = null;
			worker.onerror = null;
			reject(new Error('Время ожидания обработки фона истекло.'));
		}, 20000);
		worker.onmessage = (event: MessageEvent) => {
			window.clearTimeout(timeout);
			worker.onmessage = null;
			worker.onerror = null;
			if (event.data instanceof Error) reject(event.data);
			else resolve(event.data as T);
		};
		worker.onerror = (event) => {
			window.clearTimeout(timeout);
			worker.onmessage = null;
			worker.onerror = null;
			reject(new Error(event.message || 'Не удалось запустить размытие фона.'));
		};
		worker.postMessage(data, transfer || []);
	});
}

export async function blurAvailable(): Promise<boolean> {
	if (typeof window === 'undefined') return false;
	if (typeof HTMLCanvasElement.prototype.captureStream !== 'function' || !window.Worker) return false;
	try {
		const result = await fetch('/api/meet/blur-assets/vision_bundle.mjs', { method: 'HEAD' });
		return result.ok;
	} catch {
		return false;
	}
}

export async function createBackgroundBlur(input: MediaStream): Promise<BlurSession> {
	const track = input.getVideoTracks()[0];
	if (!track) throw new Error('Для размытия нужно включить камеру.');
	if (!(await blurAvailable())) throw new Error('Библиотека размытия фона не установлена на сервере.');

	const video = document.createElement('video');
	video.muted = true;
	video.playsInline = true;
	video.autoplay = true;
	video.srcObject = input;
	const canvas = document.createElement('canvas');
	const settings = track.getSettings();
	canvas.width = settings.width || 640;
	canvas.height = settings.height || 480;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Ваш браузер не поддерживает обработку видео.');

	let worker: Worker | null = null;
	let timer: number | undefined;
	let capture: MediaStream | null = null;
	let done = false;
	let busy = false;

	function stop() {
		if (done) return;
		done = true;
		if (timer !== undefined) window.clearInterval(timer);
		worker?.terminate();
		worker = null;
		capture?.getTracks().forEach(t => t.stop());
		video.pause();
		video.srcObject = null;
	}

	try {
		capture = canvas.captureStream(0);
		let outputTrack = capture.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
		let fixedRate = false;
		if (typeof outputTrack.requestFrame !== 'function') {
			capture.getTracks().forEach(t => t.stop());
			capture = canvas.captureStream(15);
			outputTrack = capture.getVideoTracks()[0];
			fixedRate = true;
		}
		const output = new MediaStream([outputTrack, ...input.getAudioTracks()]);
		await video.play();

		worker = new Worker('/meet/background-blur-worker.js');
		await workerSendReceive<void>(worker, {
			model: '/api/meet/blur-assets/models/selfie_segmenter.tflite'
		});

		const tick = async () => {
			if (done || busy || !worker || !video.videoWidth || !video.videoHeight) return;
			busy = true;
			let bitmap: ImageBitmap | null = null;
			try {
				bitmap = await createImageBitmap(video);
				const result = await workerSendReceive<MaskResult>(worker, {
					bitmap, timestamp: performance.now()
				}, [bitmap]);
				if (done || !result || !result.mask) return;
				bitmap = result.bitmap;
				const mask = result.mask;
				try {
					if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
						canvas.width = video.videoWidth;
						canvas.height = video.videoHeight;
					}
					// Same alpha-compositing steps as Galene's filter.js:
					// blur only the background; retain crisp foreground edges.
					ctx.globalCompositeOperation = 'copy';
					ctx.drawImage(mask, 0, 0);
					ctx.globalCompositeOperation = 'source-in';
					ctx.drawImage(bitmap, 0, 0);
					if ('filter' in ctx) {
						ctx.globalCompositeOperation = 'copy';
						ctx.filter = 'blur(' + video.videoWidth / 48 + 'px)';
						ctx.drawImage(canvas, 0, 0);
						ctx.filter = 'none';
					} else {
						const small = document.createElement('canvas');
						small.width = Math.max(1, Math.round(video.videoWidth / 24));
						small.height = Math.max(1, Math.round(video.videoHeight / 24));
						small.getContext('2d')?.drawImage(canvas, 0, 0, small.width, small.height);
						ctx.globalCompositeOperation = 'source-atop';
						ctx.drawImage(small, 0, 0, video.videoWidth, video.videoHeight);
					}
					ctx.globalCompositeOperation = 'destination-atop';
					ctx.drawImage(bitmap, 0, 0);
					ctx.globalCompositeOperation = 'source-over';
					if (!fixedRate) outputTrack.requestFrame?.();
				} finally {
					mask.close();
				}
			} catch (error) {
				// Rendering failures should not affect audio or the call UI.
				console.warn('Background blur frame', error);
			} finally {
				bitmap?.close();
				busy = false;
			}
		};
		timer = window.setInterval(tick, 1000 / 15);
		return { stream: output, stop };
	} catch (error) {
		stop();
		throw error;
	}
}
