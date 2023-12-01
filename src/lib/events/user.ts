import { retrieve_canvas } from '$lib/firebase';
import { selected_tab } from '$lib/store/canvas-store';

export async function post_login() {
	await retrieve_canvas();
	selected_tab.set(null);
}
