import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  FileCheck2,
  CreditCard,
  MessageSquare,
  Bell,
  Sliders,
  Settings,
  Users,
  Megaphone,
  Briefcase,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onSelectView: (view: string) => void;
  unreadCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onSelectView, unreadCount = 0 }) => {
  const { currentUser, userProfile, adminProfile, isAdmin, isMainAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Switch between Customer perspective and Admin perspective if admin
  const isCurrentlyInAdminMode = currentView.startsWith('admin_');

  const customerNavItems: NavItem[] = [
    { id: 'services', label: 'Available Services', icon: Briefcase },
    { id: 'apply', label: 'Apply Online', icon: PlusCircle },
    { id: 'applications', label: 'My Applications', icon: FileText },
    { id: 'documents', label: 'My Documents', icon: FileCheck2 },
    { id: 'payments', label: 'My Payments', icon: CreditCard },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin_dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'admin_services', label: 'Manage Services', icon: Sliders },
    { id: 'admin_applications', label: 'Applications', icon: FileText },
    { id: 'admin_payments', label: 'Payments', icon: CreditCard },
    { id: 'admin_announcements', label: 'Announcements', icon: Megaphone },
    { id: 'admin_customers', label: 'Customers', icon: Users },
    ...(isMainAdmin ? [{ id: 'admin_admins', label: 'Admin Accounts', icon: ShieldAlert }] : []),
    { id: 'admin_settings', label: 'Cafe Settings', icon: Settings },
  ];

  const activeItems = isCurrentlyInAdminMode ? adminNavItems : customerNavItems;

  const handleNavClick = (id: string) => {
    onSelectView(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView(isCurrentlyInAdminMode ? 'admin_dashboard' : 'services')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-white p-0.5 flex items-center justify-center shadow-sm border-2 border-red-600 group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
                <img src="/logo-circle.png" alt="Nautiyal Cyber Cafe" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                    Nautiyal Cafe
                  </span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      {isMainAdmin ? 'Main Admin' : 'Admin'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-blue-700 font-semibold italic hidden sm:block">
                  "If there is no struggle, there is no progress"
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {activeItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? isCurrentlyInAdminMode
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Switcher Toggle (if user has admin capabilities) */}
            {isAdmin && (
              <button
                onClick={() =>
                  onSelectView(isCurrentlyInAdminMode ? 'services' : 'admin_dashboard')
                }
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                  isCurrentlyInAdminMode
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
                title={isCurrentlyInAdminMode ? 'Switch to Customer View' : 'Switch to Admin Dashboard'}
              >
                {isCurrentlyInAdminMode ? (
                  <>
                    <User className="w-3.5 h-3.5" />
                    <span>Customer View</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </>
                )}
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shadow">
                  {(userProfile?.name || currentUser?.displayName || currentUser?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                  {userProfile?.name || currentUser?.displayName || 'Account'}
                </span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {userProfile?.name || currentUser?.displayName || 'Nautiyal Cyber Cafe User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                    {userProfile?.phone && (
                      <p className="text-[11px] text-blue-700 font-mono mt-0.5 font-semibold">
                        📞 {userProfile.phone}
                      </p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
                      Role: {adminProfile?.role || userProfile?.role || 'Customer'}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="px-2 py-1 md:hidden">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectView(isCurrentlyInAdminMode ? 'services' : 'admin_dashboard');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{isCurrentlyInAdminMode ? 'Switch to Customer Portal' : 'Open Admin Panel'}</span>
                      </button>
                    </div>
                  )}

                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSelectView('profile');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>My Profile & Contact</span>
                    </button>
                    <button
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out Securely</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="pb-2 border-b border-slate-100 mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCurrentlyInAdminMode ? 'Admin Navigation' : 'Customer Navigation'}
            </span>
            {isAdmin && (
              <button
                onClick={() => {
                  onSelectView(isCurrentlyInAdminMode ? 'services' : 'admin_dashboard');
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-amber-700 underline"
              >
                {isCurrentlyInAdminMode ? 'Go to Customer Portal' : 'Go to Admin Panel'}
              </button>
            )}
          </div>
          {activeItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? isCurrentlyInAdminMode
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-xs font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
