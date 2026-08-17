import { browser } from '$app/environment';

/** Сколько держим цель после приземления, мс */
const SETTLE_MS = 1500;

/**
 * Приземление на секцию по ссылке вида /useful/...#acquaintance.
 *
 * Проблем тут две, и обе видны только при первой загрузке.
 *
 * 1. Высоты меняются уже после того, как браузер отскроллил к якорю: пока
 *    не применились веб-шрифты, текст выше цели занимает другую высоту, и
 *    секция уезжает на сотни пикселей.
 * 2. В app.css у html/body стоит scroll-behavior: smooth, поэтому нативный
 *    переход к якорю — это анимация на несколько тысяч пикселей. Она
 *    продолжает крутиться поверх нашего scrollIntoView и доводит страницу
 *    до цели, посчитанной по старым высотам.
 *
 * Поэтому на время приземления глушим smooth, скроллим мгновенно и
 * повторяем на каждое изменение высоты в течение SETTLE_MS. Отпускаем
 * управление, как только человек сам крутит колесо / жмёт клавишу —
 * именно по его действию, а не по изменению scrollY: во время нативной
 * анимации scrollY меняется сам по себе, и по нему нас не отличить.
 */
export function landOnHashTarget(el: HTMLElement) {
	if (!browser) return;

	// Секция могла быть спрятана reveal-анимацией: приземляться на невидимый
	// блок незачем — показываем сразу
	el.style.opacity = '';
	el.style.transform = '';
	el.style.transition = '';

	// Глушим smooth из app.css, иначе нативная анимация якоря перебьёт нас
	const root = document.documentElement;
	const prevScrollBehavior = root.style.scrollBehavior;
	root.style.scrollBehavior = 'auto';

	let released = false;
	const release = () => {
		released = true;
	};
	const releaseEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
	releaseEvents.forEach((type) => window.addEventListener(type, release, { passive: true }));

	const scrollToTarget = () => {
		if (released) return;
		el.scrollIntoView({ behavior: 'instant', block: 'start' });
	};

	scrollToTarget();

	// Высота документа меняется от подмены шрифтов и догрузки картинок.
	// requestAnimationFrame откладывает чтение DOM на следующий кадр —
	// синхронное чтение scrollY из ResizeObserver ломает scroll в Chrome.
	const observer = new ResizeObserver(() => requestAnimationFrame(scrollToTarget));
	observer.observe(document.body);

	document.fonts?.ready.then(scrollToTarget);

	setTimeout(() => {
		observer.disconnect();
		releaseEvents.forEach((type) => window.removeEventListener(type, release));
		root.style.scrollBehavior = prevScrollBehavior;
	}, SETTLE_MS);
}
