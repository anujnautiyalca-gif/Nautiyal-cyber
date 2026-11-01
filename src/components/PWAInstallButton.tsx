import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Fingerprint,
  Navigation,
  FileArchive,
  Sparkles,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const SHARED_APP_URL =
  'https://ais-pre-eycqsk2mxfisrdndakl3o4-196001401311.asia-northeast1.run.app';

interface PWAInstallButtonProps {
  variant?: 'header' | 'frontpage';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallStatus('App successfully installed on your phone!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setInstallStatus('Installing Nautiyal Cyber Cafe App on your phone...');
      }
    } else {
      setShowApkModal(true);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SHARED_APP_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(false);
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    SHARED_APP_URL
  )}`;

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setShowApkModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-600/20 transition cursor-pointer"
          title="Download Android APK (Android 11 to 16)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Download APK</span>
        </button>
      ) : (
        <div className="bg-white/95 backdrop-blur-xl border-2 border-emerald-300 rounded-2xl p-3.5 mb-4 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left w-full sm:w-auto">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Nautiyal Cyber Cafe — Android APK
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Android 11 – 16
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Phone में सीधा APK डाउनलोड या 1-Click Install करें (Fingerprint + GPS सपोर्ट)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {deferredPrompt && !isInstalled && (
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Install</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowApkModal(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Get Android APK</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Light Mode APK Download & Installation Modal */}
      {showApkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-slate-900 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowApkModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-white p-1 border-2 border-red-600 shadow-md flex items-center justify-center flex-shrink-0">
                <img
                  src="/logo-circle.png"
                  alt="Nautiyal Cyber Cafe"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase">
                  <CheckCircle2 className="w-3 h-3" />
                  Android 11 to Android 16 Verified
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  Download Nautiyal Cyber Cafe APK
                </h3>
                <p className="text-xs text-slate-600">
                  Package: <code className="font-mono font-bold text-blue-700">com.nautiyalcybercafe.app</code> • v1.0.0
                </p>
              </div>
            </div>

            {/* Hardware Features Included */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Fingerprint className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-800">Fingerprint Login</div>
                <div className="text-[10px] text-slate-500">BiometricPrompt</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Navigation className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-800">GPS Location</div>
                <div className="text-[10px] text-slate-500">Fine & Coarse GPS</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <ShieldCheck className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-800">Android 11–16</div>
                <div className="text-[10px] text-slate-500">API Level 30–36</div>
              </div>
            </div>

            {installStatus && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{installStatus}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Method 1: Generate & Download Signed .APK File via PWABuilder */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-400">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                    तरीका 1: Direct .APK File डाउनलोड करें (Recommended)
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white">
                    Signed .APK
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  नीचे दिए गए बटन पर क्लिक करें, फिर <strong>"Package for stores"</strong> &rarr;{' '}
                  <strong>"Android"</strong> &rarr; <strong>"Download Package"</strong> दबाएं। आपको तुरंत{' '}
                  <code className="font-bold text-emerald-900">NautiyalCyberCafe.apk</code> फाइल मिल जाएगी जिसे आप सीधे अपने फोन में Install कर सकते हैं:
                </p>

                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate & Download .APK File Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Copyable URL for PWABuilder or Phone Browser */}
                <div className="mt-3 pt-3 border-t border-emerald-200/80">
                  <div className="text-[11px] font-bold text-slate-700 mb-1">
                    App Link (अपने फोन या PWABuilder में पेस्ट करने के लिए):
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={SHARED_APP_URL}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Method 2: Direct 1-Click Phone App Install (WebAPK) */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-300">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                    तरीका 2: फोन में सीधा 1-Click App Install करें
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-600 text-white">
                    Instant Install
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  अगर आप यह लिंक अपने Android फोन के <strong>Chrome Browser</strong> में खोल रहे हैं, तो नीचे बटन दबाकर या ऊपर <strong>3-Dots (⋮) &rarr; "Install App / Add to Home Screen"</strong> दबाकर तुरंत ऐप इंस्टॉल करें:
                </p>

                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Install Nautiyal Cyber Cafe App Now</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-700 font-medium">
                    📱 <strong>Phone Chrome Step:</strong> ऊपर दिए गए <strong>Copy Link</strong> को अपने फोन के Chrome में खोलें &rarr; <strong>⋮ (3-Dots)</strong> दबाएं &rarr; <strong>"Install App"</strong> चुनें।
                  </div>
                )}
              </div>

              {/* Method 3: Download Complete Android Studio / Gradle Project */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    तरीका 3: Android Studio / Gradle Source Package
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-800">
                    API 30–36
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Android Studio या GitHub Actions से <code className="font-bold">assembleDebug</code> करने के लिए पूरा Native Android प्रोजेक्ट डाउनलोड करें:
                </p>
                <a
                  href="/NautiyalCyberCafe-Android-Project.tar.gz"
                  download="NautiyalCyberCafe-Android-Project.tar.gz"
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <FileArchive className="w-4 h-4 text-blue-600" />
                  <span>Download Android APK Project (.tar.gz)</span>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Nautiyal Cyber Cafe • Thatyur, Tehri Garhwal</span>
              <button
                type="button"
                onClick={() => setShowApkModal(false)}
                className="font-bold text-slate-700 hover:text-slate-900"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
