/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';

// Customer Components
import { ServicesCatalogue } from './components/customer/ServicesCatalogue';
import { ApplyServiceModal } from './components/customer/ApplyServiceModal';
import { UPIPaymentModal } from './components/customer/UPIPaymentModal';
import { MyApplications } from './components/customer/MyApplications';
import { MyDocuments } from './components/customer/MyDocuments';
import { MyPayments } from './components/customer/MyPayments';
import { NotificationsView } from './components/customer/NotificationsView';
import { ProfileView } from './components/customer/ProfileView';

// Common Components
import { ApplicationChatModal } from './components/common/ApplicationChatModal';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ManageServices } from './components/admin/ManageServices';
import { ManageApplications } from './components/admin/ManageApplications';
import { ManagePayments } from './components/admin/ManagePayments';
import { ManageAnnouncements } from './components/admin/ManageAnnouncements';
import { ManageCustomers } from './components/admin/ManageCustomers';
import { ManageAdmins } from './components/admin/ManageAdmins';
import { CafeSettings } from './components/admin/CafeSettings';

// Services & Types
import {
  fetchServices,
  fetchCafeConfig,
  fetchCustomerApplications,
  fetchAllApplications,
  fetchAnnouncements,
  fetchRegisteredCustomers,
  subscribeToServices,
  subscribeToCafeConfig,
  subscribeToCustomerApplications,
  subscribeToAllApplications,
  subscribeToAnnouncements,
  subscribeToRegisteredCustomers,
} from './services/cafeService';
import {
  initializePushNotifications,
  triggerLocalNotification,
  InAppNotificationPayload,
} from './services/fcmService';
import {
  ServiceItem,
  ApplicationRecord,
  AnnouncementItem,
  CafeConfig,
  UserProfile,
} from './types';
import { DEFAULT_CAFE_CONFIG } from './data/initialData';
import { Loader2, BellRing, X, ArrowRight } from 'lucide-react';

