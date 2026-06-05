<script lang="ts">
    import { page } from '$app/stores';
    import Footer from '$lib/components/layout/Footer.svelte';
    import Button from '$lib/components/ui/Button.svelte';

    let email = $state($page.url.searchParams.get('email') ?? '');
    let consent = $state(false);
    // Добавлено состояние для согласия на обработку ПД
    let privacyConsent = $state(false); 
    let submitted = $state(false);
    let loading = $state(false);
    let error = $state('');
    let emailTouched = $state(false);

    function validateEmail(e: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
    }

    const emailValid = $derived(validateEmail(email));
    // Теперь кнопка активна только если обе галочки нажаты и email валиден
    const canSubmit = $derived(emailValid && consent && privacyConsent);
    const showEmailError = $derived(emailTouched && email.trim() !== '' && !emailValid);

    function handleEmailBlur() {
        emailTouched = true;
    }

    async function handleSubmit() {
        emailTouched = true;
        if (!canSubmit) return;
        error = '';
        loading = true;

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            });

            if (!response.ok) {
                throw new Error('Submit error');
            }

            submitted = true;
        } catch (err) {
            error = 'Произошла ошибка. Пожалуйста, попробуйте позже.';
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Подписка | Андрей Калмыков</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<section class="bg-background py-16 xl:py-34 min-h-screen">
    <div class="mx-auto px-5 xl:px-0 md:max-w-[760px] lg:max-w-[960px]">

        {#if !submitted}
            <div class="mb-6 md:mb-6">
                <p class="mb-3 text-sm font-medium uppercase tracking-widest text-foreground/40">рассылка</p>
                <h1 class="mb-4 font-caveat  text-3xl font-semibold leading-tight text-navy md:text-4xl">Материалы о выгорании</h1>
                <p class="max-w-[600px] text-lg leading-relaxed text-foreground/70">
                Подпишитесь на рассылку, чтобы получать полезные материалы, практические идеи и разбор исследований по работе с выгоранием и прокрастинацией. Без воды и мотивационных цитат.
                </p>
            </div>

            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} novalidate class="flex flex-col gap-6 max-w-[480px]">
                <div class="flex flex-col gap-2">
                    <input
                        id="email"
                        type="email"
                        autocomplete="email"
                        placeholder="Ваша почта"
                        bind:value={email}
                        onblur={handleEmailBlur}
                        disabled={loading}
                        class="w-full rounded-lg border px-4 py-3 text-base text-foreground placeholder-foreground/30 outline-none transition-all duration-200 {showEmailError ? ' focus:ring-2 focus:ring-red-400/20 border-red-400' : 'border-primary/40 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'} disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {#if showEmailError}
                        <p class="text-sm text-red-500" role="alert">Введите корректный адрес электронной почты</p>
                    {/if}
                </div>

                <div class="flex flex-col gap-3">
                    <!-- Первая галочка: Согласие на рассылку -->
                    <label class="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" bind:checked={consent} disabled={loading} class="peer sr-only" />
                        <span class="mt-0.5 flex h-[18px] w-[18px] min-w-[18px] items-center justify-center rounded border border-primary/50 bg-white transition-all duration-150 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1 peer-disabled:opacity-50" aria-hidden="true">
                            {#if consent}
                                <svg class="h-3 w-3 text-white" viewBox="0 0 12 9" fill="none">
                                    <path d="M1 4l3.5 3.5L11 1" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            {/if}
                        </span>
                        <span class="text-sm leading-relaxed text-foreground/70">
                            Я согласен(-на) на получение информационной рассылки
                        </span>
                    </label>

                    <!-- Вторая галочка: Согласие на обработку персональных данных -->
                    <label class="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" bind:checked={privacyConsent} disabled={loading} class="peer sr-only" />
                        <span class="mt-0.5 flex h-[18px] w-[18px] min-w-[18px] items-center justify-center rounded border border-primary/50 bg-white transition-all duration-150 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1 peer-disabled:opacity-50" aria-hidden="true">
                            {#if privacyConsent}
                                <svg class="h-3 w-3 text-white" viewBox="0 0 12 9" fill="none">
                                    <path d="M1 4l3.5 3.5L11 1" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            {/if}
                        </span>
                        <span class="text-sm leading-relaxed text-foreground/70">
                            Я согласен(-на) на <a href="/privacy" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 transition-colors hover:text-foreground">обработку персональных данных</a>
                        </span>
                    </label>
                </div>

                {#if error}
                    <p class="text-sm text-red-500">{error}</p>
                {/if}

                <div class="flex flex-col gap-3 mt-2">
                    <Button variant="primary" disabled={!canSubmit || loading} class="w-full justify-center {(!canSubmit || loading) ? 'opacity-40 cursor-not-allowed' : ''}" onclick={handleSubmit}>
                        {#if loading}
                            Подписываю…
                        {:else}
                            Подписаться
                        {/if}
                    </Button>
                </div>
            </form>

        {:else}
            <div class="max-w-[480px] rounded-lg border border-primary bg-white p-8 shadow-sm">
                <div class="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-background">
                    <svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <h2 class="mb-3 font-caveat  text-2xl font-semibold text-foreground">Проверьте почту</h2>
                <p class="mb-4 xl:mb-12 leading-relaxed text-foreground/70">Отправил письмо на <strong class="font-medium text-foreground">{email}</strong> — нажмите кнопку подтверждения, чтобы подписка стала активной.</p>
                <p class="text-sm text-foreground/40">Не нашли письмо? Проверьте папку «Спам» или «Промоакции».</p>
            </div>
        {/if}

    </div>
</section>

<Footer/>