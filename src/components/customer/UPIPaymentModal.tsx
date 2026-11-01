import React, { useState } from 'react';
import { ApplicationRecord, CafeConfig } from '../../types';
import { submitPaymentProof } from '../../services/cafeService';
import { processDocumentUpload, formatFileSize } from '../../utils/fileHelpers';
import {
  X,
  QrCode,
  Copy,
  Check,
  Upload,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface UPIPaymentModalProps {
  application: ApplicationRecord;
  cafeConfig: CafeConfig;
  onClose: () => void;
  onPaymentSubmitted: () => void;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  application,
  cafeConfig,
  onClose,
  onPaymentSubmitted,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentDoneChecked, setPaymentDoneChecked] = useState(false);
  const [upiRef, setUpiRef] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [screenshotSize, setScreenshotSize] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const upiId = cafeConfig.upiId || 'anujnautiyal.ca@oksbi';
  const upiName = cafeConfig.upiName || 'Nautiyal Cyber Cafe';
  const amount = application.fee;

  // Generate dynamic QR code if needed with exact amount
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
    `Fee for ${application.applicationId}`
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      const docData = await processDocumentUpload(file, 'UPI Payment Screenshot');
      setScreenshotDataUrl(docData.dataUrl);
      setScreenshotName(file.name);
      setScreenshotSize(file.size);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error uploading screenshot.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!paymentDoneChecked) {
      setErrorMessage('Please confirm that you have made the payment by checking "Payment Done".');
      return;
    }

    if (!screenshotDataUrl && !upiRef.trim()) {
      setErrorMessage('Please provide either your 12-digit UPI Reference/UTR number OR upload a payment screenshot.');
      return;
    }

    setLoading(true);
    try {
      await submitPaymentProof(
        application.id,
        upiRef.trim(),
        screenshotDataUrl || ''
      );
      onPaymentSubmitted();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit payment proof.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                Application #{application.applicationId}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-[200px]">{application.serviceName}</span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-cyan-400" />
              <span>Complete Payment via UPI</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-cyan-950/40 border border-emerald-800/40 text-center">
            <span className="text-xs text-slate-400 block font-medium">Total Amount Due</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">₹{amount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Govt Filing & Cyber Cafe Processing Charge
            </span>
          </div>

          {/* UPI QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div className="p-3 rounded-2xl bg-white shadow-xl border-4 border-cyan-500/20 mb-3">
              <img
                src={cafeConfig.upiQrUrl || dynamicQrUrl}
                alt="Nautiyal Cyber Cafe UPI QR"
                className="w-44 h-44 object-contain"
              />
            </div>

            <p className="text-xs font-semibold text-white">Scan with any UPI App</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Google Pay • PhonePe • Paytm • BHIM • Cred • Amazon Pay
            </p>

            {/* UPI ID copy pill */}
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 max-w-full">
              <span className="text-xs text-slate-300 font-mono truncate">{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Fields */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                UPI Reference / UTR Number (12 Digits)
              </label>
              <input
                type="text"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                placeholder="e.g. 429810238491"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Found in your banking/UPI app payment receipt.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Upload Payment Screenshot (JPG / PNG)
              </label>
              <div className="mt-1">
                {screenshotDataUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-800/80">
                    <div className="flex items-center gap-3">
                      <img
                        src={screenshotDataUrl}
                        alt="Screenshot Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                          {screenshotName}
                        </p>
                        <p className="text-[10px] text-emerald-400">
                          ✓ Ready ({formatFileSize(screenshotSize)})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotDataUrl(null);
                        setScreenshotName(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-950 transition">
                    <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-200">
                      Upload Screenshot from Mobile / Gallery
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Payment Done Checkbox */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="paymentDone"
                checked={paymentDoneChecked}
                onChange={(e) => setPaymentDoneChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              <label htmlFor="paymentDone" className="text-xs text-slate-300 cursor-pointer">
                <strong className="text-white">Payment Done:</strong> I confirm that I have sent ₹{amount} to {upiName} and provided authentic transaction evidence.
              </label>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                Our admin verifies the transaction on the bank passbook before commencing your application work.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
            >
              Do Later
            </button>
            <button
              type="submit"
              disabled={loading || !paymentDoneChecked}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-950 flex items-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                'Submitting Proof...'
              ) : (
                <>
                  <span>Submit Payment for Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
