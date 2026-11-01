import React, { useState } from 'react';
import { ApplicationRecord } from '../../types';
import { triggerFileDownload, formatFileSize } from '../../utils/fileHelpers';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CreditCard,
  MessageSquare,
  Download,
  Eye,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MyApplicationsProps {
  applications: ApplicationRecord[];
  onOpenPaymentModal: (app: ApplicationRecord) => void;
  onOpenChatModal: (app: ApplicationRecord) => void;
}

export const MyApplications: React.FC<MyApplicationsProps> = ({
  applications,
  onOpenPaymentModal,
  onOpenChatModal,
}) => {
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<{ url: string; name: string } | null>(null);

  const getStatusBadge = (status: ApplicationRecord['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Work in Progress
          </span>
        );
      case 'Documents Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Additional Docs Needed
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed & Ready
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: ApplicationRecord['paymentStatus']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            ✓ Paid & Verified
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
            ⏳ Verifying Payment
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
            ✕ Proof Rejected (Re-submit)
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            ! Payment Due
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>My Service Applications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track real-time progress, download returned official certificates & message cafe operators.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start">
          Total Applications: <strong className="text-white">{applications.length}</strong>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No Applications Submitted Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Browse our Available Services catalogue to apply for PAN Card, Aadhaar correction, certificates, or admission forms.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const hasCompletedDocs = app.completedDocuments && app.completedDocuments.length > 0;

            return (
              <div
                key={app.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all"
              >
                {/* Application Card Main Banner */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700">
                        {app.applicationId}
                      </span>
                      {getStatusBadge(app.status)}
                      {getPaymentBadge(app.paymentStatus)}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">{app.serviceName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                      <span>Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Applicant: <strong className="text-slate-200">{app.customerName}</strong></span>
                      <span>•</span>
                      <span>Fee: <strong className="text-emerald-400">₹{app.fee}</strong></span>
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    {/* Payment Proof Button if unpaid or rejected */}
                    {(app.paymentStatus === 'unpaid' || app.paymentStatus === 'rejected') && (
                      <button
                        onClick={() => onOpenPaymentModal(app)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950 flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay ₹{app.fee}</span>
                      </button>
                    )}

                    {/* Messages button */}
                    <button
                      onClick={() => onOpenChatModal(app)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Chat / Query</span>
                    </button>

                    {/* Expand Details button */}
                    <button
                      onClick={() => toggleExpand(app.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Return Documents Notification Banner if Completed */}
                {hasCompletedDocs && (
                  <div className="bg-emerald-950/40 border-t border-b border-emerald-800/40 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-300">
                          {app.completedDocuments.length} Completed Return Document(s) Ready for Download!
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Generated and approved by Nautiyal Cyber Cafe staff.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {app.completedDocuments.map((doc, idx) => (
                        <button
                          key={idx}
                          onClick={() => triggerFileDownload(doc.dataUrl, doc.fileName)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download {doc.name || 'Certificate'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expandable Section */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 bg-slate-950/50 space-y-4">
                    {/* Admin notes if any */}
                    {app.adminNotes && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200">
                        <strong className="block text-amber-300 mb-0.5">Note from Cafe Admin:</strong>
                        {app.adminNotes}
                      </div>
                    )}

                    {/* Submitted Documents Grid */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Submitted Identity & Supporting Documents
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {app.submittedDocuments.map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-semibold text-white truncate">{doc.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{doc.fileName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => setPreviewDocUrl({ url: doc.dataUrl, name: doc.name })}
                                className="p-1 rounded text-slate-400 hover:text-white"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => triggerFileDownload(doc.dataUrl, doc.fileName)}
                                className="p-1 rounded text-slate-400 hover:text-cyan-400"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Audit Info */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-slate-400">Payment Status: </span>
                        <strong className="text-white capitalize">{app.paymentStatus}</strong>
                        {app.paymentUpiRef && (
                          <span className="ml-2 font-mono text-[11px] text-cyan-400">
                            (Ref: {app.paymentUpiRef})
                          </span>
                        )}
                      </div>
                      {app.verifiedByAdminName && (
                        <div className="text-[11px] text-slate-400">
                          Verified by: <span className="text-emerald-400">{app.verifiedByAdminName}</span> on{' '}
                          {app.verifiedAt ? new Date(app.verifiedAt).toLocaleDateString() : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white truncate">{previewDocUrl.name}</h3>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-slate-950 rounded-xl p-2">
              {previewDocUrl.url.startsWith('data:image/') ? (
                <img
                  src={previewDocUrl.url}
                  alt="Preview"
                  className="max-h-[70vh] object-contain rounded"
                />
              ) : (
                <iframe
                  src={previewDocUrl.url}
                  title="PDF Preview"
                  className="w-full h-[65vh] rounded"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => triggerFileDownload(previewDocUrl.url, previewDocUrl.name)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
