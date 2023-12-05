import type { Canvas, WritableCanvas } from '$lib/types';
import type { Edge, Node } from '@xyflow/svelte';
import { z } from 'zod';
import { get } from 'svelte/store';

export const canvas_model = z.object({
	nodes: z.array(
		z.object({
			id: z.string(),
			position: z.object({
				x: z.number(),
				y: z.number()
			}),
			type: z.enum(['image-node', 'text-node', 'latex-node']),
			data: z.object({
				title: z.string(),
				source: z.string().optional(),
				content: z.unknown().optional(),
				handler: z.enum(['code-text', 'link-text', 'plain-text']).optional()
			})
		})
	),
	edges: z.array(
		z.object({
			id: z.string(),
			source: z.string(),
			target: z.string()
		})
	),
	tabs: z.record(
		z.object({
			id: z.string(),
			label: z.string(),
			nodes: z.array(z.string())
		})
	)
});

export function generate_node_title() {
	return Math.random().toString(36).substring(7);
}

export function read_canvas(canvas: WritableCanvas): Canvas {
	const actual_nodes: Node[] = get(canvas.nodes) ?? [];
	const actual_edges: Edge[] = get(canvas.edges) ?? [];
	const actual_tabs = get(canvas.tabs) ?? [];

	const processed_canvas = {
		nodes: actual_nodes.map((node) => {
			const title_snapshot = get(node.data.title);
			if (node.type == 'text-node') {
				const content_snapshot = get(node.data.content);
				const handler_snapshot = get(node.data.handler);
				return {
					...node,
					data: {
						...node.data,
						title: title_snapshot,
						content: content_snapshot,
						handler: handler_snapshot
					}
				};
			}
			const source_snapshot = get(node.data.source);
			return {
				...node,
				data: {
					...node.data,
					title: title_snapshot,
					source: source_snapshot
				}
			};
		}),
		edges: actual_edges,
		tabs: actual_tabs
	};
	const safe_canvas = canvas_model.safeParse(processed_canvas);
	if (safe_canvas.success) {
		return safe_canvas.data;
	} else {
		throw new Error(safe_canvas.error.message);
	}
}
