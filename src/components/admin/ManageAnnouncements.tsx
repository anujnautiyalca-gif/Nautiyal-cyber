import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AnnouncementItem } from '../../types';
import { createAnnouncement } from '../../services/cafeService';
import {
  Megaphone,
  Send,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ManageAnnouncementsProps {
  announcements: AnnouncementItem[];
  onRefreshAnnouncements: () => Promise<void>;
}

export const ManageAnnouncements: React.FC<ManageAnnouncementsProps> = ({
  announcements,
  onRefreshAnnouncements,
}) => {
  const { currentUser, adminProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Service Alert');
  const [actionUrl, setActionUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'registered'>('registered');

  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorNotice('Please provide both title and announcement message.');
      return;
    }

    setSending(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const senderName = adminProfile?.name || currentUser?.displayName || 'Nautiyal Cyber Cafe Staff';
      await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        category,
        actionUrl: actionUrl.trim() || undefined,
        sentBy: currentUser?.uid || 'admin',
        senderName,
        createdAt: new Date().toISOString(),
      });

      // Browser Notification trigger if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Nautiyal Cyber Cafe: ${title.trim()}`, {
          body: content.trim().substring(0, 100),
          icon: '/icon.svg',
        });
      }

      setSuccessNotice(`Announcement broadcasted successfully to ${targetAudience === 'registered' ? 'registered customers' : 'all users'}!`);
      setTitle('');
      setContent('');
      setActionUrl('');
      await onRefreshAnnouncements();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setErrorNotice(err instanceof Error ? err.message : 'Error sending announcement.');
    } finally {
      setSending(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        setSuccessNotice('System notification permission granted for this device.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <span>Announcement Broadcast System</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Send real-time alerts, scheme deadlines, and new service announcements to registered cafe clients.
          </p>
        </div>

        {'Notification' in window && Notification.permission !== 'granted' && (
          <button
            onClick={handleRequestNotificationPermission}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition self-start"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable Push Notifications</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Announcement Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
          <form onSubmit={handleBroadcast} className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Megaphone className="w-4 h-4 text-cyan-400" />
              <span>Compose Official Announcement</span>
            </h3>

            {successNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}
            {errorNotice && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Urgent: Uttarakhand Scholarship 2026 Last Date Extended!"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alert Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Govt Scheme">Govt Scheme</option>
                  <option value="Sarkari Job / Exam">Sarkari Job / Exam</option>
                  <option value="Admission / Scholarship">Admission / Scholarship</option>
                  <option value="Service Alert">New Service Launch</option>
                  <option value="Cafe Operating Hours">Cafe Timings & Schedule</option>
                  <option value="Important Deadline">Urgent Deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Send to Target Audience *
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as 'all' | 'registered')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="registered">Registered Customers Only</option>
                  <option value="all">All Web Users & App Visitors</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Message Box *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                placeholder="Type the full announcement message for customers..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Related Service Name or Action URL (Optional)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="e.g. New PAN Card Application or https://sarkariresult.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-950 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Broadcasting Announcement...' : 'Send Notification to Users'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Notification Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Live Notification Preview (Customer Device View)</span>
            </h3>

            {/* Mobile Push Notification Mock */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-800/60 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-white p-0.5 flex items-center justify-center border border-red-500/40 overflow-hidden">
                  <img src="/logo-circle.png" alt="Nautiyal Cafe" className="w-full h-full object-contain" />
                </div>
                <span className="text-[11px] font-bold text-cyan-300 uppercase">Nautiyal Cyber Cafe</span>
                <span className="text-[10px] text-slate-500 ml-auto">Now</span>
              </div>
              <p className="text-xs font-bold text-white mb-1">
                {title || 'Announcement Title Appears Here'}
              </p>
              <p className="text-[11px] text-slate-300 line-clamp-3">
                {content || 'Your detailed announcement message and instructions will be formatted and previewed on client smartphones and browser notifications here.'}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-cyan-400 font-semibold">
                <span>Category: {category}</span>
                <span>Tap to Open App</span>
              </div>
            </div>
          </div>

          {/* Announcement History */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Announcement History ({announcements.length})</span>
            </h3>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No previous broadcasts.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-white truncate max-w-[180px]">{item.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{item.content}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Sender: {item.senderName}</span>
                      <span className="text-cyan-400">{item.category}</span>
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
