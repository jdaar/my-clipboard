import { retrieve_canvas } from '$lib/firebase';

export async function post_login() {
	console.log('post login');
	await retrieve_canvas();
}
