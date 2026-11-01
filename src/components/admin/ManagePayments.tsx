import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApplicationRecord } from '../../types';
import { verifyPayment } from '../../services/cafeService';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Receipt,
} from 'lucide-react';

interface ManagePaymentsProps {
  applications: ApplicationRecord[];
  onRefreshApplications: () => Promise<void>;
}

export const ManagePayments: React.FC<ManagePaymentsProps> = ({
  applications,
  onRefreshApplications,
}) => {
  const { currentUser, adminProfile } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [previewScreenshot, setPreviewScreenshot] = useState<{
    url: string;
    appId: string;
    customer: string;
    amount: number;
    ref: string;
  } | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const appsWithPayment = applications.filter((a) => a.fee > 0);

  const filteredApps = appsWithPayment.filter((app) => {
    const matchesSearch =
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.paymentUpiRef && app.paymentUpiRef.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filter === 'pending') return matchesSearch && app.paymentStatus === 'pending_verification';
    if (filter === 'verified') return matchesSearch && app.paymentStatus === 'verified';
    if (filter === 'rejected') return matchesSearch && app.paymentStatus === 'rejected';
    return matchesSearch;
  });

  const handleVerify = async (app: ApplicationRecord, status: 'verified' | 'rejected') => {
    setProcessingId(app.id);
    try {
      const adminName = adminProfile?.name || currentUser?.displayName || 'Nautiyal Cyber Cafe Staff';
      await verifyPayment(app.id, status, currentUser?.uid || 'admin', adminName);
      await onRefreshApplications();
      if (previewScreenshot && previewScreenshot.appId === app.applicationId) {
        setPreviewScreenshot(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>UPI Payment Verification & Audit</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit customer bank UTR receipts, inspect UPI screenshots, and verify transactions.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              Pending Audit (
              {appsWithPayment.filter((a) => a.paymentStatus === 'pending_verification').length})
            </span>
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              filter === 'verified'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Verified ({appsWithPayment.filter((a) => a.paymentStatus === 'verified').length})
            </span>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              filter === 'rejected'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({appsWithPayment.filter((a) => a.paymentStatus === 'rejected').length})</span>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({appsWithPayment.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UTR, App ID, or customer..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-semibold">Application</th>
                <th className="py-3 px-4 font-semibold">Customer / Phone</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">UPI UTR / Reference</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Proof Screenshot</th>
                <th className="py-3 px-4 font-semibold">Audit Trail</th>
                <th className="py-3 px-4 font-semibold text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No payment records match the selected filter.
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
                    <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                      ₹{app.fee}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {app.paymentUpiRef ? (
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {app.paymentUpiRef}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None provided</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          app.paymentStatus === 'verified'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : app.paymentStatus === 'pending_verification'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                            : app.paymentStatus === 'rejected'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {app.paymentStatus === 'pending_verification'
                          ? 'Awaiting Audit'
                          : app.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.paymentScreenshotUrl ? (
                        <button
                          onClick={() =>
                            setPreviewScreenshot({
                              url: app.paymentScreenshotUrl || '',
                              appId: app.applicationId,
                              customer: app.customerName,
                              amount: app.fee,
                              ref: app.paymentUpiRef || 'N/A',
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 italic">No upload</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {app.verifiedByAdminName ? (
                        <div>
                          <span className="text-white font-medium">{app.verifiedByAdminName}</span>
                          <span className="block text-[10px] text-slate-500">
                            {app.verifiedAt ? new Date(app.verifiedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not audited</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerify(app, 'verified')}
                          disabled={processingId === app.id || app.paymentStatus === 'verified'}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-40 flex items-center gap-1 shadow"
                          title="Verify that funds were credited to cafe bank account"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => handleVerify(app, 'rejected')}
                          disabled={processingId === app.id || app.paymentStatus === 'rejected'}
                          className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold text-xs transition border border-rose-800 disabled:opacity-40"
                          title="Reject if amount not received or invalid proof"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
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

      {/* Screenshot Inspection Lightbox Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-400" />
                  <span>Payment Screenshot Audit</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  App: <strong className="text-white">{previewScreenshot.appId}</strong> • {previewScreenshot.customer} (₹{previewScreenshot.amount})
                </p>
              </div>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl p-2 flex items-center justify-center max-h-[60vh] overflow-auto border border-slate-800">
              <img
                src={previewScreenshot.url}
                alt="Payment proof"
                className="max-h-[55vh] object-contain rounded-lg"
              />
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400">Claimed UTR Reference: </span>
              <strong className="text-cyan-300 font-mono">{previewScreenshot.ref}</strong>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300"
              >
                Close
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const target = applications.find(
                      (a) => a.applicationId === previewScreenshot.appId
                    );
                    if (target) handleVerify(target, 'rejected');
                  }}
                  className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800"
                >
                  Reject Proof
                </button>
                <button
                  onClick={() => {
                    const target = applications.find(
                      (a) => a.applicationId === previewScreenshot.appId
                    );
                    if (target) handleVerify(target, 'verified');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950"
                >
                  Confirm & Mark Verified
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
