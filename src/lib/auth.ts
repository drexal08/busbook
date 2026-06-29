import { auth, db } from './firebase';
import { AuthProvider, User, UserRole } from '../types';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  FacebookAuthProvider,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

type RegisterVerificationState = {
  emailOtpVerified?: boolean;
  phoneVerified?: boolean;
};

type SocialProviderName = Extract<AuthProvider, 'google' | 'facebook'>;

function getPrimaryAuthProvider(firebaseUser: FirebaseUser): AuthProvider {
  const providerIds = firebaseUser.providerData.map((provider) => provider.providerId);

  if (providerIds.includes('facebook.com')) return 'facebook';
  if (providerIds.includes('google.com')) return 'google';
  return 'password';
}

function toUserProfile(firebaseUser: FirebaseUser, data: Partial<User>): User {
  return {
    id: firebaseUser.uid,
    name: data.name || firebaseUser.displayName || '',
    email: data.email || firebaseUser.email || '',
    phone: data.phone || firebaseUser.phoneNumber || '',
    role: (data.role as UserRole) || 'passenger',
    companyId: data.companyId,
    operatorStatus: data.operatorStatus,
    avatar: data.avatar || firebaseUser.photoURL || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
    authProvider: data.authProvider || getPrimaryAuthProvider(firebaseUser),
    emailVerified: firebaseUser.emailVerified,
    emailOtpVerified: data.emailOtpVerified ?? false,
    phoneVerified: data.phoneVerified ?? false,
  };
}

async function syncProfileVerification(firebaseUser: FirebaseUser, profile: User) {
  if (profile.emailVerified === firebaseUser.emailVerified) {
    return profile;
  }

  const nextProfile: User = { ...profile, emailVerified: firebaseUser.emailVerified };
  await updateDoc(doc(db, 'users', firebaseUser.uid), {
    emailVerified: firebaseUser.emailVerified,
  });
  return nextProfile;
}

async function ensureSocialProfile(firebaseUser: FirebaseUser, provider: SocialProviderName) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = toUserProfile(firebaseUser, {
      role: 'passenger',
      authProvider: provider,
      emailOtpVerified: false,
      phoneVerified: !!firebaseUser.phoneNumber,
    });

    await setDoc(ref, profile);
    return profile;
  }

  const existing = snap.data() as Partial<User>;
  const nextProfile = toUserProfile(firebaseUser, {
    ...existing,
    authProvider: provider,
    phoneVerified: existing.phoneVerified ?? !!firebaseUser.phoneNumber,
  });

  await setDoc(ref, nextProfile, { merge: true });
  return nextProfile;
}

async function loadProfile(firebaseUser: FirebaseUser) {
  await reload(firebaseUser);
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!snap.exists()) {
    throw new Error('User profile not found');
  }

  return syncProfileVerification(firebaseUser, snap.data() as User);
}

export async function register(
  name: string,
  email: string,
  password: string,
  phone: string,
  role: UserRole,
  companyId?: string,
  verification?: RegisterVerificationState
) {
  const signInMethods = await fetchSignInMethodsForEmail(auth, email);
  if (signInMethods.length) {
    throw new Error('An account already exists with this email address');
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await updateProfile(cred.user, { displayName: name });

    const profile = toUserProfile(cred.user, {
      name,
      email,
      phone,
      role,
      companyId,
      authProvider: 'password',
      emailOtpVerified: verification?.emailOtpVerified ?? false,
      phoneVerified: verification?.phoneVerified ?? false,
      ...(role === 'operator' ? { operatorStatus: 'pending' } : {}),
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'users', cred.user.uid), profile);

    if (cred.user.email) {
      await sendEmailVerification(cred.user).catch(() => {});
    }
  } catch (error) {
    await deleteUser(cred.user).catch(() => {});
    throw error;
  }

  const profile = await loadProfile(cred.user);
  return { user: cred.user, profile };
}

export async function deleteRegistration(userId: string) {
  await deleteDoc(doc(db, 'users', userId)).catch(() => {});
  if (auth.currentUser?.uid === userId) {
    await deleteUser(auth.currentUser).catch(() => {});
  }
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await loadProfile(cred.user);
  return { user: cred.user, profile };
}

export async function logout() {
  await signOut(auth);
}

export async function loginWithSocial(providerName: SocialProviderName) {
  const provider =
    providerName === 'facebook'
      ? new FacebookAuthProvider()
      : new GoogleAuthProvider();

  if (providerName === 'facebook') {
    provider.setCustomParameters({ display: 'popup' });
  }

  const cred = await signInWithPopup(auth, provider);
  const profile = await ensureSocialProfile(cred.user, providerName);
  return { user: cred.user, profile };
}

export async function loginWithGoogle() {
  return loginWithSocial('google');
}

export async function loginWithFacebook() {
  return loginWithSocial('facebook');
}

export async function sendResetPasswordEmail(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error('Please log in before requesting another verification email');
  }

  await sendEmailVerification(auth.currentUser);
}

export async function refreshCurrentUserProfile() {
  if (!auth.currentUser) return null;
  return loadProfile(auth.currentUser);
}

export async function updateCurrentUserName(name: string) {
  const trimmedName = name.trim();

  if (!auth.currentUser) {
    throw new Error('Please log in to update your profile');
  }

  if (!trimmedName) {
    throw new Error('Username is required');
  }

  await updateProfile(auth.currentUser, { displayName: trimmedName });
  await updateDoc(doc(db, 'users', auth.currentUser.uid), { name: trimmedName });

  return refreshCurrentUserProfile();
}

export async function deleteCurrentUserAccount() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Please log in to delete your account');
  }

  const userId = currentUser.uid;
  await deleteUser(currentUser);
  await deleteDoc(doc(db, 'users', userId)).catch(() => {});
}

export async function updateUserVerificationFlags(
  userId: string,
  flags: Partial<Pick<User, 'emailOtpVerified' | 'phoneVerified' | 'emailVerified' | 'phone'>>
) {
  await updateDoc(doc(db, 'users', userId), flags);
}
