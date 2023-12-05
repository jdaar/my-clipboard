<script lang="ts">
	import type { HandledTextLink } from '$lib/types';
	import type { Writable } from 'svelte/store';

	export let content: Writable<HandledTextLink>;
</script>

<div>
	<section>
		{#if $content.image != null}
			<aside>
				<img src={$content.image} alt={$content.title} />
			</aside>
		{/if}
		<aside>
			<header>
				<h2>{$content.title}</h2>
				<h5><a href={$content.url}>{$content.url}</a></h5>
			</header>
			{#if $content.description != null}
				<main>
					<p>{$content.description}</p>
				</main>
			{/if}
		</aside>
	</section>
</div>

<style>
	div {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	a {
		color: var(--border-color);
	}

	a:hover {
		color: var(--border-accent-color);
	}

	section {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		width: 90%;
		gap: 10px;
		max-width: 512px;
	}

	aside {
		width: 100%;
		max-width: 512px;
	}

	aside img {
		width: 100%;
	}

	aside h2 {
		font-size: 1.5rem;
	}

	aside p {
		font-size: var(--sm-font-size);
	}
</style>
