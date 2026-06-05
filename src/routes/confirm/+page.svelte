<script lang="ts">
    import Footer from '$lib/components/layout/Footer.svelte';
    import Button from '$lib/components/ui/Button.svelte';

    let { data } = $props();
</script>
<svelte:head>
	<title>Подписка | Андрей Калмыков</title>
	<meta name="robots" content="noindex" />
</svelte:head>
<section class="bg-background py-16 xl:py-34 min-h-screen flex items-center justify-center">
    <div class="mx-auto px-5 w-full max-w-[480px]">

        {#if data.success}
            <div class="rounded-lg border border-primary bg-white p-8 shadow-sm">
                <div class="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-background">
                    <svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <h1 class="mb-3 font-caveat  text-2xl font-semibold text-foreground">Подписка подтверждена!</h1>
            </div>
        {:else}
            <div class="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
                <div class="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <svg class="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>
                <h1 class="mb-3 font-caveat  text-2xl font-semibold text-foreground">Что-то пошло не так</h1>
                <p class="mb-6 leading-relaxed text-foreground/70">{data.message}</p>
                <Button variant="outline" href="/subscription" class="w-full justify-center">Вернуться к подписке</Button>
            </div>
        {/if}

    </div>
</section>
<Footer/>