<script lang="ts">
	import { nodes } from '$lib/store/canvas-store';
	import { last_sync_nodes } from '$lib/store/sync-store';
	import { execute_plan, plan_sync } from '$lib/sync';
	import type { HandledTextPlain } from '$lib/types';
	import { get, type Writable } from 'svelte/store';

	export let content: Writable<HandledTextPlain>;
</script>

<section>
	<textarea bind:value={$content.text} on:change={() => {
		last_sync_nodes.set(get(nodes));
		const sync_plan = plan_sync('data');
		execute_plan(sync_plan);
	}}></textarea>
</section>

<style>
	textarea {
		border: none;
		outline: none;
		background: none;
		max-height: 256px;
		font-weight: 400;
		margin: 0;
		max-width: 512px;
		overflow-y: scroll;
		min-height: 100px;
		width: 256px;
		margin-left: 10px;
		margin-right: 10px;
		resize: none;
		font-size: var(--sm-font-size);
		color: var(--text-color);
	}

	section {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding: 0;
		margin: 0;
	}
</style>
