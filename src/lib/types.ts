import type { Edge, Node } from "@xyflow/svelte";
import type { Writable } from "svelte/store";

export type Canvas = {
    nodes: Node[];
    edges: Edge[];
}

export type WritableCanvas = {
    nodes: Writable<Node[]>;
    edges: Writable<Edge[]>;
}