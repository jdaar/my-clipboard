import { generate_node_title } from '$lib/canvas';
import { upload_file } from '$lib/firebase';
import type { HandledText, WritableCanvas } from '$lib/types';
import type { Node } from '@xyflow/svelte';
import { writable } from 'svelte/store';
import { uuid } from '$lib/utils';
import hljs from 'highlight.js';
// @ts-ignore
import detect_language from 'lang-detector';
import { is_user_logged_in_guard } from '$lib/guards/auth-guard';

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
const handlers: TextHandler[] = [code_text_handler];

async function handle_text(text: string): Promise<HandledText> {
	for (let handler of handlers) {
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

export async function handle_clipboard_key(canvas: WritableCanvas, clipboard: ClipboardItems) {
	const is_user_logged_in = await is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'upload_file');
	}

	let actual_nodes: Node[] = [];

	canvas.nodes.subscribe((value) => {
		actual_nodes = value;
	});

	if (clipboard[0].types.filter((v) => v.includes('image/png')).length > 0) {
		const id = uuid();
		const filename = generate_node_title();

		const file_blob = await clipboard[0].getType('image/png');
		const file_download_url = await upload_file(`${filename}.png`, file_blob);

		canvas.nodes.set([
			...actual_nodes,
			{
				id,
				position: { x: Math.random() * 100, y: Math.random() * 100 },
				type: 'image-node',
				data: { title: writable(filename), source: writable(file_download_url) }
			}
		]);
	} else if (clipboard[0].types.filter((v) => v.includes('text/plain')).length > 0) {
		const id = uuid();
		const content = await clipboard[0].getType('text/plain');

		const handled_content = await handle_text(await content.text());

		canvas.nodes.set([
			...actual_nodes,
			{
				id,
				position: { x: Math.random() * 100, y: Math.random() * 100 },
				type: 'text-node',
				data: {
					title: writable(generate_node_title()),
					content: writable(handled_content.data),
					handler: writable(handled_content.component)
				}
			}
		]);
	}
}
