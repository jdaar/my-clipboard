import { generate_node_title } from '$lib/canvas';
import { upload_file } from '$lib/firebase';
import type { HandledText, WritableCanvas } from '$lib/types';
import { get, writable } from 'svelte/store';
import { retrieve_url_metadata, uuid } from '$lib/utils';
import type { Node } from '@xyflow/svelte';
import hljs from 'highlight.js';
// @ts-expect-error Missing types and couldn't bother to write them myself
import detect_language from 'lang-detector';
import { is_user_logged_in_guard } from '$lib/guards/auth-guard';
import { selected_tab, tabs } from '$lib/store/canvas-store';

interface TextHandler {
	applies(text: string): boolean;
	apply(text: string): Promise<HandledText>;
}

const code_text_handler: TextHandler = {
	applies(text: string): boolean {
		const lang = detect_language(text, { statistics: true });
		if (lang.detected == 'Unknown') return false;
		if (lang.statistics == null) return false;
		if (lang.statistics[lang.detected] == lang.statistics['Unknown']) return false;
		return true;
	},
	async apply(text: string): Promise<HandledText> {
		const highlighted = hljs.highlightAuto(text.trim(), [
			'typescript',
			'cpp',
			'python',
			'java',
			'html',
			'css',
			'ruby',
			'go',
			'php'
		]);
		return {
			component: 'code-text',
			data: {
				code: text,
				highlighted_code: highlighted.value,
				language: highlighted.language
			}
		};
	}
};

const link_text_handler: TextHandler = {
	applies(text: string): boolean {
		return new RegExp(
			/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
		).test(text);
	},
	async apply(text: string): Promise<HandledText> {
		const metadata = await retrieve_url_metadata(text);
		return {
			component: 'link-text',
			data: metadata
		};
	}
};

const handlers: TextHandler[] = [link_text_handler, code_text_handler];

export async function handle_text(text: string): Promise<HandledText> {
	for (const handler of handlers) {
		if (handler.applies(text)) {
			return handler.apply(text);
		}
	}
	return {
		component: 'plain-text',
		data: {
			text
		}
	};
}

export async function create_node(
	type: 'image-node' | 'text-node' | 'latex-node',
	content: Node['data'],
	canvas: WritableCanvas
) {
	const id = uuid();
	switch (type) {
		case 'image-node':
			canvas.nodes.update((actual_nodes) => [
				...actual_nodes,
				{
					id,
					position: { x: Math.random() * 100, y: Math.random() * 100 },
					type: 'image-node',
					data: { title: writable(generate_node_title()), source: writable(content['source']) }
				}
			]);
			break;
		case 'text-node':
			canvas.nodes.update((actual_nodes) => [
				...actual_nodes,
				{
					id,
					position: { x: Math.random() * 100, y: Math.random() * 100 },
					type: 'text-node',
					data: {
						title: writable(generate_node_title()),
						content: writable(content['data']),
						handler: writable(content['component'])
					}
				}
			]);
			break;
		case 'latex-node':
			canvas.nodes.update((actual_nodes) => [
				...actual_nodes,
				{
					id,
					position: { x: Math.random() * 100, y: Math.random() * 100 },
					type: 'latex-node',
					data: {
						title: writable(generate_node_title()),
						source: writable(content['source'])
					}
				}
			]);
			break;
		default:
			throw new Error('Invalid node type');
	}
	tabs.update((actual_tabs) => {
		const actual_tab = get(selected_tab);
		if (actual_tab == null) return actual_tabs;
		return {
			...actual_tabs,
			[actual_tab]: {
				...actual_tabs[actual_tab],
				nodes: [...actual_tabs[actual_tab].nodes, id]
			}
		};
	});
}

export async function handle_clipboard_key(canvas: WritableCanvas, clipboard: ClipboardItems) {
	const is_user_logged_in = await is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'upload_file');
	}

	if (clipboard[0].types.filter((v) => v.includes('image/png')).length > 0) {
		const filename = generate_node_title();
		const file_blob = await clipboard[0].getType('image/png');
		const file_download_url = await upload_file(`${filename}.png`, file_blob);
		await create_node('image-node', { source: file_download_url }, canvas);
	} else if (clipboard[0].types.filter((v) => v.includes('text/plain')).length > 0) {
		const content = await clipboard[0].getType('text/plain');
		const handled_content = await handle_text(await content.text());
		await create_node('text-node', handled_content, canvas);
	}
}
