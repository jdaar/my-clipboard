<script lang="ts">
    import Canvas from '$lib/components/canvas.svelte';
	import { initialize_firebase } from '$lib/firebase';

    import '$lib/styles.css';
	import { onMount } from 'svelte';

    onMount(() => {
        initialize_firebase();
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

