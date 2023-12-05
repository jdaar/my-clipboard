import { retrieve_canvas } from '$lib/firebase';
import { selected_tab } from '$lib/store/canvas-store';
import { retrieve_url_metadata } from '$lib/utils';
import { getIdToken, getAuth } from 'firebase/auth';

export async function post_login() {
	await retrieve_canvas();
	let auth = getAuth();
	if (auth.currentUser == null) throw new Error('post_login');
	selected_tab.set(null);
}
