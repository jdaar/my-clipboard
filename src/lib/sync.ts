import type { Edge, Node } from '@xyflow/svelte';
import { edges, nodes } from './store/canvas-store';
import { is_array_equal, writable_to_value } from './utils';
import type { SyncPlan, SyncPlanCanvas } from './types';
import { accumulated_sync_plan, last_sync_state, last_sync_timestamp } from './store/sync-store';
import { read_canvas } from './canvas';
import { delete_document, initialize_firebase, upsert_document } from './firebase';

export function get_sync_canvas(): SyncPlanCanvas {
	let processed_canvas = read_canvas({
		nodes,
		edges
	});

	let actual_canvas: SyncPlanCanvas = {
		nodes: processed_canvas.nodes.reduce(
			(acc, node) => {
				acc[node.id] = node;
				return acc;
			},
			{} as { [x: string]: Node }
		),
		edges: processed_canvas.edges.reduce(
			(acc, edge) => {
				acc[edge.id] = edge;
				return acc;
			},
			{} as { [x: string]: Edge }
		)
	};

	return actual_canvas;
}

export function plan_sync(origin: 'data' | 'position'): SyncPlan {
	let sync_plan: SyncPlan = {
		origin,
		nodes: {
			upsert: [],
			delete: []
		},
		edges: {
			upsert: [],
			delete: []
		}
	};

	let diff_canvas = writable_to_value<SyncPlanCanvas | null>(last_sync_state);
	let actual_canvas = get_sync_canvas();
	last_sync_state.set(actual_canvas);

	if (diff_canvas == null) {
		sync_plan.nodes.upsert = Object.keys(actual_canvas.nodes);
		sync_plan.edges.upsert = Object.keys(actual_canvas.edges);
		return sync_plan;
	}

	Object.keys(diff_canvas.nodes).forEach((node_id) => {
		if (actual_canvas.nodes[node_id] == undefined) {
			sync_plan.nodes.delete.push(diff_canvas?.nodes[node_id].id ?? '');
			return;
		} else if (
			!is_array_equal(
				Object.values(actual_canvas.nodes[node_id].data),
				Object.values(diff_canvas?.nodes[node_id].data)
			)
		) {
			sync_plan.nodes.upsert.push(actual_canvas.nodes[node_id].id);
			return;
		} else if (
			!is_array_equal(
				[actual_canvas.nodes[node_id].position.x, actual_canvas.nodes[node_id].position.y],
				[diff_canvas?.nodes[node_id].position.x, diff_canvas?.nodes[node_id].position.y]
			)
		) {
			sync_plan.nodes.upsert.push(actual_canvas.nodes[node_id].id);
			return;
		}
	});
	Object.keys(actual_canvas.nodes).forEach((node_id) => {
		if (diff_canvas?.nodes[node_id] == undefined) {
			sync_plan.nodes.upsert.push(actual_canvas.nodes[node_id].id);
			return;
		}
	});
	Object.keys(diff_canvas.edges).forEach((node_id) => {
		if (actual_canvas.edges[node_id] == undefined) {
			sync_plan.edges.delete.push(diff_canvas?.edges[node_id].id ?? '');
			return;
		} else if (
			!is_array_equal(
				Object.values(actual_canvas.edges[node_id]),
				Object.values(diff_canvas?.edges[node_id] as object)
			)
		) {
			sync_plan.edges.upsert.push(actual_canvas.edges[node_id].id);
			return;
		}
	});
	Object.keys(actual_canvas.edges).forEach((node_id) => {
		if (diff_canvas?.edges[node_id] == undefined) {
			sync_plan.edges.upsert.push(actual_canvas.edges[node_id].id);
			return;
		}
	});

	return sync_plan;
}

export async function execute_plan(_plan: SyncPlan) {
	const sync_canvas = get_sync_canvas();

	const diff_time = Date.now() - (writable_to_value<number>(last_sync_timestamp) ?? 0);
	if (diff_time < 1000 * 5 && _plan.origin == 'position') {
		const accumulated_plan = writable_to_value<SyncPlan | null>(accumulated_sync_plan);
		if (accumulated_plan == null) {
			accumulated_sync_plan.set(_plan);
		} else {
            if (_plan.edges.delete.length > 0 || _plan.nodes.delete.length > 0 || _plan.edges.upsert.length > 0 || _plan.nodes.upsert.length > 0) {
                accumulated_sync_plan.set(append_sync_plans(_plan, accumulated_plan));
            }
		}
        return;
	}
	last_sync_timestamp.set(Date.now());

    let plan = _plan;
    const accumulated_plan = writable_to_value<SyncPlan | null>(accumulated_sync_plan);
    
    if (accumulated_plan != null) {
        plan = append_sync_plans(_plan, accumulated_plan);
        accumulated_sync_plan.set(null);
    }

	while (plan.edges.delete.length > 0) {
		let edge_id = plan.edges.delete.pop();
		if (edge_id == undefined) continue;
		await delete_document('edge', edge_id);
	}
	while (plan.nodes.delete.length > 0) {
		let node_id = plan.nodes.delete.pop();
		if (node_id == undefined) continue;
		await delete_document('node', node_id);
	}

	while (plan.edges.upsert.length > 0) {
		let edge_id = plan.edges.upsert.pop();
		if (edge_id == undefined) continue;
		let edge = sync_canvas.edges[edge_id];
		await upsert_document('edge', edge);
	}
	while (plan.nodes.upsert.length > 0) {
		let node_id = plan.nodes.upsert.pop();
		if (node_id == undefined) continue;
		let node = sync_canvas.nodes[node_id];
		await upsert_document('node', node);
	}
}

export function append_sync_plans(a: SyncPlan, b: SyncPlan): SyncPlan {
	return {
		origin: a.origin == 'data' ? 'data' : b.origin,
        nodes: {
            delete: [...(new Set([...a.nodes.delete, ...b.nodes.delete]))],
            upsert: [...(new Set([...a.nodes.upsert, ...b.nodes.upsert]))]
        },
        edges: {
            delete: [...(new Set([...a.edges.delete, ...b.edges.delete]))],
            upsert: [...(new Set([...a.edges.upsert, ...b.edges.upsert]))]
        }
	};
}