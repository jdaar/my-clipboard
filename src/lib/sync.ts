import type { Edge, Node } from '@xyflow/svelte';
import { edges, nodes, tabs } from './store/canvas-store';
import { is_array_equal } from './utils';
import type { SyncPlan, SyncPlanCanvas } from './types';
import { accumulated_sync_plan, last_sync_state, last_sync_timestamp } from './store/sync-store';
import { read_canvas } from './canvas';
import { delete_document, upsert_document } from './firebase';
import { get } from 'svelte/store';

export function get_sync_canvas(): SyncPlanCanvas {
	const processed_canvas = read_canvas({
		nodes,
		edges,
		tabs
	});

	const actual_canvas: SyncPlanCanvas = {
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
		),
		tabs: processed_canvas.tabs
	};

	return actual_canvas;
}

export function plan_sync(origin: 'data' | 'position'): SyncPlan {
	const sync_plan: SyncPlan = {
		origin,
		nodes: {
			upsert: [],
			delete: []
		},
		edges: {
			upsert: [],
			delete: []
		},
		tabs: {
			upsert: [],
			delete: []
		}
	};

	const diff_canvas = get(last_sync_state);
	const actual_canvas = get_sync_canvas();
	last_sync_state.set(actual_canvas);

	if (diff_canvas == null) {
		sync_plan.nodes.upsert = Object.keys(actual_canvas.nodes);
		sync_plan.edges.upsert = Object.keys(actual_canvas.edges);
		return sync_plan;
	}

	Object.keys(diff_canvas.tabs).forEach((tab_id) => {
		if (actual_canvas.tabs[tab_id] == undefined) {
			sync_plan.tabs.delete.push(diff_canvas?.tabs[tab_id].id ?? '');
			return;
		} else if (!is_array_equal(actual_canvas.tabs[tab_id].nodes, diff_canvas?.tabs[tab_id].nodes)) {
			sync_plan.tabs.upsert.push(actual_canvas.tabs[tab_id].id);
			return;
		}
	});
	Object.keys(actual_canvas.tabs).forEach((tab_id) => {
		if (diff_canvas?.tabs[tab_id] == undefined) {
			sync_plan.tabs.upsert.push(actual_canvas.tabs[tab_id].id);
			return;
		}
	});
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

	const diff_time = Date.now() - (get(last_sync_timestamp) ?? 0);
	if (diff_time < 1000 * 5 && _plan.origin == 'position') {
		const accumulated_plan = get(accumulated_sync_plan);
		if (accumulated_plan == null) {
			accumulated_sync_plan.set(_plan);
		} else {
			if (
				_plan.edges.delete.length > 0 ||
				_plan.nodes.delete.length > 0 ||
				_plan.edges.upsert.length > 0 ||
				_plan.nodes.upsert.length > 0
			) {
				accumulated_sync_plan.set(append_sync_plans(_plan, accumulated_plan));
			}
		}
		return;
	}
	last_sync_timestamp.set(Date.now());

	let plan = _plan;
	const accumulated_plan = get(accumulated_sync_plan);

	if (accumulated_plan != null) {
		plan = append_sync_plans(_plan, accumulated_plan);
		accumulated_sync_plan.set(null);
	}

	console.log(JSON.parse(JSON.stringify(plan)));
	console.log(sync_canvas);

	while (plan.edges.delete.length > 0) {
		const edge_id = plan.edges.delete.pop();
		if (edge_id == undefined) continue;
		await delete_document('edge', edge_id);
	}
	while (plan.nodes.delete.length > 0) {
		const node_id = plan.nodes.delete.pop();
		if (node_id == undefined) continue;
		await delete_document('node', node_id);
	}

	while (plan.edges.upsert.length > 0) {
		const edge_id = plan.edges.upsert.pop();
		if (edge_id == undefined) continue;
		const edge = sync_canvas.edges[edge_id];
		await upsert_document('edge', edge);
	}
	while (plan.nodes.upsert.length > 0) {
		const node_id = plan.nodes.upsert.pop();
		if (node_id == undefined) continue;
		const node = sync_canvas.nodes[node_id];
		await upsert_document('node', node);
	}
	while (plan.tabs.delete.length > 0) {
		const tab_id = plan.tabs.delete.pop();
		if (tab_id == undefined) continue;
		await delete_document('tab', tab_id);
	}
	while (plan.tabs.upsert.length > 0) {
		const tab_id = plan.tabs.upsert.pop();
		if (tab_id == undefined) continue;
		const tab = sync_canvas.tabs[tab_id];
		await upsert_document('tab', tab);
	}
}

export function append_sync_plans(a: SyncPlan, b: SyncPlan): SyncPlan {
	return {
		origin: a.origin == 'data' ? 'data' : b.origin,
		nodes: {
			delete: [...new Set([...a.nodes.delete, ...b.nodes.delete])],
			upsert: [...new Set([...a.nodes.upsert, ...b.nodes.upsert])]
		},
		edges: {
			delete: [...new Set([...a.edges.delete, ...b.edges.delete])],
			upsert: [...new Set([...a.edges.upsert, ...b.edges.upsert])]
		},
		tabs: {
			delete: [...new Set([...a.tabs.delete, ...b.tabs.delete])],
			upsert: [...new Set([...a.tabs.upsert, ...b.tabs.upsert])]
		}
	};
}
