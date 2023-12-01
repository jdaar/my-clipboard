<script lang="ts">
	import type { HandledTextCode } from '$lib/types';

	export let content: HandledTextCode;
	/* eslint-disable */
</script>

<section>
	<div></div>
	<pre>
    <code class="hljs">{@html content.highlighted_code}</code>
    </pre>
	<div></div>
</section>

<style>
	section {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	pre {
		width: 100%;
		max-width: 256px;
		max-height: 280px;
	}

	code {
		width: 100%;
		overflow-y: scroll;
		max-height: 256px;
	}

	div {
		width: 20px;
	}
</style>
