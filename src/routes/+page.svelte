<script lang="ts">
	import Counter from '$lib/Counter.svelte';
	import { browser } from '$app/environment';

	let desktop: string;

	if (window.electron && browser) {
		window.electron.receive('from-main', (data: any) => {
			desktop = `Received Message "${data}" from Electron`;
			console.log(desktop);
		});
	}

	const agent = window.electron ? 'Electron' : 'Browser';
</script>
