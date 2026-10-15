<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ ЧАСТЬ 5д:  РЕДИЗАЙН src/lib/components/layout/Footer.svelte
  ────────────────────────────────────────────────────────────────
  Полная замена компонента. ВСЯ логика подписки сохранена без
  изменений (email-валидация, две галочки, fetch /api/subscribe,
  состояния idle/loading/success/error). Изменён только визуал:
    • тёмная navy-подложка, светлый текст
    • бренд-знак — звезда-дудл + имя/роль
    • рукописный тег «будьте к себе добрее» с дудлом-сердцем
    • колонки «Разделы / Контакты / Рассылка», тёмная форма
  Данные из navigation.ts (navigationLinks, socialLinks,
  telegramChannel, footerInfo) — без изменений.
  Токены: font-caveat · bg-navy (см. app.css.additions.css).
  ════════════════════════════════════════════════════════════════
-->
<script lang="ts">
	import { socialLinks, footerInfo, navigationLinks, telegramChannel } from '$lib/data/navigation';

	const iconMap: Record<string, string> = {
		Telegram: 'icon-[ri--telegram-line]'
	};

	let email = $state('');
	let consent = $state(false);
	let privacyConsent = $state(false);
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let error = $state('');

	function validateEmail(e: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
	}

	const emailValid = $derived(validateEmail(email));
	const canSubmit = $derived(emailValid && consent && privacyConsent && status !== 'loading');

	async function handleSubscribe() {
		if (!canSubmit) return;

		status = 'loading';
		error = '';

		try {
			const response = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim() })
			});

			if (!response.ok) {
				throw new Error('Submit error');
			}

			status = 'success';
		} catch (err) {
			status = 'error';
			error = 'Произошла ошибка. Пожалуйста, попробуйте позже.';
		}
	}
</script>

