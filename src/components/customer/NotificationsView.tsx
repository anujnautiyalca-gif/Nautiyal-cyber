import React from 'react';
import { AnnouncementItem } from '../../types';
import { Megaphone, Bell, Calendar, ExternalLink } from 'lucide-react';

interface NotificationsViewProps {
  announcements: AnnouncementItem[];
  onSelectService?: (serviceName: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  announcements,
  onSelectService,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-500" />
          <span>Announcements & Push Notifications</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Real-time bulletins, new service launches, government exam deadlines & cafe operating alerts synced across Android & Web.
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No New Announcements</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You're all caught up! Important notifications and new service launches from Nautiyal Cyber Cafe will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                      item.category === 'New Service Launch'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {item.category || 'Announcement'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Posted by: <strong className="text-slate-800">{item.senderName || 'Cafe Admin'}</strong>
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {item.content}
              </p>

              {item.actionUrl && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onSelectService && onSelectService(item.actionUrl || '')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition"
                  >
                    <span>Apply / View Service</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
