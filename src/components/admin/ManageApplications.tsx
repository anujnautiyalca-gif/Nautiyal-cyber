import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApplicationRecord, CompletedDocument } from '../../types';
import {
  updateApplicationStatus,
  attachCompletedDocument,
} from '../../services/cafeService';
import {
  triggerFileDownload,
  processDocumentUpload,
  formatFileSize,
} from '../../utils/fileHelpers';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Send,
  X,
  FileCheck2,
} from 'lucide-react';

interface ManageApplicationsProps {
  applications: ApplicationRecord[];
  onRefreshApplications: () => Promise<void>;
  onOpenChat: (app: ApplicationRecord) => void;
  initialSelectedApp?: ApplicationRecord | null;
}

export const ManageApplications: React.FC<ManageApplicationsProps> = ({
  applications,
  onRefreshApplications,
  onOpenChat,
  initialSelectedApp,
}) => {
  const { currentUser, adminProfile } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(initialSelectedApp || null);

  // Return Document state
  const [returnDocLabel, setReturnDocLabel] = useState('Official Acknowledgment / Issued Certificate');
  const [returnDocFile, setReturnDocFile] = useState<{
    fileName: string;
    fileType: string;
    dataUrl: string;
    fileSize: number;
  } | null>(null);
  const [uploadingReturn, setUploadingReturn] = useState(false);
  const [returnSuccessNotice, setReturnSuccessNotice] = useState<string | null>(null);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customerPhone.includes(searchTerm) ||
      app.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (appId: string, newStatus: ApplicationRecord['status']) => {
    setUpdatingStatus(true);
    try {
      await updateApplicationStatus(appId, newStatus, adminNoteInput || undefined);
      await onRefreshApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp({
          ...selectedApp,
          status: newStatus,
          adminNotes: adminNoteInput || selectedApp.adminNotes,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReturnFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const docData = await processDocumentUpload(file, returnDocLabel);
      setReturnDocFile({
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        dataUrl: docData.dataUrl,
        fileSize: file.size,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendDocumentToCustomer = async () => {
    if (!selectedApp || !returnDocFile) return;

    setUploadingReturn(true);
    try {
      const adminName = adminProfile?.name || currentUser?.displayName || 'Nautiyal Cyber Cafe Staff';
      const completedDoc: CompletedDocument = {
        id: `ret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: returnDocLabel.trim(),
        fileName: returnDocFile.fileName,
        fileType: returnDocFile.fileType,
        dataUrl: returnDocFile.dataUrl,
        uploadedAt: new Date().toISOString(),
        adminUid: currentUser?.uid || 'admin',
        adminName,
      };

      await attachCompletedDocument(
        selectedApp.id,
        completedDoc,
        selectedApp.completedDocuments || []
      );

      setReturnSuccessNotice('Document sent successfully to customer! Application marked as Completed.');
      setReturnDocFile(null);
      await onRefreshApplications();

      // Update selected app state
      setSelectedApp({
        ...selectedApp,
        completedDocuments: [...(selectedApp.completedDocuments || []), completedDoc],
        status: 'Completed',
      });
      setTimeout(() => setReturnSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Error attaching return document:', err);
    } finally {
      setUploadingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Customer Applications Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Inspect customer proofs, download PDFs, process forms, and dispatch completed documents.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by App ID (e.g. NCC-2026), customer name, or phone..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Pending', 'Processing', 'Documents Required', 'Completed', 'Rejected'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === st
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Applications Table / Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-semibold">Application ID</th>
                <th className="py-3 px-4 font-semibold">Customer / Phone</th>
                <th className="py-3 px-4 font-semibold">Service Name</th>
                <th className="py-3 px-4 font-semibold">Documents</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No applications match the current query.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {app.applicationId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{app.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">📞 {app.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200 max-w-[200px] truncate">
                      {app.serviceName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {app.submittedDocuments?.length || 0} proofs
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          app.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : app.status === 'Processing'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : app.status === 'Documents Required'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : app.status === 'Rejected'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          app.paymentStatus === 'verified'
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : app.paymentStatus === 'pending_verification'
                            ? 'text-cyan-400 bg-blue-950/60'
                            : 'text-amber-400 bg-amber-950/60'
                        }`}
                      >
                        ₹{app.fee} ({app.paymentStatus})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                        <button
                          onClick={() => onOpenChat(app)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Message Customer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail & Document Return Drawer/Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700">
                    {selectedApp.applicationId}
                  </span>
                  <span className="text-xs text-slate-400">
                    Created: {new Date(selectedApp.createdAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{selectedApp.serviceName}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Customer: <strong className="text-white">{selectedApp.customerName}</strong> (📞 {selectedApp.customerPhone} • {selectedApp.customerEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {returnSuccessNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{returnSuccessNotice}</span>
                </div>
              )}

              {/* Status Update Control */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Update Application Status</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(['Pending', 'Processing', 'Documents Required', 'Completed', 'Rejected'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(selectedApp.id, st)}
                        disabled={updatingStatus}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          selectedApp.status === st
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        <span>{st}</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Add optional note/instruction for customer (e.g. Please send signed photo)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleStatusChange(selectedApp.id, selectedApp.status)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Save Note
                  </button>
                </div>
              </div>

              {/* Submitted Customer Documents List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Submitted Customer Documents ({selectedApp.submittedDocuments?.length || 0})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedApp.submittedDocuments?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {doc.fileName} ({formatFileSize(doc.fileSize)})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setPreviewDoc({ url: doc.dataUrl, name: doc.name })}
                          className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerFileDownload(doc.dataUrl, doc.fileName)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: Admin Document Return Workflow */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/30 border border-emerald-800/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Admin Document Return System</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Deliver completed PDF directly to customer
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Upload the official generated PDF or certificate (e.g. e-PAN card, acknowledgement slip, admit card, domicile certificate). Clicking <strong>Send to Customer</strong> attaches the verified file to their account and notifies them.
                </p>

                {/* Return File Upload Box */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Document Label / Title *
                    </label>
                    <input
                      type="text"
                      value={returnDocLabel}
                      onChange={(e) => setReturnDocLabel(e.target.value)}
                      placeholder="e.g. Official PAN Acknowledgement Receipt"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Select Completed Document (PDF / JPG / PNG)
                    </label>
                    {returnDocFile ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-emerald-700/80">
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs text-white font-medium truncate">
                            {returnDocFile.fileName} ({formatFileSize(returnDocFile.fileSize)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReturnDocFile(null)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-emerald-700/60 bg-slate-900/60 hover:bg-slate-900 transition text-xs font-semibold text-emerald-300">
                        <Upload className="w-4 h-4" />
                        <span>Choose Completed PDF / Document</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={handleReturnFileUpload}
                        />
                      </label>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!returnDocFile || uploadingReturn}
                      onClick={handleSendDocumentToCustomer}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-950 flex items-center gap-2 disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                      <span>{uploadingReturn ? 'Dispatching...' : 'Send to Customer & Complete'}</span>
                    </button>
                  </div>
                </div>

                {/* Already Returned Documents list */}
                {selectedApp.completedDocuments && selectedApp.completedDocuments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Previously Returned Files ({selectedApp.completedDocuments.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedApp.completedDocuments.map((doc, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              Returned by {doc.adminName} on {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerFileDownload(doc.dataUrl, doc.fileName)}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  onOpenChat(selectedApp);
                  setSelectedApp(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Messages with {selectedApp.customerName}</span>
              </button>

              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Lightbox */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white truncate">{previewDoc.name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-slate-950 rounded-xl p-2">
              {previewDoc.url.startsWith('data:image/') ? (
                <img
                  src={previewDoc.url}
                  alt="Preview"
                  className="max-h-[70vh] object-contain rounded"
                />
              ) : (
                <iframe
                  src={previewDoc.url}
                  title="Document Preview"
                  className="w-full h-[65vh] rounded"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => triggerFileDownload(previewDoc.url, previewDoc.name)}
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
