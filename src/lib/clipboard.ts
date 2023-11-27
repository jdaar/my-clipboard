import type { Canvas } from "$lib/types";
import { z } from 'zod';

export const canvas_model = z.object({
    nodes: z.array(z.object({
        id: z.string(),
        position: z.object({
            x: z.number(),
            y: z.number()
        }),
        type: z.enum(['image-node', 'text-node']),
        data: z.object({
            title: z.string(),
            source: z.string().optional(),
            content: z.string().optional()
        })
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string()
    }))
});

type SerializedCanvas = {nodes: {[x: string]: string}, edges: string};

export function generate_node_title() {
    return Math.random().toString(36).substring(7);
}

export function serialize_canvas(canvas: Canvas): SerializedCanvas {
    let secure_canvas = canvas_model.parse(canvas);
    let actual_nodes: {[x: string]: string} = {}
    for (let node of secure_canvas.nodes) {
        actual_nodes[node.id] = JSON.stringify(node);
    }
    let edges = JSON.stringify(secure_canvas.edges);
    return {nodes: actual_nodes, edges: edges}
}

export function deserialize_canvas(serialized_canvas: SerializedCanvas): Canvas |null {
    //return canvas_model.parse(JSON.parse(serialized_canvas));
    return null
}
