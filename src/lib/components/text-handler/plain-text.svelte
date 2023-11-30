<script lang="ts">
	import type { HandledTextPlain } from '$lib/types';

	export let content: HandledTextPlain;
</script>

<section>
	<div></div>
	<p>{content.text}</p>
	<div></div>
</section>

<style>
	p {
		margin: 0;
		width: 100%;
		max-width: 256px;
		max-height: 256px;
		overflow-y: scroll;
		font-size: var(--sm-font-size);
	}
	div {
		width: 20px;
	}
	section {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		width: 100%;
	}
</style>
