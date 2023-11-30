import { sync_write_canvas } from '$lib/firebase';
import type { Edge, Node } from '@xyflow/svelte';
import { writable, type Writable } from 'svelte/store';

export const nodes: Writable<Node[]> = writable([]);
export const edges: Writable<Edge[]> = writable([]);

nodes.subscribe(node => {
    console.log("🚀 ~ file: canvas-store.ts:10 ~ node:", node)
})
edges.subscribe(edge => {
    console.log("🚀 ~ file: canvas-store.ts:13 ~ edge:", edge)
})

let deletion_queue: {nodes: string[], edges: string[]} = {nodes: [], edges: []};

export function object_to_writable_object (object: {[x: string]: any}) {
    let writable_object: {[x: string]: Writable<any>} = {}
    for (let key in object) {
        writable_object[key] = writable(object[key]);
    }
    return writable_object;
}

export async function delete_node(node_id: string) {
    let actual_nodes: Node[] = []
    nodes.subscribe(value => {
        actual_nodes = value;
    })
    let actual_edges: Edge[] = []
    edges.subscribe(value => {
        actual_edges = value;
    })
    deletion_queue.edges = deletion_queue.edges.concat( 
        actual_edges.filter(edge => edge.source == node_id || edge.target == node_id).map(v => v.id)
    )
    deletion_queue.nodes.push(node_id)
    await sync_write_canvas({
        nodes: actual_nodes, 
        edges: actual_edges 
    })
    nodes.set(actual_nodes.filter(node => !(node.id == node_id)))
    edges.set(actual_edges.filter(edge => !(edge.source == node_id || edge.target == node_id)))
}

export function get_nodes_to_delete() {
    return deletion_queue
}