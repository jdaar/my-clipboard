import { writable, type Writable } from 'svelte/store';
import type { UserCredential, OAuthCredential } from 'firebase/auth';

export type AuthenticatedUser = { credential: UserCredential, oauth_credential: OAuthCredential}

export let authenticated_user: Writable<AuthenticatedUser | null> = writable(null);