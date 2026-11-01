import React, { useState } from 'react';
import { ApplicationRecord } from '../../types';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  ShieldCheck,
  Receipt,
  Download,
} from 'lucide-react';

interface MyPaymentsProps {
  applications: ApplicationRecord[];
  onOpenPaymentModal: (app: ApplicationRecord) => void;
}

export const MyPayments: React.FC<MyPaymentsProps> = ({
  applications,
  onOpenPaymentModal,
}) => {
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  const totalPaid = applications
    .filter((a) => a.paymentStatus === 'verified')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const totalPending = applications
    .filter((a) => a.paymentStatus === 'pending_verification')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const totalDue = applications
    .filter((a) => a.paymentStatus === 'unpaid' || a.paymentStatus === 'rejected')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-400" />
          <span>Payment Records & Receipts</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Track UPI payments, transaction reference IDs, and verification statuses.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <span className="text-xs text-slate-400 font-medium">Verified Paid</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalPaid}</div>
          <span className="text-[11px] text-emerald-400/80">Confirmed in bank records</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <span className="text-xs text-slate-400 font-medium">Pending Verification</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">₹{totalPending}</div>
          <span className="text-[11px] text-cyan-400/80">Proof submitted, under audit</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <span className="text-xs text-slate-400 font-medium">Payment Due</span>
          <div className="text-2xl font-black text-amber-400 mt-1">₹{totalDue}</div>
          <span className="text-[11px] text-amber-400/80">Awaiting UPI transfer</span>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <span>Application Payment History</span>
          </h3>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12 p-4 text-xs text-slate-400">
            No payment history yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">Application</th>
                  <th className="py-3 px-4 font-semibold">Service</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">UPI Reference / UTR</th>
                  <th className="py-3 px-4 font-semibold">Payment Status</th>
                  <th className="py-3 px-4 font-semibold">Screenshot / Receipt</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {app.applicationId}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-[180px] truncate">
                      {app.serviceName}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                      ₹{app.fee}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {app.paymentUpiRef || <span className="text-slate-500 italic">None provided</span>}
                    </td>
                    <td className="py-3 px-4">
                      {app.paymentStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified
                        </span>
                      ) : app.paymentStatus === 'pending_verification' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 animate-pulse">
                          <Clock className="w-3 h-3 text-blue-400" /> Under Audit
                        </span>
                      ) : app.paymentStatus === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                          <XCircle className="w-3 h-3 text-rose-400" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          <AlertCircle className="w-3 h-3 text-amber-400" /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {app.paymentScreenshotUrl ? (
                        <button
                          onClick={() => setPreviewScreenshot(app.paymentScreenshotUrl || null)}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 italic">No upload</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(app.paymentStatus === 'unpaid' || app.paymentStatus === 'rejected') && (
                        <button
                          onClick={() => onOpenPaymentModal(app)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-950"
                        >
                          Pay Now
                        </button>
                      )}
                      {app.paymentStatus === 'verified' && (
                        <span className="text-[11px] text-slate-400">
                          Verified by {app.verifiedByAdminName || 'Staff'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <span>Submitted Payment Proof</span>
              </h3>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950 rounded-2xl p-2 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewScreenshot}
                alt="Payment proof screenshot"
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
