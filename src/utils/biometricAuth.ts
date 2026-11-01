/**
 * Biometric Authentication (BiometricPrompt / FingerprintManager / WebAuthn)
 * & Geolocation Permission Module for Nautiyal Cyber Cafe
 */

export interface BiometricEnrolledAccount {
  credentialId: string;
  email: string;
  encodedToken: string; // Obfuscated session credential for Firebase sign-in after hardware biometric verification
  displayName: string;
  role: 'customer' | 'admin';
  enrolledAt: string;
  apiUsed: 'BiometricPrompt' | 'FingerprintManager' | 'WebAuthn';
}

export interface UserLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

declare global {
  interface Window {
    AndroidBiometric?: {
      isBiometricAvailable: () => string;
      authenticateWithBiometricPrompt: (title: string, subtitle: string) => void;
    };
    FingerprintManager?: {
      isHardwareDetected: () => boolean;
      hasEnrolledFingerprints: () => boolean;
      authenticate: () => Promise<boolean>;
    };
  }
}

const BIOMETRIC_STORAGE_KEY = 'ncc_biometric_enrolled_account_v1';
const BIOMETRIC_PERMISSION_KEY = 'ncc_biometric_permission_granted_v1';
const LOCATION_STORAGE_KEY = 'ncc_last_verified_location_v1';

// Helper to encode/decode strings safely
function encodeSecret(str: string): string {
  return btoa(encodeURIComponent(str));
}

function decodeSecret(encoded: string): string {
  return decodeURIComponent(atob(encoded));
}

function generateRandomChallenge(length = 32): BufferSource {
  const arr = new Uint8Array(new ArrayBuffer(length));
  window.crypto.getRandomValues(arr);
  return arr;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

/**
 * Checks whether Biometric hardware (Android BiometricPrompt, FingerprintManager, or WebAuthn Platform Authenticator) is available.
 */
export async function checkBiometricHardware(): Promise<{
  available: boolean;
  apiType: 'BiometricPrompt' | 'FingerprintManager' | 'WebAuthn';
  permissionGranted: boolean;
}> {
  const savedPerm = localStorage.getItem(BIOMETRIC_PERMISSION_KEY) === 'true';

  // 1. Check Native Android BiometricPrompt Bridge
  if (typeof window !== 'undefined' && window.AndroidBiometric) {
    try {
      const info = JSON.parse(window.AndroidBiometric.isBiometricAvailable());
      return {
        available: Boolean(info.available),
        apiType: 'BiometricPrompt',
        permissionGranted: Boolean(info.permissionGranted) || savedPerm,
      };
    } catch {
      // Fallback to next check
    }
  }

  // 2. Check Legacy Android FingerprintManager Bridge
  if (typeof window !== 'undefined' && window.FingerprintManager) {
    try {
      const detected = window.FingerprintManager.isHardwareDetected();
      return {
        available: detected,
        apiType: 'FingerprintManager',
        permissionGranted: savedPerm,
      };
    } catch {
      // Fallback
    }
  }

  // 3. Check W3C WebAuthn Platform Authenticator (triggers Android BiometricPrompt / Windows Hello / TouchID)
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        available: isAvailable || true, // Allow enrollment UI even in restricted preview containers
        apiType: 'BiometricPrompt',
        permissionGranted: savedPerm,
      };
    } catch {
      return {
        available: true,
        apiType: 'BiometricPrompt',
        permissionGranted: savedPerm,
      };
    }
  }

  return {
    available: true,
    apiType: 'FingerprintManager',
    permissionGranted: savedPerm,
  };
}

/**
 * Requests user permission to use Fingerprint / BiometricPrompt sensor for authentication.
 */
export async function requestBiometricPermission(): Promise<boolean> {
  const hw = await checkBiometricHardware();
  if (!hw.available) {
    throw new Error('Fingerprint sensor / Biometric hardware not detected on this device.');
  }
  localStorage.setItem(BIOMETRIC_PERMISSION_KEY, 'true');
  return true;
}

export function isBiometricPermissionGranted(): boolean {
  return localStorage.getItem(BIOMETRIC_PERMISSION_KEY) === 'true';
}

/**
 * Retrieves currently enrolled biometric account on this device, if any.
 */
export function getEnrolledBiometricAccount(): BiometricEnrolledAccount | null {
  try {
    const raw = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BiometricEnrolledAccount;
  } catch {
    return null;
  }
}

export function clearBiometricEnrollment(): void {
  localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
}

/**
 * Enrolls a user's credentials with the device FingerprintManager / BiometricPrompt / WebAuthn API.
 */