const MainPortal: React.FC = () => {
  const { currentUser, isAdmin, isMainAdmin, loading: authLoading } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('services');

  // Core data states (real-time synchronized across Android, Tablet & Desktop)
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [allApplications, setAllApplications] = useState<ApplicationRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [cafeConfig, setCafeConfig] = useState<CafeConfig>(DEFAULT_CAFE_CONFIG);
  const [, setDataLoading] = useState<boolean>(true);

  // Live Push Notification Banner state
  const [liveBanner, setLiveBanner] = useState<InAppNotificationPayload | null>(null);

  // Modals
  const [applyingService, setApplyingService] = useState<ServiceItem | null>(null);
  const [paymentModalApp, setPaymentModalApp] = useState<ApplicationRecord | null>(null);
  const [chatModalApp, setChatModalApp] = useState<ApplicationRecord | null>(null);

  // Manual refresh helper for explicit refresh triggers
  const loadData = async () => {
    try {
      const [svcData, cfgData, annData] = await Promise.all([
        fetchServices(),
        fetchCafeConfig(),
        fetchAnnouncements(),
      ]);
      setServices(svcData);
      setCafeConfig(cfgData);
      setAnnouncements(annData);

      if (currentUser) {
        const myApps = await fetchCustomerApplications(currentUser.uid);
        setApplications(myApps);

        if (isAdmin) {
          try {
            const [allApps, custList] = await Promise.all([
              fetchAllApplications(),
              fetchRegisteredCustomers(),
            ]);
            setAllApplications(allApps);
            setCustomers(custList);
          } catch (e) {
            console.warn('Admin data load notice:', e);
          }
        }
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // Real-time Firestore Synchronization + Firebase Cloud Messaging (FCM)
  useEffect(() => {
    if (!currentUser) return;

    // 1. Initialize FCM & Native Android Push Notifications
    initializePushNotifications(currentUser.uid, (payload) => {
      setLiveBanner(payload);
    });

    // 2. Real-time Services Catalogue sync (with instant notification when admin publishes a new service)
    const unsubServices = subscribeToServices(
      (liveServices) => {
        setServices(liveServices);
        setDataLoading(false);
      },
      (newService) => {
        if (!isAdmin) {
          const title = `New Service Published: ${newService.name}`;
          const body = `Now available at Nautiyal Cyber Cafe (Fee: ₹${newService.fee}). Tap to apply!`;
          triggerLocalNotification(title, body, 'new_services_channel');
          setLiveBanner({
            id: `svc_${newService.id}`,
            title,
            body,
            category: 'New Service Launch',
            actionUrl: newService.id,
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    // 3. Real-time Cafe Config sync
    const unsubConfig = subscribeToCafeConfig((liveConfig) => {
      setCafeConfig(liveConfig);
    });

    // 4. Real-time Announcements sync
    const unsubAnnouncements = subscribeToAnnouncements(
      (liveAnnouncements) => {
        setAnnouncements(liveAnnouncements);
      },
      (newAnnouncement) => {
        if (!isAdmin && newAnnouncement.category !== 'New Service Launch') {
          triggerLocalNotification(
            newAnnouncement.title,
            newAnnouncement.content,
            'new_services_channel'
          );
          setLiveBanner({
            id: `ann_${newAnnouncement.id}`,
            title: newAnnouncement.title,
            body: newAnnouncement.content,
            category: newAnnouncement.category || 'Announcement',
            actionUrl: newAnnouncement.actionUrl,
            timestamp: newAnnouncement.createdAt,
          });
        }
      }
    );

    // 5. Real-time Customer Applications sync (notifies when status, payment, or completed document is updated)
    const unsubCustomerApps = subscribeToCustomerApplications(
      currentUser.uid,
      (liveApps) => {
        setApplications(liveApps);
      },
      (updatedApp) => {
        if (!isAdmin) {
          const hasCompletedDocs = (updatedApp.completedDocuments?.length || 0) > 0;
          const title =
            updatedApp.status === 'Completed' && hasCompletedDocs
              ? `Document Ready: ${updatedApp.serviceName}`
              : `Application Update (${updatedApp.applicationId})`;
          const body =
            updatedApp.status === 'Completed' && hasCompletedDocs
              ? `Your official completed document for ${updatedApp.serviceName} is ready to download!`
              : `Status: ${updatedApp.status} • Payment: ${updatedApp.paymentStatus.replace('_', ' ')}`;

          triggerLocalNotification(title, body, 'application_updates_channel');
          setLiveBanner({
            id: `app_${updatedApp.id}_${Date.now()}`,
            title,
            body,
            category: 'Application Update',
            actionUrl: updatedApp.status === 'Completed' ? 'documents' : 'applications',
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    // 6. Real-time Admin Applications & Customers sync
    let unsubAllApps: (() => void) | undefined;
    let unsubCustomers: (() => void) | undefined;
    if (isAdmin) {
      unsubAllApps = subscribeToAllApplications((liveAllApps) => {
        setAllApplications(liveAllApps);
      });
      unsubCustomers = subscribeToRegisteredCustomers((liveCustomers) => {
        setCustomers(liveCustomers);
      });
    }

    return () => {
      unsubServices();
      unsubConfig();
      unsubAnnouncements();
      unsubCustomerApps();
      if (unsubAllApps) unsubAllApps();
      if (unsubCustomers) unsubCustomers();
    };
  }, [currentUser, isAdmin]);

  // Set default view on login: Admin gets admin_dashboard, Customer gets services
  useEffect(() => {
    if (currentUser && !authLoading) {
      if (isAdmin && currentView === 'services') {
        setCurrentView('admin_dashboard');
      }
    }
  }, [currentUser, isAdmin, authLoading]);

  // Show loading spinner during initial authentication check (Light Mode)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center text-slate-700">
        <div className="w-20 h-20 rounded-full bg-white border-2 border-red-500 p-2 flex items-center justify-center mb-4 shadow-xl animate-pulse overflow-hidden">
          <img src="/logo-circle.png" alt="Nautiyal Cyber Cafe" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-700 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span>Starting Nautiyal Cyber Cafe Portal...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated: Show customer & admin login/registration
  if (!currentUser) {
    return (
      <>
        <AuthModal />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="light-portal min-h-screen relative bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Subtle Daylight Himalayan Temple Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-25"
        style={{ backgroundImage: `url('/bg-himalayas.jpg')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-white/75 via-slate-50/85 to-slate-100/95 pointer-events-none" />

      {/* Global Header */}
      <div className="relative z-20">
        <Header
          currentView={currentView}
          onSelectView={(view) => setCurrentView(view)}
          unreadCount={announcements.length}
        />
      </div>

      {/* Real-time Push Notification Toast Banner */}
      {liveBanner && (
        <div className="relative z-30 max-w-4xl w-full mx-auto px-4 pt-3">
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-3.5 shadow-xl flex items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                    {liveBanner.category}
                  </span>
                  <span className="text-[11px] text-slate-500">Just now</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {liveBanner.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{liveBanner.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {liveBanner.actionUrl && (
                <button
                  onClick={() => {
                    const matchedService = services.find((s) => s.id === liveBanner.actionUrl);
                    if (matchedService) {
                      setCurrentView('services');
                      setApplyingService(matchedService);
                    } else if (
                      liveBanner.actionUrl === 'documents' ||
                      liveBanner.actionUrl === 'applications'
                    ) {
                      setCurrentView(liveBanner.actionUrl);
                    } else {
                      setCurrentView('services');
                    }
                    setLiveBanner(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setLiveBanner(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* CUSTOMER VIEWS */}
        {currentView === 'services' && (
          <ServicesCatalogue
            services={services}
            onApplyService={(service) => setApplyingService(service)}
            cafeBanner={cafeConfig.bannerNotice}
          />
        )}

        {currentView === 'apply' && (
          <div className="space-y-4">
            <div className="text-center sm:text-left mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Select a Service to Apply</h1>
              <p className="text-xs text-slate-600 mt-1">
                Choose the digital or government service you want Nautiyal Cyber Cafe to process for you.
              </p>
            </div>
            <ServicesCatalogue
              services={services}
              onApplyService={(service) => setApplyingService(service)}
            />
          </div>
        )}

        {currentView === 'applications' && (
          <MyApplications
            applications={applications}
            onOpenPaymentModal={(app) => setPaymentModalApp(app)}
            onOpenChatModal={(app) => setChatModalApp(app)}
          />
        )}

        {currentView === 'documents' && (
          <MyDocuments applications={applications} />
        )}

        {currentView === 'payments' && (
          <MyPayments
            applications={applications}
            onOpenPaymentModal={(app) => setPaymentModalApp(app)}
          />
        )}

        {currentView === 'messages' && (
          <div className="space-y-4">
            {applications.length > 0 ? (
              <ApplicationChatModal
                application={applications[0]}
                onClose={() => setCurrentView('applications')}
              />
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h3 className="text-base font-bold text-slate-900">No Active Applications to Chat On</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Once you apply for a service, an end-to-end chat room will be enabled for clarifying documents.
                </p>
              </div>
            )}
          </div>
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            announcements={announcements}
            onSelectService={(serviceIdOrName) => {
              const matched = services.find(
                (s) => s.id === serviceIdOrName || s.name === serviceIdOrName
              );
              setCurrentView('services');
              if (matched) {
                setApplyingService(matched);
              }
            }}
          />
        )}

        {currentView === 'profile' && <ProfileView />}

        {/* ADMIN VIEWS (Guarded) */}
        {isAdmin && currentView === 'admin_dashboard' && (
          <AdminDashboard
            applications={allApplications}
            customers={customers}
            onNavigate={(view) => setCurrentView(view)}
            onOpenApplication={() => {
              setCurrentView('admin_applications');
            }}
            onOpenPaymentModal={() => {
              setCurrentView('admin_payments');
            }}
          />
        )}

        {isAdmin && currentView === 'admin_services' && (
          <ManageServices
            services={services}
            onRefreshServices={loadData}
          />
        )}

        {isAdmin && currentView === 'admin_applications' && (
          <ManageApplications
            applications={allApplications}
            onRefreshApplications={loadData}
            onOpenChat={(app) => setChatModalApp(app)}
          />
        )}

        {isAdmin && currentView === 'admin_payments' && (
          <ManagePayments
            applications={allApplications}
            onRefreshApplications={loadData}
          />
        )}

        {isAdmin && currentView === 'admin_announcements' && (
          <ManageAnnouncements
            announcements={announcements}
            onRefreshAnnouncements={loadData}
          />
        )}

        {isAdmin && currentView === 'admin_customers' && (
          <ManageCustomers
            customers={customers}
            applications={allApplications}
            onRefreshCustomers={loadData}
            onViewCustomerApplications={() => {
              setCurrentView('admin_applications');
            }}
          />
        )}

        {isAdmin && isMainAdmin && currentView === 'admin_admins' && (
          <ManageAdmins />
        )}

        {isAdmin && currentView === 'admin_settings' && (
          <CafeSettings
            cafeConfig={cafeConfig}
            onRefreshConfig={loadData}
          />
        )}
      </main>

      {/* MODALS */}

      {/* 1. Apply Service Modal */}
      {applyingService && (
        <ApplyServiceModal
          service={applyingService}
          onClose={() => setApplyingService(null)}
          onSuccess={(newApp) => {
            setApplyingService(null);
            loadData();
            setPaymentModalApp(newApp);
          }}
        />
      )}

      {/* 2. UPI Payment Modal */}
      {paymentModalApp && (
        <UPIPaymentModal
          application={paymentModalApp}
          cafeConfig={cafeConfig}
          onClose={() => setPaymentModalApp(null)}
          onPaymentSubmitted={() => {
            setPaymentModalApp(null);
            loadData();
            setCurrentView('applications');
          }}
        />
      )}

      {/* 3. Real-time Application Chat Modal */}
      {chatModalApp && (
        <ApplicationChatModal
          application={chatModalApp}
          onClose={() => setChatModalApp(null)}
        />
      )}

      {/* Offline Toast */}
      <OfflineIndicator />

      {/* Footer (Light Mode) */}
      <footer className="relative z-10 mt-auto border-t border-slate-200 bg-white/95 backdrop-blur-md py-6 text-xs text-slate-600 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
            <span className="font-extrabold text-slate-900">Nautiyal Cyber Cafe</span>
            <span>•</span>
            <a href={`tel:${cafeConfig.phone}`} className="text-blue-700 hover:underline font-semibold">
              📞 {cafeConfig.phone}
            </a>
            <span>•</span>
            <a
              href={`https://wa.me/91${cafeConfig.alternatePhone || '8077351849'}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:underline font-semibold"
            >
              💬 WhatsApp: {cafeConfig.alternatePhone || '8077351849'}
            </a>
            <span>•</span>
            <a href={`mailto:${cafeConfig.email}`} className="text-amber-700 hover:underline font-semibold">
              ✉️ {cafeConfig.email}
            </a>
          </div>
          <div className="text-[11px] text-slate-700 font-medium text-center md:text-right">
            📍 {cafeConfig.address}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}
