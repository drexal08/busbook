import { auth, db } from './firebase';
import { UserRole } from '../types';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';

export async function register(
  name: string,
  email: string,
  password: string,
  phone: string,
  role: UserRole,
  companyId?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      id: cred.user.uid,
      name,
      email,
      phone,
      role,
      ...(companyId ? { companyId } : {}),
      ...(role === 'operator' ? { operatorStatus: 'pending' } : {}),
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    await deleteUser(cred.user).catch(() => {});
    throw error;
  }
  return cred.user;
}

export async function deleteRegistration(userId: string) {
  await deleteDoc(doc(db, 'users', userId)).catch(() => {});
  if (auth.currentUser?.uid === userId) {
    await deleteUser(auth.currentUser).catch(() => {});
  }
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  return { user: cred.user, profile: snap.data() };
}

export async function logout() {
  await signOut(auth);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) {
    await setDoc(doc(db, 'users', cred.user.uid), {
      id: cred.user.uid,
      name: cred.user.displayName || '',
      email: cred.user.email || '',
      phone: cred.user.phoneNumber || '',
      role: 'passenger',
      createdAt: new Date().toISOString()
    });
  }
  return cred.user;
}
