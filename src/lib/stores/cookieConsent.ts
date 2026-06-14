import { writable } from 'svelte/store';

// true = баннер уже был показан/скрыт (либо решение принято ранее)
export const cookieBannerDone = writable(false);
