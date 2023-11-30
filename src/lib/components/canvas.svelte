<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel } from '@xyflow/svelte';
	import ImageNode from '$lib/components/flow/image-node.svelte';

	import '$lib/flow-styles.css';
	import { login, logout } from '$lib/firebase';
	import { edges, nodes } from '$lib/store/canvas-store';
	import { user } from '$lib/store/user-store';
	import TextNode from './flow/text-node.svelte';

	const nodeTypes = {
		'image-node': ImageNode,
		'text-node': TextNode
	};
</script>

<section>
	<SvelteFlow {nodes} {edges} deleteKey="Del" {nodeTypes} proOptions={{ hideAttribution: true }}>
		<div class="offset">
			<Panel position="top-center">
				<aside></aside>
				<aside>
					<button
						on:click={() => {
							if ($user == null) login();
							else logout();
						}}
					>
						{#if $user == null}
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M12 24V21.3333H21.3333V2.66667H12V0H21.3333C22.0667 0 22.6947 0.261333 23.2173 0.784C23.74 1.30667 24.0009 1.93422 24 2.66667V21.3333C24 22.0667 23.7391 22.6947 23.2173 23.2173C22.6956 23.74 22.0676 24.0009 21.3333 24H12ZM9.33333 18.6667L7.5 16.7333L10.9 13.3333H0V10.6667H10.9L7.5 7.26667L9.33333 5.33333L16 12L9.33333 18.6667Z"
									fill="black"
								/>
							</svg>
						{:else}
							<img src={$user?.photoURL} alt="User" />
						{/if}
					</button>
				</aside>
			</Panel>
			<Controls></Controls>
		</div>
		<Background />
	</SvelteFlow>
</section>

<style>
	.offset {
		height: 90%;
		width: 95%;
		top: 5%;
		left: 2.5%;
		position: absolute;
	}
	section {
		height: 100%;
		width: 100%;
	}

	aside {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
	}

	aside > button {
		z-index: 999;
	}

	button {
		display: block;
		border: none;
		width: var(--icon-width);
		height: var(--icon-width);
		color: var(--text-color);
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--bg-sec-color);
		border: 2px solid var(--border-color);
		background: linear-gradient(
				180deg,
				rgba(133, 110, 84, 0) 47.06%,
				rgba(133, 110, 84, 0.2) 97.06%
			),
			var(--bg-sec-color, #130800);
		padding: 0;
		margin: 0;
		z-index: 999;
	}

	button > svg {
		width: 100%;
		max-width: 12px;
		max-height: 12px;
		transform: scale(1.3);
	}

	button > img {
		width: 100%;
		border-radius: 100%;
		border: 2px solid var(--border-color);
	}

	button > svg > path {
		fill: currentColor;
	}

	button:not(:last-child) {
		border-right: none;
	}
	button:not(:first-child) {
		border-left: none;
	}

	aside > button:only-of-type {
		border-radius: 100%;
	}

	button:first-child {
		border-radius: 100% 0 0 100%;
	}

	button:last-child {
		border-radius: 0 100% 100% 0;
	}
</style>
