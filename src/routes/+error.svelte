<script lang="ts">
  // 1. Импортируем хранилище page
  import { page } from '$app/state';
  import Button from '$lib/components/ui/Button.svelte';



  const is404 = page.status === 404;
  const is5xx = page.status >= 500;

  const title = is404 ? 'Страница не найдена'
    : is5xx ? 'Что-то сломалось'
    : `Ошибка ${page.status}`;

  const headline = is404 ? '404' : String(page.status);

  const message = is404
    ? 'Такой страницы нет!'
    : is5xx
      ? 'На нашей стороне что-то пошло не так. Мы уже чиним.'
      : (page.error?.message || 'Непредвиденная ошибка');
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-screen text-center px-4 gap-10">


 {#if is5xx}
    <span class="icon-[lucide--cloud-off] text-[#B8A98A] w-8 h-8"></span>
   {/if}
    {#if !is5xx}
    <span class="icon-[lucide--compass] text-[#B8A98A] w-8 h-8"></span>
    {/if}
    <h1 class="select-none">{title}</h1>


    
    <p class="max-w-md text-lg  leading-relaxed">
        {message}
    </p>


  <div class="flex items-center gap-3">
    
    <Button href="/" rel="noopener noreferrer" class="max-w-[250px]">
      На главную
    </Button>

    {#if is5xx}
      <button onclick={() => location.reload()}
        class='text-center font-light cursor-pointer tracking-wide py-[10px] px-[30px] border border-solid rounded-[10px] inline-block transition-all duration-200 ease-out active:transform active:scale-95 text-black border-black bg-opacity-0 hover:bg-[#cfc1a3] hover:border-[#cfc1a3] hover:text-white hover:shadow-md hover:-translate-y-0.5'>
        Попробовать ещё раз
      </button>
    {/if}
  </div>
  

</div>
