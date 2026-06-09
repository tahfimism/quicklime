import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { 
  initializeAuth, 
  getAuth, 
  Auth, 
  connectAuthEmulator 
} from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';

import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // Use AsyncStorage for native platform persistence
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Connect to local Firebase Emulators if configured in the environment
const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

if (useEmulator) {
  // localhost works for Web and iOS simulators, but Android emulators require 10.0.2.2 to reach development machine.
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  
  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
  console.log(`[Firebase] Connected to local Emulator Suite at ${host}`);
}
export { auth };
export default app;
