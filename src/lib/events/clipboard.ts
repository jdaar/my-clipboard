import { generate_node_title, serialize_canvas } from "$lib/clipboard";
import { upload_file } from "$lib/firebase";
import { authenticated_user, type AuthenticatedUser } from "$lib/store/user-store";
import type { WritableCanvas } from "$lib/types";
import type { Edge, Node } from "@xyflow/svelte";
import { writable } from "svelte/store";
import { handle_unauthorized } from "./user";

export async function handle_clipboard_key(canvas: WritableCanvas, clipboard: ClipboardItems) {
    let _authenticated_user: AuthenticatedUser | null = null;
    authenticated_user.subscribe((value: AuthenticatedUser | null) => {
        if (value == null) return;
        _authenticated_user = value;
    })
    if (_authenticated_user == null) {
        handle_unauthorized();
        return;
    }

    let actual_nodes: Node[] = []
    let actual_edges: Edge[] = []

    canvas.nodes.subscribe((value) => {
        actual_nodes = value;
    })
    canvas.edges.subscribe((value) => {
        actual_edges = value;
    })

    if (clipboard[0].types.filter(v => v.includes('image/png')).length > 0) {
        const filename = generate_node_title();

        const file_blob = await clipboard[0].getType('image/png')
        const file_download_url = await upload_file(`${filename}.png`, file_blob);

        canvas.nodes.set([...actual_nodes, {
            id: Math.random().toString(36).substring(7),
            position: { x: Math.random() * 100, y: Math.random() * 100 },
            type: 'image-node',
            data: { title: writable(filename), source: writable(file_download_url) }
        }])
    } else if (clipboard[0].types.filter(v => v.includes('text/plain')).length > 0) {
        const content = await clipboard[0].getType('text/plain');

        canvas.nodes.set([...actual_nodes, {
            id: Math.random().toString(36).substring(7),
            position: { x: Math.random() * 100, y: Math.random() * 100 },
            type: 'text-node',
            data: { title: writable(generate_node_title()), content: writable(await content.text()) }
        }])
    }
    console.log(serialize_canvas({
        nodes: actual_nodes.map((node) => {
            let title_snapshot, source_snapshot, content_snapshot = "";
            node.data.title.subscribe((value: string) => {
                title_snapshot = value;
            })
            if (node.type == 'text-node') {
                node.data.content.subscribe((value: string) => {
                    content_snapshot = value;
                })
                return {
                    ...node,
                    data: {
                        ...node.data,
                        title: title_snapshot,
                        content: content_snapshot
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
    }))
}