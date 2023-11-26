import type { Edge, Node } from '@xyflow/svelte';
import { writable, type Writable } from 'svelte/store';

export const nodes: Writable<Node[]> = writable([]);
export const edges: Writable<Edge[]> = writable([]);
