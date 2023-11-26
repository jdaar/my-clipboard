import { getAuth, signInWithPopup, GoogleAuthProvider, type UserCredential, type OAuthCredential } from "firebase/auth";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { writable, type Writable } from "svelte/store";
import { edges, nodes } from "$lib/store/canvas-store";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

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

export let authenticated_user: Writable<{ credential: UserCredential, oauth_credential: OAuthCredential} | null> = writable(null);

authenticated_user.subscribe((value) => {
    console.log(value);
})

export function initialize_firebase() {
    if (firebaseInstance == null) {
        firebaseInstance = initializeApp(FIREBASE_CONFIG);
    }
    if (firebaseAnalytics == null) {
        firebaseAnalytics = getAnalytics(firebaseInstance);
    }

    return {
        app: firebaseInstance,
        analytics: firebaseAnalytics
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
    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
    });
}

export function logout() {
    const auth = getAuth();
    auth.signOut().then(() => {
        // Sign-out successful.
        authenticated_user.set(null);
        edges.set([]);
        nodes.set([]);
    }).catch((error) => {
        // An error happened.
    });
}

export async function upload_file(filename: string, file: Blob | File) {
    const storage = getStorage();
    const storageRef = ref(storage, filename);

    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
}
