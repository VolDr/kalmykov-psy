<script lang="ts">
	import type { PageData } from './$types';
	import MeetingRoom from '../+page.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MeetingRoom inviteRoom={data.room} inviteCode={data.code} />
