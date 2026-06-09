import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

/**
 * Configure Google Sign-In. (No-op on web).
 */
export function configureGoogleSignIn() {
  // No configuration needed for Firebase Web SDK auth popup
}

/**
 * Initiates Google Sign-In flow using a browser popup.
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In failed on Web:', error);
    throw error;
  }
}
