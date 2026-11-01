import React, { useState } from 'react';
import { UserProfile, ApplicationRecord } from '../../types';
import { toggleCustomerDisabled, deleteCustomerSafely } from '../../services/cafeService';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Archive,
  Power,
  Eye,
  FileText,
} from 'lucide-react';

interface ManageCustomersProps {
  customers: UserProfile[];
  applications: ApplicationRecord[];
  onRefreshCustomers: () => Promise<void>;
  onViewCustomerApplications: (customer: UserProfile) => void;
}

export const ManageCustomers: React.FC<ManageCustomersProps> = ({
  customers,
  applications,
  onRefreshCustomers,
  onViewCustomerApplications,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerToArchive, setCustomerToArchive] = useState<UserProfile | null>(null);
  const [processing, setProcessing] = useState(false);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleDisabled = async (customer: UserProfile) => {
    try {
      await toggleCustomerDisabled(customer.uid, !customer.disabled);
      await onRefreshCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmArchive = async () => {
    if (!customerToArchive) return;
    setProcessing(true);
    try {
      await deleteCustomerSafely(customerToArchive.uid);
      await onRefreshCustomers();
      setCustomerToArchive(null);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Customer Directory & Account Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Registered customer profiles, application counts, and safe archiving in accordance with data retention rules.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start">
          Total Registered: <strong className="text-white">{customers.length}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, 10-digit mobile, email, or village/city..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-semibold">Customer Name</th>
                <th className="py-3 px-4 font-semibold">Contact (Phone & Email)</th>
                <th className="py-3 px-4 font-semibold">Address</th>
                <th className="py-3 px-4 font-semibold">Applications Filed</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const customerApps = applications.filter((a) => a.customerId === c.uid);

                  return (
                    <tr
                      key={c.uid}
                      className={`hover:bg-slate-800/40 transition ${
                        c.disabled ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {c.uid.substring(0, 10)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-cyan-300 font-semibold">
                          📞 {c.phone || 'No phone'}
                        </div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">
                        {c.address || <span className="italic text-slate-600">None given</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {customerApps.length} apps
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.disabled
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {c.disabled ? 'Suspended / Archived' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewCustomerApplications(c)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
                            title="View all applications submitted by this customer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Apps ({customerApps.length})</span>
                          </button>
                          <button
                            onClick={() => handleToggleDisabled(c)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              c.disabled
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title={c.disabled ? 'Re-activate Customer' : 'Suspend Customer'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCustomerToArchive(c)}
                            className="p-1.5 rounded-lg hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 transition"
                            title="Safe Archive Workflow"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Archive / Deletion Workflow Modal */}
      {customerToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white text-center">
              Customer Archival & Retention Workflow
            </h3>
            <p className="text-xs text-slate-300 mt-2 text-center leading-relaxed">
              You are archiving customer account: <strong>{customerToArchive.name}</strong> ({customerToArchive.email}).
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              ⚖️ <strong>Compliance Retention Policy:</strong> To adhere to Indian financial audit and cyber cafe legal standards, existing service applications, invoices, and payment records associated with this customer are <strong>strictly preserved</strong> and marked archived, rather than silently destroyed.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCustomerToArchive(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmArchive}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950"
              >
                {processing ? 'Archiving...' : 'Confirm Archival'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
