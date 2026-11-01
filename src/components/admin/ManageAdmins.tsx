import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminProfile, AdminPermission } from '../../types';
import { fetchAdmins, createOrUpdateAdmin, toggleAdminStatus } from '../../services/cafeService';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Power,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  User,
  Sliders,
} from 'lucide-react';

export const ManageAdmins: React.FC = () => {
  const { currentUser, isMainAdmin } = useAuth();

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'main_admin'>('admin');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([
    'manage_services',
    'manage_applications',
    'manage_payments',
    'manage_documents',
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const list = await fetchAdmins();
      setAdmins(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const availablePermissions: { id: AdminPermission; label: string; desc: string }[] = [
    {
      id: 'manage_services',
      label: 'Manage Services',
      desc: 'Add, edit, change pricing, and publish cyber cafe catalog services',
    },
    {
      id: 'manage_applications',
      label: 'Process Applications',
      desc: 'View customer submissions and update application status',
    },
    {
      id: 'manage_documents',
      label: 'Return Completed Documents',
      desc: 'Upload generated certificates and return PDFs to customer accounts',
    },
    {
      id: 'manage_payments',
      label: 'Verify UPI Payments',
      desc: 'Inspect screenshots and confirm bank transaction receipts',
    },
    {
      id: 'manage_announcements',
      label: 'Broadcast Announcements',
      desc: 'Send news and notifications to registered customers',
    },
    {
      id: 'manage_users',
      label: 'Customer Directory',
      desc: 'Access customer profiles and manage safe records retention',
    },
  ];

  const handleTogglePermission = (p: AdminPermission) => {
    if (selectedPermissions.includes(p)) {
      setSelectedPermissions(selectedPermissions.filter((item) => item !== p));
    } else {
      setSelectedPermissions([...selectedPermissions, p]);
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError('Please provide admin name and email.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real Firebase flow, the admin UID is generated upon user signup or invitation.
      // We create the admin grant record using an email-based hash/ID or invitation UID.
      const simulatedUid = `admin_${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;

      const newAdmin: AdminProfile = {
        uid: simulatedUid,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        active: true,
        permissions: selectedPermissions,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.uid || 'main_admin',
      };

      await createOrUpdateAdmin(newAdmin);
      setSuccess(`Admin account for ${email.trim()} provisioned successfully.`);
      setEmail('');
      setName('');
      setShowAddModal(false);
      await loadAdmins();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error provisioning admin account.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdminStatus = async (admin: AdminProfile) => {
    try {
      await toggleAdminStatus(admin.uid, !admin.active);
      await loadAdmins();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isMainAdmin) {
    return (
      <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Main Admin Clearance Required</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Only the Main Administrator (Cafe Owner) has permission to manage secondary admin accounts, assign roles, and grant permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <span>Admin Staff & Role-Based Access Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Main Admin privilege: Provision secondary staff accounts and configure granular permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-950 flex items-center gap-2 self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Admin Staff</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-semibold">Admin Name & Email</th>
                <th className="py-3 px-4 font-semibold">Assigned Role</th>
                <th className="py-3 px-4 font-semibold">Permitted Actions</th>
                <th className="py-3 px-4 font-semibold">Provisioned</th>
                <th className="py-3 px-4 font-semibold">Account State</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    {loading ? 'Loading admin staff...' : 'No admin accounts configured.'}
                  </td>
                </tr>
              ) : (
                admins.map((adm) => (
                  <tr key={adm.uid} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{adm.name}</div>
                      <div className="text-[11px] text-slate-400">{adm.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          adm.role === 'main_admin'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {adm.role === 'main_admin' ? 'Main Admin (Owner)' : 'Staff Admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {adm.role === 'main_admin' ? (
                          <span className="text-[10px] text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded">
                            Full Unrestricted Access
                          </span>
                        ) : (
                          (adm.permissions || []).map((p, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                            >
                              {p.replace('manage_', '')}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          adm.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {adm.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {adm.role !== 'main_admin' && (
                        <button
                          onClick={() => handleToggleAdminStatus(adm)}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            adm.active
                              ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                          }`}
                          title={adm.active ? 'Suspend Admin Access' : 'Reactivate Admin'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <span>Provision Secondary Admin Account</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Authorized admin accounts may log in and manage customer requests based on assigned roles.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Staff Admin Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Vikram Nautiyal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vikram@nautiyalcafe.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role Tier
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'main_admin')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="admin">Staff Admin (Restricted by permissions below)</option>
                  <option value="main_admin">Main Admin (Full control, add admins)</option>
                </select>
              </div>

              {role === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Permitted Sections & Operations
                  </label>
                  <div className="space-y-2">
                    {availablePermissions.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="mt-1 h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{perm.label}</span>
                          <span className="text-[10px] text-slate-400 block">{perm.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950 transition"
                >
                  {saving ? 'Provisioning...' : 'Provision Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
