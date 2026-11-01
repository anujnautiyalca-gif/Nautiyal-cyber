import React, { useState } from 'react';
import { useAuth, OWNER_EMAIL } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Fingerprint,
  Navigation,
  MessageCircle,
  Scan,
} from 'lucide-react';

interface AuthModalProps {
  initialTab?: 'customer' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialTab = 'customer' }) => {
  const {
    loginCustomer,
    registerCustomer,
    loginAdmin,
    loginWithGoogle,
    loginWithBiometrics,
    grantBiometricPermission,
    grantLocationPermission,
    biometricPermissionGranted,
    enrolledBiometricAccount,
    locationPermissionGranted,
    userLocation,
    sendPasswordReset,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>(initialTab);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [showForgotPass, setShowForgotPass] = useState<boolean>(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [enrollFingerprint, setEnrollFingerprint] = useState<boolean>(true);

  // Status states
  const [loading, setLoading] = useState(false);
  const [scanningBiometric, setScanningBiometric] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetStates = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleTabSwitch = (tab: 'customer' | 'admin') => {
    setActiveTab(tab);
    setIsRegistering(false);
    setShowForgotPass(false);
    resetStates();
    if (tab === 'admin') {
      setEmail(OWNER_EMAIL);
    } else {
      setEmail('');
    }
  };

  const handleRequestFingerprintPermission = async () => {
    resetStates();
    try {
      await grantBiometricPermission();
      setSuccessMessage('Fingerprint (BiometricPrompt) permission granted successfully.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not grant fingerprint permission.'
      );
    }
  };

  const handleRequestLocationPermission = async () => {
    resetStates();
    setRequestingLocation(true);
    try {
      const loc = await grantLocationPermission();
      setSuccessMessage(
        `Location permission verified (${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E).`
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Location permission is required. Please enable GPS/Location access.'
      );
    } finally {
      setRequestingLocation(false);
    }
  };

  const handleFingerprintLogin = async () => {
    resetStates();

    // Enforce Fingerprint & Location permissions before fingerprint login
    if (!biometricPermissionGranted) {
      try {
        await grantBiometricPermission();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Fingerprint permission is required for Biometric Login.'
        );
        return;
      }
    }

    if (!locationPermissionGranted) {
      setRequestingLocation(true);
      try {
        await grantLocationPermission();
      } catch (err: unknown) {
        setRequestingLocation(false);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Location permission is mandatory before Fingerprint Login. Please allow Location access.'
        );
        return;
      }
      setRequestingLocation(false);
    }

    if (!enrolledBiometricAccount) {
      setErrorMessage(
        'First time on this device? Please sign in once with your Email & Password (with "Enable Fingerprint Login" checked) to link your fingerprint.'
      );
      return;
    }

    setScanningBiometric(true);
    setLoading(true);
    try {
      await loginWithBiometrics();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Fingerprint verification failed. Please try again.'
      );
    } finally {
      setScanningBiometric(false);
      setLoading(false);
    }
  };

  const ensurePermissionsBeforeSubmit = async (): Promise<boolean> => {
    if (!locationPermissionGranted) {
      setRequestingLocation(true);
      try {
        await grantLocationPermission();
      } catch (err: unknown) {
        setRequestingLocation(false);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Location permission is mandatory to login. Please tap "Allow Location" above.'
        );
        return false;
      }
      setRequestingLocation(false);
    }

    if (enrollFingerprint && !biometricPermissionGranted) {
      try {
        await grantBiometricPermission();
      } catch {
        // Proceed with login even if hardware enrollment falls back
      }
    }
    return true;
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStates();

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    if (isRegistering) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    const permsOk = await ensurePermissionsBeforeSubmit();
    if (!permsOk) return;

    setLoading(true);
    try {
      if (isRegistering) {
        await registerCustomer(name, phone, email, password, address, enrollFingerprint);
        setSuccessMessage('Registration successful! Welcome to Nautiyal Cyber Cafe.');
      } else {
        await loginCustomer(email, password, enrollFingerprint);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('user-not-found') ||
        msg.includes('invalid-credential') ||
        msg.includes('wrong-password')
      ) {
        setErrorMessage('Invalid email or password. Please try again or reset password.');
      } else if (msg.includes('email-already-in-use')) {
        setErrorMessage('An account with this email already exists. Please login instead.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStates();

    if (!email || !password) {
      setErrorMessage('Please enter admin email and password.');
      return;
    }

    const permsOk = await ensurePermissionsBeforeSubmit();
    if (!permsOk) return;

    setLoading(true);
    try {
      await loginAdmin(email, password, enrollFingerprint);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('user-not-found') ||
        msg.includes('invalid-credential') ||
        msg.includes('wrong-password')
      ) {
        setErrorMessage('Invalid admin credentials. Please verify your email & password.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetStates();
    const permsOk = await ensurePermissionsBeforeSubmit();
    if (!permsOk) return;

    setLoading(true);
    try {
      await loginWithGoogle(activeTab === 'admin');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Google sign-in could not be completed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    resetStates();
    try {
      await sendPasswordReset(email);
      setSuccessMessage('Password recovery email sent! Check your inbox to reset your password.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 py-8 sm:px-6 overflow-hidden bg-sky-50 text-slate-900">
      {/* Bright Himalayan Temple Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/bg-himalayas.jpg')` }}
      />
      {/* Soft Daylight Mist Overlay so background remains bright & vivid */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-white/30 via-sky-50/45 to-white/75" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Unique Himalayan Temple Logo Crest on Front Page */}
        <div className="text-center mb-5">
          <div className="relative mx-auto w-full max-w-[330px] rounded-3xl overflow-hidden shadow-xl border-2 border-white mb-3 group">
            {/* Himalayan Temple & Mountain Background for the Logo */}
            <div
              className="h-44 sm:h-48 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('/bg-himalayas.jpg')` }}
            >
              {/* Light subtle vignette for logo clarity without darkening */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
            </div>

            {/* Elevated Logo Badge with Red Accent Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-xl ring-4 ring-red-600 group-hover:scale-105 transition-transform duration-300 overflow-hidden flex items-center justify-center">
                <img
                  src="/logo-circle.png"
                  alt="Nautiyal Cyber Cafe Official Emblem"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Bright Title Ribbon */}
              <div className="mt-2.5 px-4 py-1 rounded-full bg-white/95 backdrop-blur-md border border-red-500/40 shadow-md">
                <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-red-700">
                  NAUTIYAL CYBER CAFE
                </span>
              </div>
            </div>
          </div>

          {/* Crisp Light Title Card */}
          <div className="bg-white/90 backdrop-blur-md border border-white/80 rounded-2xl py-2.5 px-4 shadow-md inline-block">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Nautiyal Cyber Cafe
            </h1>
            <p className="text-xs sm:text-sm text-blue-800 font-semibold italic mt-0.5">
              "If there is no struggle, there is no progress"
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>New Market Thatyur, Jaunpur, Tehri Garhwal (UK)</span>
            </div>
          </div>
        </div>

        {/* Mandatory Device Permissions Bar: Fingerprint & Location */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-3.5 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Required Security Permissions (अनिवार्य अनुमति)
            </span>
            {biometricPermissionGranted && locationPermissionGranted && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800">
                Ready
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Fingerprint Permission Control */}
            <button
              type="button"
              onClick={handleRequestFingerprintPermission}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                biometricPermissionGranted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100/80'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  biometricPermissionGranted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate">Fingerprint</div>
                <div className="text-[10px] font-medium opacity-85 truncate">
                  {biometricPermissionGranted ? 'Allowed ✓' : 'Tap to Allow'}
                </div>
              </div>
            </button>

            {/* Location Permission Control */}
            <button
              type="button"
              onClick={handleRequestLocationPermission}
              disabled={requestingLocation}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                locationPermissionGranted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100/80'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  locationPermissionGranted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                <Navigation className={`w-4 h-4 ${requestingLocation ? 'animate-spin' : ''}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate">GPS Location</div>
                <div className="text-[10px] font-medium opacity-85 truncate">
                  {requestingLocation
                    ? 'Locating...'
                    : locationPermissionGranted
                    ? userLocation
                      ? `${userLocation.latitude.toFixed(2)}°N, ${userLocation.longitude.toFixed(2)}°E`
                      : 'Allowed ✓'
                    : 'Tap to Allow'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Login & Registration Card (Light Mode) */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Tabs: Customer vs Admin */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => handleTabSwitch('customer')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'customer'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('admin')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Fingerprint Biometric Login Button */}
          {!showForgotPass && !isRegistering && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleFingerprintLogin}
                disabled={loading || scanningBiometric}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 hover:from-emerald-100 hover:to-cyan-100 border-2 border-emerald-400 text-slate-900 transition shadow-sm flex items-center justify-between group disabled:opacity-60"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 group-hover:scale-105 transition">
                    {scanningBiometric ? (
                      <Scan className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Fingerprint className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <span>
                        {scanningBiometric
                          ? 'Scanning Fingerprint Sensor...'
                          : 'Login with Fingerprint (फिंगरप्रिंट लॉगिन)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {enrolledBiometricAccount
                        ? `Linked: ${enrolledBiometricAccount.displayName} (${enrolledBiometricAccount.email})`
                        : 'Touch sensor for instant biometric authentication'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-700 flex-shrink-0 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          )}

          {/* Forgot Password Flow */}
          {showForgotPass ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Enter your registered email address and we'll send you a password recovery link.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Send Recovery Link'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPass(false)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : activeTab === 'customer' ? (
            /* CUSTOMER LOGIN & REGISTRATION */
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isRegistering ? 'Create Customer Account' : 'Customer Account Login'}
                </h2>
                <p className="text-xs text-slate-600">
                  {isRegistering
                    ? 'Register once to track applications, upload docs & receive certificates.'
                    : 'Log in to view available cyber services, applications & documents.'}
                </p>
              </div>

              {isRegistering && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name (पूरा नाम) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Ramesh Chandra Nautiyal"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (मोबाइल नंबर) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="e.g. 9876543210"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Village / City & Address (पता)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. New Market Thatyur, Tehri Garhwal"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (ईमेल) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. customer@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password (पासवर्ड) *
                  </label>
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPass(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Biometric Fingerprint Enrollment Toggle */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 cursor-pointer hover:border-blue-400 transition">
                <input
                  type="checkbox"
                  checked={enrollFingerprint}
                  onChange={(e) => setEnrollFingerprint(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                />
                <Fingerprint className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-slate-700">
                  Enable <strong>Fingerprint Login</strong> on this device (फिंगरप्रिंट लॉगिन सक्रिय करें)
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  'Please wait...'
                ) : isRegistering ? (
                  <>
                    <span>Complete Customer Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Login to Customer Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Google Sign-In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-semibold">OR QUICK SIGN IN</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-3 border-t border-slate-200">
                {isRegistering ? (
                  <p className="text-xs text-slate-600">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        resetStates();
                      }}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Login here
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-600">
                    New customer?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        resetStates();
                      }}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Register New Account
                    </button>
                  </p>
                )}
              </div>
            </form>
          ) : (
            /* ADMIN LOGIN */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Authorized Personnel Only</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">Cafe Administrator Login</h2>
                <p className="text-xs text-slate-600">
                  Manage services, review submitted documents, verify UPI payments & return completed files.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nautiyalcc@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPass(true)}
                    className="text-[11px] font-semibold text-amber-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Biometric Fingerprint Enrollment Toggle */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 cursor-pointer hover:border-amber-400 transition">
                <input
                  type="checkbox"
                  checked={enrollFingerprint}
                  onChange={(e) => setEnrollFingerprint(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 bg-white"
                />
                <Fingerprint className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-slate-700">
                  Enable <strong>Admin Fingerprint Login</strong> on this device
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating Admin...' : 'Access Admin Dashboard'}
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Sign In as Owner ({OWNER_EMAIL})</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-slate-700 leading-relaxed">
                🔒 <strong>Owner Security Notice:</strong> The verified owner email{' '}
                <code className="text-amber-900 font-bold">{OWNER_EMAIL}</code> is bootstrapped with Main Admin permissions. Secondary admins can be added from the Admin Dashboard.
              </div>
            </form>
          )}
        </div>

        {/* Official Shop Contact & Location Card (Light Mode) */}
        <div className="mt-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 shadow-lg space-y-2.5">
          <div className="font-extrabold text-slate-900 text-center text-xs sm:text-sm border-b border-slate-200 pb-2">
            📍 Nautiyal Cyber Cafe — Help & Support Desk
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href="tel:7982568459"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition"
            >
              <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Contact No</div>
                <div className="font-bold text-slate-900">7982568459</div>
              </div>
            </a>

            <a
              href="https://wa.me/918077351849"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">WhatsApp No</div>
                <div className="font-bold text-emerald-800">8077351849</div>
              </div>
            </a>
          </div>

          <a
            href="mailto:nautiyalcc@gmail.com"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition"
          >
            <Mail className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500 font-medium">Official Shop Email</div>
              <div className="font-bold text-slate-900 truncate">nautiyalcc@gmail.com</div>
            </div>
          </a>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium">Shop Address</div>
              <div className="font-semibold text-slate-800 leading-snug">
                New Market Thatyur, Jaunpur, Tehri Garhwal, Uttarakhand - 249180
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
