import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ServiceItem, ApplicationRecord, DocumentAttachment } from '../../types';
import { submitApplication } from '../../services/cafeService';
import {
  processDocumentUpload,
  generateApplicationId,
  formatFileSize,
} from '../../utils/fileHelpers';
import {
  X,
  Upload,
  FileCheck2,
  AlertCircle,
  FileText,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ApplyServiceModalProps {
  service: ServiceItem;
  onClose: () => void;
  onSuccess: (application: ApplicationRecord) => void;
}

export const ApplyServiceModal: React.FC<ApplyServiceModalProps> = ({
  service,
  onClose,
  onSuccess,
}) => {
  const { currentUser, userProfile } = useAuth();

  // Applicant info
  const [applicantName, setApplicantName] = useState(userProfile?.name || currentUser?.displayName || '');
  const [applicantPhone, setApplicantPhone] = useState(userProfile?.phone || '');
  const [applicantEmail, setApplicantEmail] = useState(userProfile?.email || currentUser?.email || '');
  const [notes, setNotes] = useState('');

  // Uploaded documents mapped by document name/label
  const [uploadedDocs, setUploadedDocs] = useState<DocumentAttachment[]>([]);
  const [uploadingDocLabel, setUploadingDocLabel] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocLabel(label);
    setErrorMessage(null);

    try {
      const docAttachment = await processDocumentUpload(file, label);
      // Remove any existing upload with this label and replace
      setUploadedDocs((prev) => [
        ...prev.filter((d) => d.name !== label),
        docAttachment,
      ]);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error reading document file.');
    } finally {
      setUploadingDocLabel(null);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (label: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.name !== label));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!applicantName.trim()) {
      setErrorMessage('Please enter applicant name.');
      return;
    }
    if (!applicantPhone.trim()) {
      setErrorMessage('Please enter 10-digit mobile number.');
      return;
    }

    if (uploadedDocs.length === 0) {
      setErrorMessage('Please upload at least one required document (e.g. Aadhaar Card).');
      return;
    }

    setLoading(true);
    try {
      const appId = generateApplicationId();
      const newApp = await submitApplication({
        applicationId: appId,
        customerId: currentUser?.uid || 'guest',
        customerName: applicantName.trim(),
        customerPhone: applicantPhone.trim(),
        customerEmail: applicantEmail.trim(),
        serviceId: service.id,
        serviceName: service.name,
        status: 'Pending',
        fee: service.fee,
        paymentStatus: 'unpaid',
        submittedDocuments: uploadedDocs,
        completedDocuments: [],
        formData: {
          notes: notes.trim(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      onSuccess(newApp);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {service.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">Turnaround: {service.processingTime}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{service.name}</h2>
            <p className="text-xs text-slate-400 mt-1">Application Fee: <strong className="text-emerald-400 font-semibold">₹{service.fee}</strong></p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Service Instructions */}
          {service.instructions && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
              <span className="font-bold text-cyan-400 block mb-1">Instructions for Applicant:</span>
              <p className="leading-relaxed">{service.instructions}</p>
            </div>
          )}

          {/* Section 1: Applicant Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>1. Applicant Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Applicant Full Name *
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Special Remarks / Specific Request (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Urgent processing needed / correct father name spelling / change registered mobile"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Section 2: Document Upload Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>2. Upload Required Documents (PDF / JPG / PNG, Max 5MB)</span>
              </h3>
              <span className="text-xs font-medium text-cyan-400">
                {uploadedDocs.length} uploaded
              </span>
            </div>

            <div className="space-y-3">
              {service.requiredDocuments && service.requiredDocuments.length > 0 ? (
                service.requiredDocuments.map((docReq, idx) => {
                  const uploaded = uploadedDocs.find((d) => d.name === docReq);
                  const isUploading = uploadingDocLabel === docReq;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        uploaded
                          ? 'bg-emerald-950/20 border-emerald-800/60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            uploaded
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {uploaded ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-white">{docReq}</p>
                          {uploaded ? (
                            <p className="text-[11px] text-emerald-400">
                              ✓ {uploaded.fileName} ({formatFileSize(uploaded.fileSize)})
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              Click to select PDF or image file
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {uploaded ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(docReq)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition">
                            <Upload className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{isUploading ? 'Reading file...' : 'Upload File'}</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => handleFileUpload(e, docReq)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                  No specific checklist. Upload any relevant identity or supporting document below.
                </div>
              )}

              {/* Extra Document upload option */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-slate-700/80 flex items-center justify-between">
                <span className="text-xs text-slate-300">Need to attach an extra file or photo?</span>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 hover:bg-cyan-900/60 text-xs font-medium text-cyan-300 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Extra Document</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, `Extra Document (${uploadedDocs.length + 1})`)
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              After submitting, you will be taken to the <strong className="text-white">UPI Payment step</strong> to complete your request.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  'Submitting Application...'
                ) : (
                  <>
                    <span>Submit & Proceed to Pay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
