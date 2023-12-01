<script lang="ts">
	import Canvas from '$lib/components/canvas.svelte';
	import { handle_clipboard_key } from '$lib/events/clipboard';
	import { initialize_firebase } from '$lib/firebase';
	import { edges, nodes } from '$lib/store/canvas-store';

	import '$lib/styles.css';
	import '$lib/hljs-styles.css';
	import { onMount } from 'svelte';

	onMount(() => {
		initialize_firebase();

		let ctrl_down = false;
		window.addEventListener('keyup', (e) => {
			if (e.code == 'ControlLeft') {
				ctrl_down = false;
			}
		});
		window.addEventListener('keydown', (e) => {
			if (e.code == 'ControlLeft') {
				ctrl_down = true;
			}
			if (e.code == 'KeyV' && ctrl_down) {
				// @ts-expect-error Only works in Chrome or browsers that support the Clipboard API
				navigator.permissions.query({ name: 'clipboard-read' }).then((result) => {
					if (result.state === 'granted' || result.state === 'prompt') {
						window.navigator.clipboard
							.read()
							.then((value) => handle_clipboard_key({ nodes, edges }, value));
					}
				});
			}
		});
	});
</script>

<main>
	<Canvas />
</main>

<style>
	main {
		height: 100%;
		width: 100%;
	}
</style>