<footer class="mt-20 w-full bg-navy pt-[72px] pb-[56px] text-white lg:pt-[88px] lg:pb-[72px]">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1000px] xl:px-0">
		<!-- верх: бренд + рукописный тег -->
		<div class="mb-12 flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between lg:mb-16">
			<div class="flex items-center gap-3.5">
				<div class="relative">
					<p class="text-[18px] leading-tight font-extrabold">Андрей Калмыков</p>
					<img
						src="/star_1.webp"
						class="pointer-events-none absolute top-0 right-0 h-6 w-6 rotate-12 lg:-top-[4%] lg:right-[17%]"
						alt=""
						aria-hidden="true"
					/>
					<p class="mt-1 text-sm text-white/50">Психолог · Терапия выгорания</p>
				</div>
			</div>
		</div>

		<!-- колонки -->

		<div class="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mb-14 lg:grid-cols-[2fr_1fr_1fr]">
			<div class="sm:col-span-2 lg:col-span-1">
				<p class="mb-4 text-xs font-bold tracking-widest text-white/35 uppercase">Рассылка</p>
				{#if status !== 'success'}
					<p class="mb-3.5 text-[15px] leading-relaxed text-white/55">
						Подпишитесь на рассылку, чтобы получать полезные материалы по работе с выгоранием и
						прокрастинацией
					</p>
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSubscribe();
						}}
						novalidate
						class="flex flex-col gap-3.5"
					>
						<div class="flex gap-2">
							<input
								id="email"
								type="email"
								autocomplete="email"
								bind:value={email}
								placeholder="Ваша почта"
								disabled={status === 'loading'}
								class="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white transition-colors placeholder:text-white/35 focus:border-primary focus:outline-none disabled:opacity-50"
							/>
							<button
								type="submit"
								disabled={!canSubmit}
								class="shrink-0 rounded-3xl bg-primary px-5 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
							>
								{status === 'loading' ? '...' : 'OK'}
							</button>
						</div>

						<div class="flex flex-col gap-2.5">
							<label class="flex cursor-pointer items-start gap-2.5">
								<input type="checkbox" bind:checked={consent} class="peer sr-only" />
								<span
									class="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-white/35 bg-white/5 transition-all peer-checked:border-primary peer-checked:bg-primary"
								>
									{#if consent}
										<svg class="h-2.5 w-2.5 text-navy" viewBox="0 0 12 9" fill="none"
											><path
												d="M1 4l3.5 3.5L11 1"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/></svg
										>
									{/if}
								</span>
								<span class="text-[13px] leading-snug text-white/50"
									>Согласен(-на) на получение рассылки</span
								>
							</label>

							<label class="flex cursor-pointer items-start gap-2.5">
								<input type="checkbox" bind:checked={privacyConsent} class="peer sr-only" />
								<span
									class="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-white/35 bg-white/5 transition-all peer-checked:border-primary peer-checked:bg-primary"
								>
									{#if privacyConsent}
										<svg class="h-2.5 w-2.5 text-navy" viewBox="0 0 12 9" fill="none"
											><path
												d="M1 4l3.5 3.5L11 1"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/></svg
										>
									{/if}
								</span>
								<span class="text-[13px] leading-snug text-white/50">
									Согласен(-на) на <a
										href="/privacy"
										target="_blank"
										class="underline transition-colors hover:text-primary"
										>обработку персональных данных</a
									>
								</span>
							</label>
						</div>
					</form>

					{#if status === 'error'}
						<p class="mt-2 text-xs text-red-400">{error}</p>
					{/if}
				{:else}
					<div class="rounded-xl border border-primary/40 bg-white/5 p-4">
						<p class="text-sm font-bold text-white">Проверьте почту</p>
						<p class="mt-1 text-xs text-white/65">Отправил письмо для подтверждения на {email}</p>
					</div>
				{/if}
			</div>
			<nav aria-label="Навигация в подвале">
				<p class="mb-4 text-xs font-bold tracking-widest text-white/35 uppercase">Разделы</p>
				<ul class="flex flex-col gap-2.5">
					{#each navigationLinks as link}
						<li>
							<a
								href={link.link}
								class="text-[15px] text-white/65 transition-colors duration-200 hover:text-primary"
								>{link.label}</a
							>
						</li>
					{/each}
				</ul>
			</nav>

			<div>
				<p class="mb-4 text-xs font-bold tracking-widest text-white/35 uppercase">Контакты</p>
				<ul class="flex flex-col gap-2.5">
					{#each socialLinks as social}
						<li>
							<a
								href={social.link}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-2 text-[15px] text-white/65 transition-colors duration-200 hover:text-primary"
							>
								<span class="{iconMap[social.label]} block h-4 w-4 shrink-0 bg-current"></span>
								{social.label}
							</a>
						</li>
					{/each}
					<li>
						<a
							href={telegramChannel.link}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-2 text-[15px] text-white/65 transition-colors duration-200 hover:text-primary"
						>
							<span class="icon-[ri--telegram-line] block h-4 w-4 shrink-0 bg-current"></span>
							Telegram-канал
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- низ -->
		<div
			class="flex flex-col items-end gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="order-2 flex flex-wrap gap-x-4 gap-y-1 sm:order-1">
				<a
					href="/oferta"
					target="_blank"
					class="text-xs text-white/40 transition-colors hover:text-white/70 hover:underline"
					>Договор оферты</a
				>
				<a
					href="/privacy"
					target="_blank"
					class="text-xs text-white/40 transition-colors hover:text-white/70 hover:underline"
					>Политика конфиденциальности</a
				>
			</div>

			<div
				class="order-1 flex flex-col items-end text-xs text-white/40 sm:order-2 sm:flex-row sm:items-center"
			>
				<span>{footerInfo.name}</span>
				<span class="mx-1.5 hidden opacity-40 sm:inline">·</span>
				<span class="mt-1 sm:mt-0">{footerInfo.inn}</span>
			</div>
		</div>
	</div>
</footer>
