<script lang="ts">
  export let data;

  const { topGoals, recent, byDay } = data;


  const FUNNEL = [
    'main_pricing_click',
    'main_telegram_click',
    'lead_scroll_50',
    'lead_scroll_75',
    'lead_cta_seen',
    'lead_cta_click',
    'questionnaire_email_submitted',
    'questionnaire_completed',
    'questionnaire_telegram_click',
    'discuss_result_opened'
  ];

  const goalMap = Object.fromEntries(topGoals.map(g => [g.goal, g.total]));
  const first = goalMap[FUNNEL[0]] ?? 1;
</script>

<main class="p-8 max-w-4xl mx-auto space-y-10">

  <h1 class="text-2xl font-bold">Аналитика</h1>

  <!-- Воронка -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Воронка</h2>
    <div class="space-y-2">
      {#each FUNNEL as goal}
        {@const n = goalMap[goal] ?? 0}
        {@const pct = Math.round((n / first) * 100)}
        <div class="flex items-center gap-3">
          <span class="w-52 text-sm font-mono text-gray-600">{goal}</span>
          <div class="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
            <div
              class="h-full bg-blue-500 transition-all"
              style="width: {pct}%"
            ></div>
          </div>
          <span class="w-16 text-right text-sm">{n}</span>
          <span class="w-10 text-right text-xs text-gray-400">{pct}%</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Последние события -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Последние события</h2>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-500 border-b">
          <th class="pb-2">Время</th>
          <th class="pb-2">Событие</th>
          <th class="pb-2">Страница</th>
          <th class="pb-2">Параметры</th>
        </tr>
      </thead>
      <tbody>
        {#each recent as e}
          <tr class="border-b hover:bg-gray-50">
            <td class="py-2 text-gray-400 whitespace-nowrap">
              {new Date(e.createdAt).toLocaleString('ru')}
            </td>
            <td class="py-2 font-mono">{e.goal}</td>
            <td class="py-2 text-gray-500">{e.page ?? '—'}</td>
            <td class="py-2 text-gray-500 text-xs">
              {e.params ? JSON.stringify(e.params) : '—'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

</main>