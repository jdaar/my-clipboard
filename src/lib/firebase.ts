import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { edges, get_nodes_to_delete, nodes, object_to_writable_object } from "$lib/store/canvas-store";
import { getStorage, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import { type Firestore, getFirestore } from "firebase/firestore";
import { authenticated_user } from "./store/user-store";
import type { Canvas } from '$lib/types';
import type { Edge, Node } from '@xyflow/svelte';
import { read_canvas } from '$lib/canvas';
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore"; 

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD9xXHYOaL0-uHEju31aRu2YkwqyKStXkg",
    authDomain: "my-clipboard-5bf72.firebaseapp.com",
    projectId: "my-clipboard-5bf72",
    storageBucket: "my-clipboard-5bf72.appspot.com",
    messagingSenderId: "199142649925",
    appId: "1:199142649925:web:7bf57e88a6bdab963ff32c",
    measurementId: "G-EPREPQ4JE9"
};

let firebaseInstance: FirebaseApp | null = null;
let firebaseAnalytics: Analytics | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let firebaseFirestore: Firestore | null = null;

let SYNC_TIMEOUT = true;

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
        if (SYNC_TIMEOUT) {
            const processed_canvas = read_canvas({ nodes, edges });
            sync_write_canvas(processed_canvas);
            SYNC_TIMEOUT = false;
            setTimeout(() => {
                SYNC_TIMEOUT = true;
            }, 200000);
        }
    })
    edges.subscribe((_edges) => {
        const processed_canvas = read_canvas({ nodes, edges });
        sync_write_canvas(processed_canvas);
    })  

    return {
        app: firebaseInstance,
        analytics: firebaseAnalytics,
        storage: firebaseStorage,
        db: firebaseFirestore
    }
}

export function login() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
    .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential == null) return;
        authenticated_user.set({ credential: result, oauth_credential: credential });
        sync_read_canvas();
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
    });
}

export function logout() {
    const auth = getAuth();
    auth.signOut().then(() => {
        authenticated_user.set(null);
        edges.set([]);
        nodes.set([]);
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
    });
}

export async function upload_file(filename: string, file: Blob | File): Promise<string> {
    if (firebaseStorage == null) return '';

    const auth = getAuth();
    const user = auth.currentUser;
    if (user == null) return '';

    const rootDirRef = ref(firebaseStorage, `users/${user.uid}/${filename}`);

    const snapshot = await uploadBytes(rootDirRef, file);
    return snapshot.ref.fullPath;
}

export async function sync_write_canvas(canvas: Canvas) {
    if (firebaseFirestore == null) return;
    if (canvas == null) return;

    const deletion_queue = get_nodes_to_delete()

    try {
        while (deletion_queue.edges.length > 0) {
            const doc_to_delete = doc(firebaseFirestore, `edges/${deletion_queue.edges.pop()}`)
            await deleteDoc(doc_to_delete);
        }
        for (let idx = 0; idx < (canvas?.edges.length ?? 0); idx++) {
            if (!deletion_queue.edges.includes(canvas?.edges[idx].id) && canvas?.edges[idx]) {
                const new_doc = doc(firebaseFirestore, "edges", canvas.edges[idx].id);
                await setDoc(new_doc, canvas?.edges[idx]);
            }
        }
    } catch (e) {
        console.error("Error adding document: ", e);
    }
    try {
        while (deletion_queue.nodes.length > 0) {
            const doc_to_delete = doc(firebaseFirestore, `nodes/${deletion_queue.nodes.pop()}`);
            await deleteDoc(doc_to_delete);
        }
        for (let idx = 0; idx < (canvas?.nodes.length ?? 0); idx++) {
            if (!deletion_queue.nodes.includes(canvas?.nodes[idx].id) && canvas?.nodes[idx]) {
                const new_doc = doc(firebaseFirestore, "nodes", canvas.nodes[idx].id);
                await setDoc(new_doc, canvas.nodes[idx]);
            }
        }
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

export async function sync_read_canvas() {
    if (firebaseStorage == null) return '';
    if (firebaseFirestore == null) return '';

    const auth = getAuth();
    const user = auth.currentUser;
    if (user == null) return '';

    const nodes_collection = collection(firebaseFirestore, "nodes");
    const nodes_snapshot = await getDocs(nodes_collection);
    const nodes_list: Node[] = nodes_snapshot.docs.map(doc => {
        const value = doc.data()
        return {...value, data: object_to_writable_object(value.data)} as Node
    });
    nodes.set(nodes_list);
    const edges_collection = collection(firebaseFirestore, "edges");
    const edges_snapshot = await getDocs(edges_collection);
    const edges_list: Edge[] = edges_snapshot.docs.map(doc => doc.data() as Edge);
    edges.set(edges_list);
}