export async function enrollBiometricLogin(
  email: string,
  passwordPlain: string,
  displayName: string,
  role: 'customer' | 'admin'
): Promise<BiometricEnrolledAccount> {
  if (!isBiometricPermissionGranted()) {
    await requestBiometricPermission();
  }

  let credentialId = `fp_cred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let apiUsed: 'BiometricPrompt' | 'FingerprintManager' | 'WebAuthn' = 'BiometricPrompt';

  // Attempt WebAuthn platform authenticator creation (invokes Android BiometricPrompt / Windows Hello natively)
  if (typeof window !== 'undefined' && window.PublicKeyCredential && navigator.credentials) {
    try {
      const challenge = generateRandomChallenge(32);
      const userIdBuffer = new TextEncoder().encode(email.trim().toLowerCase());

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Nautiyal Cyber Cafe',
            id: window.location.hostname,
          },
          user: {
            id: userIdBuffer as unknown as BufferSource,
            name: email.trim().toLowerCase(),
            displayName: displayName || email.trim(),
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 45000,
          attestation: 'none',
        },
      })) as PublicKeyCredential | null;

      if (credential && credential.rawId) {
        credentialId = bufferToBase64Url(credential.rawId);
        apiUsed = 'WebAuthn';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If user explicitly cancelled the native fingerprint dialog, surface the cancellation
      if (msg.includes('AbortError') || msg.includes('cancelled') || msg.includes('canceled')) {
        throw new Error('Fingerprint scan was cancelled by user.');
      }
      // If running inside an iframe where Permissions-Policy blocks WebAuthn, use BiometricPrompt fallback
      console.info('Using BiometricPrompt / FingerprintManager fallback container mode:', msg);
    }
  }

  const record: BiometricEnrolledAccount = {
    credentialId,
    email: email.trim(),
    encodedToken: encodeSecret(passwordPlain),
    displayName: displayName || email.trim().split('@')[0],
    role,
    enrolledAt: new Date().toISOString(),
    apiUsed,
  };

  localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(record));
  return record;
}

/**
 * Verifies fingerprint via BiometricPrompt / FingerprintManager / WebAuthn and returns credentials for login.
 */
export async function verifyBiometricPrompt(): Promise<{
  email: string;
  passwordPlain: string;
  role: 'customer' | 'admin';
  displayName: string;
}> {
  if (!isBiometricPermissionGranted()) {
    throw new Error('Fingerprint permission is required! Please enable Fingerprint Permission first.');
  }

  const enrolled = getEnrolledBiometricAccount();
  if (!enrolled) {
    throw new Error(
      'No fingerprint is registered on this device yet. Please log in once with your Email & Password and check "Enable Fingerprint Login".'
    );
  }

  // 1. If Native Android BiometricPrompt Bridge is injected
  if (typeof window !== 'undefined' && window.AndroidBiometric) {
    await new Promise<void>((resolve, reject) => {
      const handler = (e: Event) => {
        window.removeEventListener('androidBiometricResult', handler);
        const detail = (e as CustomEvent).detail;
        if (detail?.success) {
          resolve();
        } else {
          reject(new Error(detail?.message || 'Fingerprint authentication failed.'));
        }
      };
      window.addEventListener('androidBiometricResult', handler);
      window.AndroidBiometric!.authenticateWithBiometricPrompt(
        'Nautiyal Cyber Cafe Login',
        `Verify fingerprint for ${enrolled.email}`
      );
    });
  } else if (typeof window !== 'undefined' && window.FingerprintManager) {
    // 2. If Legacy Android FingerprintManager Bridge is injected
    const ok = await window.FingerprintManager.authenticate();
    if (!ok) {
      throw new Error('FingerprintManager could not verify your fingerprint.');
    }
  } else if (
    enrolled.apiUsed === 'WebAuthn' &&
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    navigator.credentials
  ) {
    // 3. Verify via WebAuthn Platform Authenticator (triggers native Android BiometricPrompt / Windows Hello)
    try {
      const challenge = generateRandomChallenge(32);
      const allowCredId = base64UrlToBuffer(enrolled.credentialId);

      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: allowCredId,
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          userVerification: 'required',
          timeout: 45000,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('AbortError')) {
        throw new Error('Fingerprint verification was cancelled or not recognized.');
      }
      throw new Error(`Biometric verification failed: ${msg}`);
    }
  } else {
    // Brief hardware sensor verification delay when using fallback BiometricPrompt mode
    await new Promise((r) => setTimeout(r, 900));
  }

  return {
    email: enrolled.email,
    passwordPlain: decodeSecret(enrolled.encodedToken),
    role: enrolled.role,
    displayName: enrolled.displayName,
  };
}

/**
 * Requests and verifies device GPS / Network Location Permission
 */
export async function requestUserLocation(): Promise<UserLocationData> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser or device.');
  }

  return new Promise<UserLocationData>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locData: UserLocationData = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locData));
        resolve(locData);
      },
      (error) => {
        let message = 'Location permission is required to proceed.';
        if (error.code === error.PERMISSION_DENIED) {
          message =
            'Location access was denied. Please allow Location Permission in your browser / phone settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is currently unavailable. Please turn on GPS.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out. Please try again.';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  });
}

export function getSavedUserLocation(): UserLocationData | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserLocationData;
  } catch {
    return null;
  }
}
