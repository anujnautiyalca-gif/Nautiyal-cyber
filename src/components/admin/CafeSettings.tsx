import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CafeConfig } from '../../types';
import { updateCafeConfig } from '../../services/cafeService';
import { processDocumentUpload } from '../../utils/fileHelpers';
import {
  Settings,
  Save,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Clock,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface CafeSettingsProps {
  cafeConfig: CafeConfig;
  onRefreshConfig: () => Promise<void>;
}

export const CafeSettings: React.FC<CafeSettingsProps> = ({
  cafeConfig,
  onRefreshConfig,
}) => {
  const { currentUser } = useAuth();

  const [cafeName, setCafeName] = useState(cafeConfig.cafeName || 'Nautiyal Cyber Cafe');
  const [tagline, setTagline] = useState(cafeConfig.tagline || '');
  const [upiId, setUpiId] = useState(cafeConfig.upiId || 'anujnautiyal.ca@oksbi');
  const [upiName, setUpiName] = useState(cafeConfig.upiName || 'Nautiyal Cyber Cafe');
  const [upiQrUrl, setUpiQrUrl] = useState(cafeConfig.upiQrUrl || '');
  const [phone, setPhone] = useState(cafeConfig.phone || '7982568459');
  const [alternatePhone, setAlternatePhone] = useState(cafeConfig.alternatePhone || '8077351849');
  const [email, setEmail] = useState(cafeConfig.email || 'nautiyalcc@gmail.com');
  const [address, setAddress] = useState(
    cafeConfig.address || 'New Market Thatyur, Jaunpur, Tehri Garhwal, Uttarakhand - 249180'
  );
  const [workingHours, setWorkingHours] = useState(cafeConfig.workingHours || '');
  const [bannerNotice, setBannerNotice] = useState(cafeConfig.bannerNotice || '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const docData = await processDocumentUpload(file, 'Custom UPI QR');
      setUpiQrUrl(docData.dataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error uploading QR image.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateCafeConfig(
        {
          cafeName: cafeName.trim(),
          tagline: tagline.trim(),
          upiId: upiId.trim(),
          upiName: upiName.trim(),
          upiQrUrl: upiQrUrl.trim(),
          phone: phone.trim(),
          alternatePhone: alternatePhone.trim(),
          email: email.trim(),
          address: address.trim(),
          workingHours: workingHours.trim(),
          bannerNotice: bannerNotice.trim(),
        },
        currentUser?.uid || 'admin'
      );
      await onRefreshConfig();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not update cafe settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>Nautiyal Cyber Cafe Settings & Configuration</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Configure personal UPI payment QR codes, physical shop contact, and emergency notification notices.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Cafe configuration saved successfully!</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: Personal UPI Payment Setup */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Owner Personal UPI QR Code & Payment Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Owner UPI ID / VPA *
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                placeholder="anujnautiyal.ca@oksbi"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Customers will send application fees directly to this VPA.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payee Account Holder Name *
              </label>
              <input
                type="text"
                value={upiName}
                onChange={(e) => setUpiName(e.target.value)}
                required
                placeholder="Nautiyal Cyber Cafe / Anuj Nautiyal"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Custom UPI QR Code Image (Upload Image or Custom URL)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="p-2 rounded-xl bg-white flex-shrink-0 shadow border border-slate-700">
                <img
                  src={
                    upiQrUrl ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${encodeURIComponent(
                      upiId
                    )}&pn=${encodeURIComponent(upiName)}`
                  }
                  alt="QR Preview"
                  className="w-24 h-24 object-contain"
                />
              </div>

              <div className="flex-1 space-y-2 w-full">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Owner QR Image (JPG / PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQrUpload}
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload your printed Google Pay / PhonePe / Paytm standee QR code, or leave blank to automatically generate from your UPI ID.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Cafe Branding & Information */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>Cafe Branding & Operating Hours</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Portal Name
              </label>
              <input
                type="text"
                value={cafeName}
                onChange={(e) => setCafeName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Phone *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alternate / WhatsApp Phone
              </label>
              <input
                type="text"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Physical Shop Address & Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Shop Working Hours
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Emergency Top Alert Banner (Shown to all visitors)
            </label>
            <input
              type="text"
              value={bannerNotice}
              onChange={(e) => setBannerNotice(e.target.value)}
              placeholder="e.g. ⚡ Today all Government Scholarship and SSC exam forms are being filled!"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-950 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Configuration...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
