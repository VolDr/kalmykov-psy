<script lang="ts">
    import { socialLinks, footerInfo, navigationLinks, telegramChannel } from '$lib/data/navigation';
    import Button from '$lib/components/ui/Button.svelte';

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
    // Кнопка активна только при валидном email и обеих галочках [cite: 6]
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

<footer class="w-full bg-card pt-[80px] pb-[60px] lg:pt-[80px] lg:pb-[90px] mt-20">
    <div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[960px] xl:px-0">
  <div class="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mb-14">
            
            <!-- Бренд -->
            <div>
                <p class="text-[22px] font-medium text-foreground leading-tight">
                    Андрей Калмыков
                </p>
                <p class="mt-1 text-sm text-foreground/50">
                    Психолог · Терапия выгорания
                </p>
            </div>

            <!-- Кнопка записи -->
            <Button
                href="https://t.me/m/cRvQa0zAMTJi"
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                class="self-start rounded-md bg-primary px-5 py-2 text-base text-white transition-colors duration-200 hover:brightness-95 sm:self-auto"
            >
                Записаться
            </Button>
        </div>
        <div class="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:mb-12">

            <nav aria-label="Навигация в подвале">
                <p class="mb-3 text-xs font-medium uppercase tracking-widest text-foreground/30">Разделы</p>
                <ul class="flex flex-col gap-2">
                    {#each navigationLinks as link}
                        <li>
                            <a href={link.link} class="text-sm text-foreground/60 transition-opacity duration-200 hover:text-foreground hover:opacity-100">
                                {link.label}
                            </a>
                        </li>
                    {/each}
                </ul>
            </nav>

            <div>
                <p class="mb-3 text-xs font-medium uppercase tracking-widest text-foreground/30">Контакты</p>
                <ul class="flex flex-col gap-2">
                    {#each socialLinks as social}
                        <li>
                            <a href={social.link} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-foreground/60 transition-colors duration-200 hover:text-foreground">
                                <span class="{iconMap[social.label]} h-4 w-4 bg-current block shrink-0"></span>
                                {social.label}
                            </a>
                        </li>
                    {/each}
                    <li>
                        <a href={telegramChannel.link} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-foreground/60 transition-colors duration-200 hover:text-foreground">
                            <span class="icon-[ri--telegram-line] h-4 w-4 bg-current block shrink-0"></span>
                            Telegram-канал
                        </a>
                    </li>
                </ul>
            </div>

            <div class="sm:col-span-2 lg:col-span-1">
                <p class="mb-3 text-xs font-medium uppercase tracking-widest text-foreground/30">Рассылка</p>
                {#if status !== 'success'}
                    <p class="mb-3 text-sm text-foreground/50 leading-relaxed">
                       Подпишитесь на рассылку, чтобы получать полезные материалы по работе с выгоранием и прокрастинацией
                    </p>
                    <form onsubmit={(e) => { e.preventDefault(); handleSubscribe(); }} novalidate class="flex flex-col gap-3">
                        <div class="flex gap-2">
                            <input id="email" type="email" autocomplete="email"
                                bind:value={email}
                                placeholder="Ваша почта"
                                disabled={status === 'loading'}
                                class="min-w-0 flex-1 px-3 py-2 text-sm text-foreground bg-white border border-foreground/20 rounded-md focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                class="shrink-0 px-4 py-2 text-sm text-background bg-foreground rounded-md hover:bg-foreground/75 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? '...' : 'OK'}
                            </button>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label class="flex cursor-pointer items-end gap-2">
                                <input type="checkbox" bind:checked={consent} class="peer sr-only" />
                                <span class="mt-0.5 flex h-4 w-4 min-w-[22px] items-center justify-center rounded border border-primary/50 bg-white transition-all peer-checked:bg-primary peer-checked:border-primary">
                                    {#if consent}
                                        <svg class="h-2.5 w-2.5 text-white" viewBox="0 0 12 9" fill="none">
                                            <path d="M1 4l3.5 3.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    {/if}
                                </span>
                                <span class="text-[13px] leading-tight text-foreground/50">Согласен(-на) на получение рассылки</span>
                            </label>

                            <label class="flex cursor-pointer items-end gap-2">
                                <input type="checkbox" bind:checked={privacyConsent} class="peer sr-only" />
                                <span class="mt-0.5 flex h-4 w-4 min-w-[22px] items-center justify-center rounded border border-primary/50 bg-white transition-all peer-checked:bg-primary peer-checked:border-primary">
                                    {#if privacyConsent}
                                        <svg class="h-2.5 w-2.5 text-white" viewBox="0 0 12 9" fill="none">
                                            <path d="M1 4l3.5 3.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    {/if}
                                </span>
                                <span class="text-[13px] leading-tight text-foreground/50">
                                    Согласен(-на) на <a href="/privacy" target="_blank" class="underline hover:text-primary">обработку персональных данных</a>
                                </span>
                            </label>
                        </div>
                    </form>

                    {#if status === 'error'}
                        <p class="mt-2 text-xs text-red-500">{error}</p>
                    {/if}
                {:else}
                    <div class="rounded-lg border border-primary/30 bg-white p-4">
                        <p class="text-sm font-semibold text-foreground">Проверьте почту</p>
                        <p class="text-xs text-foreground/70 mt-1">Отправил письмо для подтверждения на {email}</p>
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex flex-col items-end gap-3 border-t border-foreground/10 pt-6 sm:flex-row sm:justify-between sm:items-center">
            <div class="flex flex-wrap gap-x-4 gap-y-1 order-2 sm:order-1">
                <a href="/oferta" target="_blank" class="text-xs text-foreground/40 hover:underline">Договор оферты</a>
                <a href="/privacy" target="_blank" class="text-xs text-foreground/40 hover:underline">Политика конфиденциальности</a>
            </div>

            <div class="text-xs text-foreground/40 flex flex-col items-end sm:flex-row sm:items-center order-1 sm:order-2">
                <span>{footerInfo.name}</span>
                <span class="hidden sm:inline mx-1.5 opacity-40">·</span>
                <span class="mt-1 sm:mt-0">{footerInfo.inn}</span>
            </div>
        </div>
    </div>
</footer>