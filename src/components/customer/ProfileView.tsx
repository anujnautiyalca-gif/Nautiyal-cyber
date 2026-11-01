import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Save,
  CheckCircle2,
  LogOut,
  Fingerprint,
  Navigation,
  KeyRound,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    reloadProfile,
    logout,
    biometricPermissionGranted,
    enrolledBiometricAccount,
    locationPermissionGranted,
    userLocation,
    grantLocationPermission,
    enableBiometricForAccount,
    disableBiometricForAccount,
  } = useAuth();

  const [name, setName] = useState(userProfile?.name || currentUser?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');

  // Password input for enabling biometric login from profile
  const [confirmPassForBio, setConfirmPassForBio] = useState('');
  const [showBioSetup, setShowBioSetup] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        updatedAt: new Date().toISOString(),
      });
      await reloadProfile();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not update profile information.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email || !confirmPassForBio) {
      setError('Please enter your account password to link Fingerprint Login.');
      return;
    }
    setBioLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await enableBiometricForAccount(
        currentUser.email,
        confirmPassForBio,
        name || currentUser.displayName || 'Customer',
        userProfile?.role === 'admin' || userProfile?.role === 'main_admin' ? 'admin' : 'customer'
      );
      setConfirmPassForBio('');
      setShowBioSetup(false);
      await reloadProfile();
      setSuccess('Fingerprint (BiometricPrompt) login enabled for your account!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to enroll fingerprint.');
    } finally {
      setBioLoading(false);
    }
  };

  const handleDisableBiometrics = async () => {
    setBioLoading(true);
    setError(null);
    try {
      await disableBiometricForAccount();
      await reloadProfile();
      setSuccess('Fingerprint login removed from this device.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not disable fingerprint login.');
    } finally {
      setBioLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    setLocLoading(true);
    setError(null);
    try {
      const loc = await grantLocationPermission();
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          lastLocation: loc,
          updatedAt: new Date().toISOString(),
        });
        await reloadProfile();
      }
      setSuccess(
        `GPS Location updated (${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E)`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not access GPS location.');
    } finally {
      setLocLoading(false);
    }
  };

  const isCurrentAccountEnrolled =
    enrolledBiometricAccount &&
    currentUser?.email &&
    enrolledBiometricAccount.email.toLowerCase() === currentUser.email.toLowerCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-cyan-400" />
          <span>Customer Profile & Security Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Manage your personal details, Fingerprint (Biometric) login, and GPS location verification.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Biometric Fingerprint & Location Security Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-emerald-400" />
          <span>Biometric Fingerprint & Location Permissions</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fingerprint Status */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCurrentAccountEnrolled
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Fingerprint Login</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {isCurrentAccountEnrolled
                    ? 'Active on this device ✓'
                    : biometricPermissionGranted
                    ? 'Permission granted (Not linked)'
                    : 'Not enrolled yet'}
                </div>
              </div>
            </div>

            {isCurrentAccountEnrolled ? (
              <button
                type="button"
                onClick={handleDisableBiometrics}
                disabled={bioLoading}
                className="w-full py-2 px-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/70 text-rose-300 text-xs font-semibold transition"
              >
                {bioLoading ? 'Removing...' : 'Disable Fingerprint Login'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBioSetup(!showBioSetup)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                Enable Fingerprint Login
              </button>
            )}
          </div>

          {/* GPS Location Status */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  locationPermissionGranted
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">GPS Location Permission</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {userLocation
                    ? `${userLocation.latitude.toFixed(4)}°N, ${userLocation.longitude.toFixed(4)}°E`
                    : 'Location verification required'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefreshLocation}
              disabled={locLoading}
              className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 text-xs font-semibold transition"
            >
              {locLoading ? 'Updating GPS...' : 'Verify / Refresh GPS Location'}
            </button>
          </div>
        </div>

        {/* Inline password confirmation to link fingerprint */}
        {showBioSetup && !isCurrentAccountEnrolled && (
          <form
            onSubmit={handleEnableBiometrics}
            className="p-4 rounded-2xl bg-slate-950 border border-emerald-700/50 space-y-3"
          >
            <div className="text-xs text-slate-300 font-medium">
              Confirm your account password once to enroll your device's Fingerprint Sensor:
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={confirmPassForBio}
                  onChange={(e) => setConfirmPassForBio(e.target.value)}
                  required
                  placeholder="Enter your login password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={bioLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                {bioLoading ? 'Scanning Sensor...' : 'Scan & Link Fingerprint'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Personal Profile Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {(name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{name || 'Valued Customer'}</h3>
              <p className="text-xs text-slate-400">{currentUser?.email}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-cyan-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UID: {currentUser?.uid?.substring(0, 16)}...</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name (पूरा नाम)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                10-Digit Mobile Number (मोबाइल नंबर)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address (Registered)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Postal Address / Village / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. New Market Thatyur, Jaunpur, Tehri Garhwal"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {userProfile?.createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Account created: {new Date(userProfile.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl border border-rose-900/60 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-cyan-900/40 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
