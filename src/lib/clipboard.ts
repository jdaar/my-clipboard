import type { Edge, Node } from "@xyflow/svelte";
import { writable, type Writable } from "svelte/store";
import type { Canvas, WritableCanvas } from "$lib/types";
import { upload_file } from "$lib/firebase";
import { z } from 'zod';

const canvas_model = z.object({
    nodes: z.array(z.object({
        id: z.string(),
        position: z.object({
            x: z.number(),
            y: z.number()
        }),
        type: z.enum(['image-node']),
        data: z.object({
            title: z.string(),
            source: z.string()
        })
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string()
    }))
});

function generate_node_title() {
    return Math.random().toString(36).substring(7);
}

export function serialize_canvas(canvas: Canvas): string {
    let secure_canvas = canvas_model.parse(canvas);
    return JSON.stringify(secure_canvas);
}

export function deserialize_canvas(serialized_canvas: string): Canvas {
    return canvas_model.parse(JSON.parse(serialized_canvas));
}

export async function handle_clipboard_key(canvas: WritableCanvas, clipboard: ClipboardItems) {
    let actual_nodes: Node[] = []
    let actual_edges: Edge[] = []
    canvas.nodes.subscribe((value) => {
        actual_nodes = value;
    })
    canvas.edges.subscribe((value) => {
        actual_edges = value;
    })
    if (clipboard[0].types.filter(v => v.includes('image/png'))) {
        const filename = generate_node_title();

        const file_blob = await clipboard[0].getType('image/png')
        const file_download_url = await upload_file(`${filename}.png`, file_blob);


        canvas.nodes.set([...actual_nodes, {
            id: Math.random().toString(36).substring(7),
            position: { x: Math.random() * 100, y: Math.random() * 100 },
            type: 'image-node',
            data: { title: writable(filename), source: writable(file_download_url) }
        }])
    } else {

    }
    console.log(serialize_canvas({
        nodes: actual_nodes.map((node) => {
            let title_snapshot, source_snapshot = "";
            node.data.title.subscribe((value: string) => {
                title_snapshot = value;
            })
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
    }))
}