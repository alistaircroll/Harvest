/**
 * Firebase Configuration
 * 
 * This file initializes Firebase using environment variables.
 * For local development: Create .env.local with your Firebase config
 * For production: Configure environment variables in Vercel dashboard
 * 
 * SECURITY: Never hardcode API keys. All values come from environment.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
// Vite exposes env vars prefixed with VITE_ to the client
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId'] as const;
const missingKeys = requiredKeys.filter(
    key => !firebaseConfig[key]
);

if (missingKeys.length > 0 && import.meta.env.PROD) {
    throw new Error(
        `Missing required Firebase configuration: ${missingKeys.join(', ')}. ` +
        'Please check your environment variables.'
    );
}

// Initialize Firebase (lazy for dev environments without config)
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

/**
 * Get the Firebase app instance.
 * Initializes on first call.
 */
export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        if (!firebaseConfig.apiKey) {
            console.warn(
                'Firebase not configured. Create .env.local with your Firebase credentials.'
            );
            // Return a stub in development
            throw new Error('Firebase not configured');
        }
        app = initializeApp(firebaseConfig);
    }
    return app;
}

/**
 * Get the Firestore database instance.
 */
export function getDb(): Firestore {
    if (!db) {
        db = getFirestore(getFirebaseApp());
    }
    return db;
}

/**
 * Get the Firebase Auth instance.
 */
export function getFirebaseAuth(): Auth {
    if (!auth) {
        auth = getAuth(getFirebaseApp());
    }
    return auth;
}
