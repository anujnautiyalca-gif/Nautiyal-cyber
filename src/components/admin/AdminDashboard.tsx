import React from 'react';
import { ApplicationRecord, UserProfile } from '../../types';
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  Sliders,
} from 'lucide-react';

interface AdminDashboardProps {
  applications: ApplicationRecord[];
  customers: UserProfile[];
  onNavigate: (view: string) => void;
  onOpenApplication: (app: ApplicationRecord) => void;
  onOpenPaymentModal: (app: ApplicationRecord) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  applications,
  customers,
  onNavigate,
  onOpenApplication,
}) => {
  const totalCustomers = customers.length;
  const totalApps = applications.length;
  const pendingApps = applications.filter((a) => a.status === 'Pending').length;
  const processingApps = applications.filter((a) => a.status === 'Processing').length;
  const completedApps = applications.filter((a) => a.status === 'Completed').length;
  const docsRequiredApps = applications.filter((a) => a.status === 'Documents Required').length;
  const paymentsAwaiting = applications.filter((a) => a.paymentStatus === 'pending_verification').length;

  const totalRevenue = applications
    .filter((a) => a.paymentStatus === 'verified')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const pendingApplicationsList = applications
    .filter((a) => a.status === 'Pending' || a.status === 'Processing' || a.status === 'Documents Required')
    .slice(0, 5);

  const pendingPaymentsList = applications
    .filter((a) => a.paymentStatus === 'pending_verification')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Operations Center</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Nautiyal Cyber Cafe Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time control panel for customer service requests, verification, and document dispatch.
          </p>
        </div>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => onNavigate('admin_services')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage Services</span>
          </button>
          <button
            onClick={() => onNavigate('admin_announcements')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-950 flex items-center gap-1.5 transition"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Broadcast Alert</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigate('admin_customers')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Customers</span>
            <Users className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white">{totalCustomers}</div>
          <span className="text-[11px] text-slate-500">Registered users</span>
        </div>

        <div
          onClick={() => onNavigate('admin_applications')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Applications</span>
            <FileText className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white">{totalApps}</div>
          <span className="text-[11px] text-slate-500">All submissions</span>
        </div>

        <div
          onClick={() => onNavigate('admin_applications')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-700/60 transition cursor-pointer shadow group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingApps + processingApps}</div>
          <span className="text-[11px] text-amber-400/80">Require staff work</span>
        </div>

        <div
          onClick={() => onNavigate('admin_applications')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-700/60 transition cursor-pointer shadow group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedApps}</div>
          <span className="text-[11px] text-emerald-400/80">Delivered to users</span>
        </div>

        <div
          onClick={() => onNavigate('admin_payments')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-700/60 transition cursor-pointer shadow group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">UPI Audits Pending</span>
            <CreditCard className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{paymentsAwaiting}</div>
          <span className="text-[11px] text-cyan-400/80">Verify screenshot</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Collected</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">₹{totalRevenue}</div>
          <span className="text-[11px] text-slate-500">Verified UPI receipts</span>
        </div>
      </div>

      {/* Two Column Grid: Pending Applications & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Waiting for Staff Action */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Applications Awaiting Processing ({pendingApplicationsList.length})</span>
              </h3>
              <button
                onClick={() => onNavigate('admin_applications')}
                className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingApplicationsList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No pending applications! All customer submissions processed.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApplicationsList.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onOpenApplication(app)}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-cyan-700/60 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {app.applicationId}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {app.serviceName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Applicant: <strong className="text-slate-300">{app.customerName}</strong> • 📞 {app.customerPhone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        {app.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* UPI Payments Requiring Verification */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>UPI Payments Needing Verification ({pendingPaymentsList.length})</span>
              </h3>
              <button
                onClick={() => onNavigate('admin_payments')}
                className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Audit All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingPaymentsList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                All uploaded UPI proofs have been verified or resolved!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPaymentsList.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onNavigate('admin_payments')}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-700/60 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-emerald-400">₹{app.fee}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {app.applicationId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {app.customerName} • Ref:{' '}
                        <span className="font-mono text-cyan-300">
                          {app.paymentUpiRef || 'Screenshot Attached'}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        Audit Proof
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
