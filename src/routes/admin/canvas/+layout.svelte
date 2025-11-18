<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<!-- Override admin layout - render canvas without sidebar -->
{@render children()}
