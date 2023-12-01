import type { CanvasTab } from '$lib/types';
import { uuid } from '$lib/utils';
import type { Edge, Node } from '@xyflow/svelte';
import { get, writable, type Writable } from 'svelte/store';

export const nodes: Writable<Node[]> = writable([]);
export const edges: Writable<Edge[]> = writable([]);
export const selected_tab: Writable<string | null> = writable(null);
export const tabs: Writable<{ [x: string]: CanvasTab }> = writable({});

tabs.subscribe((_tabs) => {
	if (Object.keys(_tabs).length == 0) {
		const new_tab = create_canvas_tab();
		tabs.set({ [new_tab.id]: new_tab });
	}
});

selected_tab.subscribe((_selected_tab) => {
	console.log(_selected_tab);
});

selected_tab.subscribe((selected_tab) => {
	nodes.update((value) => {
		return value.map((node) => {
			if (selected_tab == null) node.hidden = false;
			else node.hidden = !get(tabs)[selected_tab].nodes.includes(node.id);
			return node;
		});
	});
	edges.update((value) => {
		return value.map((edge) => {
			if (selected_tab == null) edge.hidden = false;
			else
				edge.hidden =
					!get(tabs)[selected_tab].nodes.includes(edge.source) ||
					!get(tabs)[selected_tab ?? ''].nodes.includes(edge.target);
			return edge;
		});
	});
});

export function create_canvas_tab(): CanvasTab {
	const id = uuid();
	selected_tab.set(id);
	return {
		id,
		label: id,
		nodes: []
	};
}

export function object_to_writable_object(object: { [x: string]: unknown }) {
	const writable_object: { [x: string]: Writable<unknown> } = {};
	for (const key in object) {
		writable_object[key] = writable(object[key]);
	}
	return writable_object;
}

export async function delete_node(node_id: string) {
	nodes.update((actual_nodes) => actual_nodes.filter((node) => !(node.id == node_id)));
	edges.update((actual_edges) =>
		actual_edges.filter((edge) => !(edge.source == node_id || edge.target == node_id))
	);
}
