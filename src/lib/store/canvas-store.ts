import { writable_to_value } from '$lib/utils';
import type { Edge, Node } from '@xyflow/svelte';
import { writable, type Writable } from 'svelte/store';

export const nodes: Writable<Node[]> = writable([]);
export const edges: Writable<Edge[]> = writable([]);

export function object_to_writable_object(object: { [x: string]: any }) {
	let writable_object: { [x: string]: Writable<any> } = {};
	for (let key in object) {
		writable_object[key] = writable(object[key]);
	}
	return writable_object;
}

export async function delete_node(node_id: string) {
	let actual_nodes: Node[] = writable_to_value<Node[]>(nodes) ?? [];
	let actual_edges: Edge[] = writable_to_value<Edge[]>(edges) ?? [];
	nodes.set(actual_nodes.filter((node) => !(node.id == node_id)));
	edges.set(actual_edges.filter((edge) => !(edge.source == node_id || edge.target == node_id)));
}