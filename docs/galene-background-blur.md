# Видеовстречи: размытие фона

SvelteKit /meet uses the same MediaPipe segmentation worker algorithm as Galene's upstream
MIT-licensed static/filter.js and static/background-blur-worker.js. Processing is
**on the participant's device**, not the Galene VPS. Browser may lower frame rate
on older phones. The feature is optional and off by default.

## Install third-party model files once on box-758667

Galene itself is **already running**. Do not rebuild or reinstall its Go binary.
These commands only add static assets used by the web client's blur worker.

    mkdir -p /opt/galene/static/third-party
    cd /tmp
    curl -fL https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.21.tgz -o tasks-vision.tgz
    mkdir -p /tmp/galene-mediapipe
    tar xzf /tmp/tasks-vision.tgz -C /tmp/galene-mediapipe
    cp -a /tmp/galene-mediapipe/package /opt/galene/static/third-party/tasks-vision
    mkdir -p /opt/galene/static/third-party/tasks-vision/models
    curl -fL https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite -o /opt/galene/static/third-party/tasks-vision/models/selfie_segmenter.tflite
    chown -R galene:galene /opt/galene/static/third-party/tasks-vision

No service restart is required. Confirm:

    curl -I http://127.0.0.1:8443/third-party/tasks-vision/vision_bundle.mjs
    curl -I https://kalmykov-psy.ru/api/meet/blur-assets/vision_bundle.mjs

Both should return HTTP 200 after deploying the site.

The browser loads /meet/background-blur-worker.js from the SvelteKit static
directory. SvelteKit proxies only allowlisted MediaPipe files from local Galene
via /api/meet/blur-assets/[...asset], so the Web Worker does not need CORS.

CSP must permit same-origin Web Workers, WASM compilation, and same-origin
network requests. If the browser shows a Content Security Policy error,
adjust the existing policy narrowly rather than turning the policy off.

The button with the sparkle icon appears before joining and during the call.
The original camera and microphone tracks are not uploaded when blur is active;
the outgoing video track is built from a canvas in the user's browser.
