import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { edges, nodes } from "$lib/store/canvas-store";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { authenticated_user } from "./store/user-store";

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

export async function upload_file(filename: string, file: Blob | File) {
    const storage = getStorage();
    const storageRef = ref(storage, filename);

    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
}

