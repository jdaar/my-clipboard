import type { SyncPlan, SyncPlanCanvas } from '$lib/types';
import { writable } from 'svelte/store';
import type { Edge, Node } from '@xyflow/svelte';

export const last_sync_state = writable<SyncPlanCanvas | null>(null);
export const accumulated_sync_plan = writable<SyncPlan | null>(null);
export const last_sync_nodes = writable<Node[]>([]);
export const last_sync_edges = writable<Edge[]>([]);
export const last_sync_timestamp = writable<number>(0);
