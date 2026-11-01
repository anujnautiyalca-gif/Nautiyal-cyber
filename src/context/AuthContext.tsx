import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile, AdminProfile } from '../types';
import {
  BiometricEnrolledAccount,
  UserLocationData,
  checkBiometricHardware,
  requestBiometricPermission,
  isBiometricPermissionGranted,
  getEnrolledBiometricAccount,
  enrollBiometricLogin,
  verifyBiometricPrompt,
  clearBiometricEnrollment,
  requestUserLocation,
  getSavedUserLocation,
} from '../utils/biometricAuth';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isMainAdmin: boolean;
  loading: boolean;
  // Biometric & Location states
  biometricAvailable: boolean;
  biometricPermissionGranted: boolean;
  enrolledBiometricAccount: BiometricEnrolledAccount | null;
  userLocation: UserLocationData | null;
  locationPermissionGranted: boolean;
  // Auth & Biometric methods
  loginCustomer: (email: string, pass: string, enrollFingerprint?: boolean) => Promise<void>;
  registerCustomer: (
    name: string,
    phone: string,
    email: string,
    pass: string,
    address?: string,
    enrollFingerprint?: boolean
  ) => Promise<void>;
  loginAdmin: (email: string, pass: string, enrollFingerprint?: boolean) => Promise<void>;
  loginWithGoogle: (asAdmin?: boolean) => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  grantBiometricPermission: () => Promise<void>;
  grantLocationPermission: () => Promise<UserLocationData>;
  enableBiometricForAccount: (
    email: string,
    pass: string,
    displayName: string,
    role: 'customer' | 'admin'
  ) => Promise<void>;
  disableBiometricForAccount: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const OWNER_EMAIL = 'anujnautiyal.ca@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Biometric (BiometricPrompt / FingerprintManager) & Location states
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(true);
  const [biometricPermissionGranted, setBiometricPermissionGranted] = useState<boolean>(
    isBiometricPermissionGranted()
  );
  const [enrolledBiometricAccount, setEnrolledBiometricAccount] =
    useState<BiometricEnrolledAccount | null>(getEnrolledBiometricAccount());
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(
    getSavedUserLocation()
  );
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(
    Boolean(getSavedUserLocation())
  );

  useEffect(() => {
    checkBiometricHardware().then((hw) => {
      setBiometricAvailable(hw.available);
      setBiometricPermissionGranted(hw.permissionGranted);
    });

    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') {
            setLocationPermissionGranted(true);
            requestUserLocation()
              .then((loc) => setUserLocation(loc))
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  const fetchProfileAndAdmin = async (user: FirebaseUser) => {
    try {
      const isOwnerEmail = (user.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();

      // Check admin document first
      let adminData: AdminProfile | null = null;
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (adminSnap.exists()) {
          adminData = adminSnap.data() as AdminProfile;
        } else if (isOwnerEmail) {
          // Auto-bootstrap owner as Main Admin in Firestore
          const bootstrappedAdmin: AdminProfile = {
            uid: user.uid,
            email: user.email || OWNER_EMAIL,
            name: user.displayName || 'Anuj Nautiyal (Main Admin)',
            role: 'main_admin',
            active: true,
            permissions: [
              'manage_services',
              'manage_applications',
              'manage_payments',
              'manage_documents',
              'manage_announcements',
              'manage_users',
            ],
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'admins', user.uid), bootstrappedAdmin);
          adminData = bootstrappedAdmin;
        }
      } catch (err) {
        console.warn('Admin check notice:', err);
      }

      setAdminProfile(adminData);

      // Check customer user profile
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      const savedLoc = getSavedUserLocation();

      if (userSnap.exists()) {
        const existingData = userSnap.data() as UserProfile;
        if (savedLoc) {
          try {
            await updateDoc(userDocRef, {
              lastLocation: savedLoc,
              updatedAt: new Date().toISOString(),
            });
            existingData.lastLocation = savedLoc;
          } catch {
            // ignore update error
          }
        }
        setUserProfile(existingData);
      } else {
        // Auto-create initial profile if logging in via Google
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Valued Customer',
          phone: user.phoneNumber || '',
          email: user.email || '',
          role: adminData ? (adminData.role === 'main_admin' ? 'main_admin' : 'admin') : 'customer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(savedLoc ? { lastLocation: savedLoc } : {}),
        };
        try {
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
        } catch (e) {
          console.warn('Profile sync:', e);
          setUserProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfileAndAdmin(user);
      } else {
        setUserProfile(null);
        setAdminProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const grantBiometricPermission = async () => {
    await requestBiometricPermission();
    setBiometricPermissionGranted(true);
  };

  const grantLocationPermission = async (): Promise<UserLocationData> => {
    const loc = await requestUserLocation();
    setUserLocation(loc);
    setLocationPermissionGranted(true);
    return loc;
  };

  const enableBiometricForAccount = async (
    email: string,
    pass: string,
    displayName: string,
    role: 'customer' | 'admin'
  ) => {
    const enrolled = await enrollBiometricLogin(email, pass, displayName, role);
    setEnrolledBiometricAccount(enrolled);
    setBiometricPermissionGranted(true);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          biometricEnabled: true,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // non-fatal
      }
    }
  };

  const disableBiometricForAccount = async () => {
    clearBiometricEnrollment();
    setEnrolledBiometricAccount(null);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          biometricEnabled: false,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // non-fatal
      }
    }
  };

  const loginCustomer = async (email: string, pass: string, enrollFingerprint?: boolean) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await fetchProfileAndAdmin(cred.user);

    if (enrollFingerprint) {
      const displayName = cred.user.displayName || email.trim().split('@')[0];
      await enableBiometricForAccount(email.trim(), pass, displayName, 'customer');
    }
  };

  const registerCustomer = async (
    name: string,
    phone: string,
    email: string,
    pass: string,
    address?: string,
    enrollFingerprint?: boolean
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(cred.user, { displayName: name.trim() });

    const savedLoc = getSavedUserLocation();

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      role: 'customer',
      address: address?.trim() || '',
      biometricEnabled: Boolean(enrollFingerprint),
      ...(savedLoc ? { lastLocation: savedLoc } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docPath = `users/${cred.user.uid}`;
    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }

    if (enrollFingerprint) {
      await enableBiometricForAccount(email.trim(), pass, name.trim(), 'customer');
    }

    setUserProfile(newProfile);
  };

  const loginAdmin = async (email: string, pass: string, enrollFingerprint?: boolean) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await fetchProfileAndAdmin(cred.user);

    if (enrollFingerprint) {
      const displayName = cred.user.displayName || 'Admin';
      await enableBiometricForAccount(email.trim(), pass, displayName, 'admin');
    }
  };

  const loginWithBiometrics = async () => {
    const verified = await verifyBiometricPrompt();
    const cred = await signInWithEmailAndPassword(auth, verified.email, verified.passwordPlain);
    await fetchProfileAndAdmin(cred.user);
  };

  const loginWithGoogle = async (_asAdmin?: boolean) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    await fetchProfileAndAdmin(cred.user);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setAdminProfile(null);
  };

  const reloadProfile = async () => {
    if (currentUser) {
      await fetchProfileAndAdmin(currentUser);
    }
  };

  const isOwnerEmail = (currentUser?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
  const isAdmin =
    !!adminProfile?.active ||
    isOwnerEmail ||
    userProfile?.role === 'admin' ||
    userProfile?.role === 'main_admin';
  const isMainAdmin =
    adminProfile?.role === 'main_admin' || isOwnerEmail || userProfile?.role === 'main_admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        adminProfile,
        isAdmin,
        isMainAdmin,
        loading,
        biometricAvailable,
        biometricPermissionGranted,
        enrolledBiometricAccount,
        userLocation,
        locationPermissionGranted,
        loginCustomer,
        registerCustomer,
        loginAdmin,
        loginWithGoogle,
        loginWithBiometrics,
        grantBiometricPermission,
        grantLocationPermission,
        enableBiometricForAccount,
        disableBiometricForAccount,
        sendPasswordReset,
        logout,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
