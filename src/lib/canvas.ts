import type { Canvas, SerializedCanvas, WritableCanvas } from "$lib/types";
import type { Edge, Node } from "@xyflow/svelte";
import { z } from 'zod';

const handled_text_content = z.union([
    z.object({
        code: z.string(),
        language: z.string()
    }),
    z.object({
        link: z.string(),
        image: z.string(),
        description: z.string(),
        title: z.string()
    }),
    z.object({
        text: z.string()
    })
]);

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
            content: handled_text_content.optional(),
            handler: z.enum(['code-text', 'link-text', 'plain-text']).optional()
        })
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string()
    }))
});


export function generate_node_title() {
    return Math.random().toString(36).substring(7);
}

export function read_canvas(canvas: WritableCanvas): Canvas {
    let actual_nodes: Node[] = []
    let actual_edges: Edge[] = []

    canvas.nodes.subscribe((value) => {
        actual_nodes = value;
    })
    canvas.edges.subscribe((value) => {
        actual_edges = value;
    })
    const processed_canvas = {
        nodes: actual_nodes.map((node) => {
            let title_snapshot, source_snapshot, content_snapshot, handler_snapshot = "";
            node.data.title.subscribe((value: string) => {
                title_snapshot = value;
            })
            if (node.type == 'text-node') {
                node.data.content.subscribe((value: string) => {
                    content_snapshot = value;
                })
                node.data.handler.subscribe((value: string) => {
                    handler_snapshot = value;
                })
                return {
                    ...node,
                    data: {
                        ...node.data,
                        title: title_snapshot,
                        content: content_snapshot,
                        handler: handler_snapshot
                    }
                }
            }
            node.data.source.subscribe((value: string) => {
                source_snapshot = value;
            })
            return {
                ...node,
                data: {
                    ...node.data,
                    title: title_snapshot,
                    source: source_snapshot
                }
            }}),
        edges: actual_edges
    }
    return processed_canvas;
}

export function serialize_canvas(canvas: Canvas): SerializedCanvas {
    let secure_canvas = canvas_model.parse(canvas);
    let actual_nodes: { [x: string]: string } = {}
    for (let node of secure_canvas.nodes) {
        actual_nodes[node.id] = JSON.stringify(node);
    }
    let edges = JSON.stringify(secure_canvas.edges);
    return { nodes: actual_nodes, edges: edges }
}

export function deserialize_canvas(serialized_canvas: SerializedCanvas): Canvas | null {
    let canvas = {
        nodes: Object.values(serialized_canvas.nodes).map((node) => JSON.parse(node)),
        edges: JSON.parse(serialized_canvas.edges)
    }
    canvas = canvas_model.parse(canvas);
    return canvas;
}
