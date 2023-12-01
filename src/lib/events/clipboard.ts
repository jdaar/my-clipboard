import { generate_node_title } from '$lib/canvas';
import { upload_file } from '$lib/firebase';
import type { HandledText, WritableCanvas } from '$lib/types';
import { get, writable } from 'svelte/store';
import { uuid } from '$lib/utils';
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
const handlers: TextHandler[] = [code_text_handler];

async function handle_text(text: string): Promise<HandledText> {
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

export async function handle_clipboard_key(canvas: WritableCanvas, clipboard: ClipboardItems) {
	const is_user_logged_in = await is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'upload_file');
	}

	if (clipboard[0].types.filter((v) => v.includes('image/png')).length > 0) {
		const id = uuid();
		const filename = generate_node_title();

		const file_blob = await clipboard[0].getType('image/png');
		const file_download_url = await upload_file(`${filename}.png`, file_blob);

		canvas.nodes.update(actual_nodes => [
			...actual_nodes,
			{
				id,
				position: { x: Math.random() * 100, y: Math.random() * 100 },
				type: 'image-node',
				data: { title: writable(filename), source: writable(file_download_url) }
			}
		]);
		tabs.update(actual_tabs => {
			const actual_tab = get(selected_tab) ?? null;
			if (actual_tab == null) return actual_tabs
			return {
				...actual_tabs,
				[actual_tab]: {
					...actual_tabs[actual_tab],
					nodes: [...actual_tabs[actual_tab].nodes, id]
				}
			}
		});
	} else if (clipboard[0].types.filter((v) => v.includes('text/plain')).length > 0) {
		const id = uuid();
		const content = await clipboard[0].getType('text/plain');

		const handled_content = await handle_text(await content.text());

		canvas.nodes.update(actual_nodes => [
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
		tabs.update(actual_tabs => {
			const actual_tab = get(selected_tab) ?? null;
			if (actual_tab == null) return actual_tabs;
			return {
				...actual_tabs,
				[actual_tab]: {
					...actual_tabs[actual_tab],
					nodes: [...actual_tabs[actual_tab].nodes, id]
				}
			}
		});
	}
}
