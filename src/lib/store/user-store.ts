import { writable, type Writable } from 'svelte/store';
import type { AuthenticatedUser } from '$lib/types';

export let authenticated_user: Writable<AuthenticatedUser | null> = writable(null);