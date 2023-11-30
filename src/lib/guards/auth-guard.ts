import { getAuth } from 'firebase/auth';

export type GuardResponse = {
	redirect: string | null;
	status: 'success' | 'error';
	message: string | null;
};

export function is_user_logged_in_guard() {
	const auth = getAuth();
	const user = auth.currentUser;
	return {
		redirect: user == null ? '/login' : null,
		status: user == null ? 'error' : 'success',
		message: user == null ? 'You must be logged in to access this page' : null
	};
}
