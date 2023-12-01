import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	setPersistence,
	browserSessionPersistence
} from 'firebase/auth';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { edges, nodes, object_to_writable_object, selected_tab, tabs } from '$lib/store/canvas-store';
import { getStorage, ref, uploadBytes, type FirebaseStorage, deleteObject } from 'firebase/storage';
import {
	type Firestore,
	getFirestore,
	doc,
	setDoc,
	deleteDoc,
	collection,
	getDocs
} from 'firebase/firestore';
import { is_user_logged_in_guard } from './guards/auth-guard';
import { user as userStore } from './store/user-store';
import { execute_plan, plan_sync } from './sync';
import { last_sync_edges, last_sync_nodes } from './store/sync-store';
import { is_array_equal } from './utils';
import type { Edge, Node } from '@xyflow/svelte';
import { get, type Writable } from 'svelte/store';
import { post_login } from './events/user';
import type { CanvasTab } from './types';

const FIREBASE_CONFIG = {
	apiKey: 'AIzaSyD9xXHYOaL0-uHEju31aRu2YkwqyKStXkg',
	authDomain: 'my-clipboard-5bf72.firebaseapp.com',
	projectId: 'my-clipboard-5bf72',
	storageBucket: 'my-clipboard-5bf72.appspot.com',
	messagingSenderId: '199142649925',
	appId: '1:199142649925:web:7bf57e88a6bdab963ff32c',
	measurementId: 'G-EPREPQ4JE9'
};

let firebaseInstance: FirebaseApp | null = null;
let firebaseAnalytics: Analytics | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let firebaseFirestore: Firestore | null = null;

export function initialize_firebase() {
	if (firebaseInstance == null) {
		firebaseInstance = initializeApp(FIREBASE_CONFIG);
	}
	if (firebaseAnalytics == null) {
		firebaseAnalytics = getAnalytics(firebaseInstance);
	}
	if (firebaseStorage == null) {
		firebaseStorage = getStorage(firebaseInstance);
	}
	if (firebaseFirestore == null) {
		firebaseFirestore = getFirestore(firebaseInstance);
	}

	nodes.subscribe((_nodes) => {
		const diff_nodes = get(last_sync_nodes);
		let origin: 'data' | 'position' | null = null;
		if (diff_nodes?.length != _nodes.length) {
			origin = 'data';
		} else {
			diff_nodes?.forEach((node, idx) => {
				const processed_node_data = Object.values(node.data).map((v) =>
					get(v as Writable<unknown>)
				);
				const processed_prev_node_data = Object.values(_nodes[idx].data).map((v) =>
					get(v as Writable<unknown>)
				);
				if (!is_array_equal(processed_node_data, processed_prev_node_data)) {
					origin = 'data';
				} else {
					origin = 'position';
				}
			});
		}
		last_sync_nodes.set(_nodes);
		if (origin == null) return;
		const sync_plan = plan_sync(origin);
		execute_plan(sync_plan);
	});
	edges.subscribe((_edges) => {
		const diff_edges = get(last_sync_edges);
		if (is_array_equal(diff_edges ?? [], _edges)) return;

		const sync_plan = plan_sync('data');
		execute_plan(sync_plan);
		last_sync_edges.set(_edges);
	});
	tabs.subscribe((_tabs) => {
		const sync_plan = plan_sync('data');
		execute_plan(sync_plan);
	});

	const auth = getAuth();
	setPersistence(auth, browserSessionPersistence).then(() => {
		if (auth.currentUser == null) return;
		userStore.set(auth.currentUser);
		post_login();
	});

	return {
		app: firebaseInstance,
		analytics: firebaseAnalytics,
		storage: firebaseStorage,
		db: firebaseFirestore
	};
}

export function login() {
	const auth = getAuth();
	const provider = new GoogleAuthProvider();

	signInWithPopup(auth, provider)
		.then(async (result) => {
			userStore.set(result.user);
			await post_login();
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode, errorMessage);
		});
}

export function logout() {
	const is_user_logged_in = is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'logout');
	}

	const auth = getAuth();
	auth
		.signOut()
		.then(() => {
			userStore.set(null);
			edges.set([]);
			nodes.set([]);
			tabs.set({});
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode, errorMessage);
		});
}

export async function upload_file(filename: string, file: Blob | File): Promise<string> {
	if (firebaseStorage == null) return '';

	const is_user_logged_in = is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'upload_file');
	}

	const auth = getAuth();
	const user = auth.currentUser;

	const rootDirRef = ref(firebaseStorage, `users/${user?.uid}/${filename}`);

	const snapshot = await uploadBytes(rootDirRef, file);
	return snapshot.ref.fullPath;
}

export async function delete_file(filepath: string) {
	if (firebaseStorage == null) return '';

	const is_user_logged_in = is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'upload_file');
	}

	const rootDirRef = ref(firebaseStorage, filepath);

	await deleteObject(rootDirRef);
}

export async function upsert_document(type: 'node' | 'edge' | 'tab', document: Node | Edge | CanvasTab) {
	if (firebaseFirestore == null) return;

	const is_user_logged_in = is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'upsert_document');
	}

	const new_doc = doc(firebaseFirestore, `${type}/${document.id}`);
	await setDoc(new_doc, document);
}

export async function delete_document(type: 'node' | 'edge' | 'tab', document_id: string) {
	if (firebaseFirestore == null) return;

	const is_user_logged_in = is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'delete_document');
	}

	const doc_to_delete = doc(firebaseFirestore, `${type}/${document_id}`);
	await deleteDoc(doc_to_delete);
}

export async function retrieve_canvas() {
	if (firebaseFirestore == null)
		return {
			nodes: [],
			edges: []
		};

	const is_user_logged_in = is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'upload_file');
	}

	const nodes_collection = collection(firebaseFirestore, 'node');
	const nodes_snapshot = await getDocs(nodes_collection);
	const nodes_list: Node[] = nodes_snapshot.docs.map((doc) => {
		const value = doc.data();
		return { ...value, data: object_to_writable_object(value.data) } as Node;
	});
	nodes.set(nodes_list);
	const edges_collection = collection(firebaseFirestore, 'edge');
	const edges_snapshot = await getDocs(edges_collection);
	const edges_list: Edge[] = edges_snapshot.docs.map((doc) => doc.data() as Edge);
	edges.set(edges_list);
	const tabs_collection = collection(firebaseFirestore, 'tab');
	const tabs_snapshot = await getDocs(tabs_collection);
	const tabs_obj = tabs_snapshot.docs.map((doc) => doc.data() as CanvasTab).reduce((acc, tab) => ({...acc, [tab.id]: tab}), {} as {[x: string]: CanvasTab});
	tabs.set(tabs_obj);
}
