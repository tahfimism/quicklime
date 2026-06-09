import { auth } from './firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Configure Google Sign-In on Native Mobile.
 * Uses EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID from the environment.
 */
export function configureGoogleSignIn() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    console.warn(
      'Google Sign-In: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined in your .env file. Native Google sign-in may fail.'
    );
  }

  GoogleSignin.configure({
    webClientId: webClientId || '', // e.g. "33446789018-xxxx.apps.googleusercontent.com"
    offlineAccess: true,
  });
}

/**
 * Initiates native Google Sign-In flow and credentials sign-in with Firebase.
 */
export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    
    // Check if the user is already configured, configure if not.
    configureGoogleSignIn();

    const response = await GoogleSignin.signIn();
    
    // Support newer structure (response.data.idToken) and older structure (response.idToken)
    const idToken = response.data?.idToken || (response as any).idToken;

    if (!idToken) {
      throw new Error('No ID token returned from Google Sign-In.');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In failed on Mobile:', error);
    throw error;
  }
}
