import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApplicationRecord, ApplicationMessage } from '../../types';
import {
  sendApplicationMessage,
  subscribeToMessages,
} from '../../services/cafeService';
import {
  X,
  Send,
  MessageSquare,
  ShieldAlert,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ApplicationChatModalProps {
  application: ApplicationRecord;
  onClose: () => void;
}

export const ApplicationChatModal: React.FC<ApplicationChatModalProps> = ({
  application,
  onClose,
}) => {
  const { currentUser, userProfile, adminProfile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(application.id, (incoming) => {
      setMessages(incoming);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [application.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const senderRole = isAdmin ? 'admin' : 'customer';
    const senderName =
      adminProfile?.name ||
      userProfile?.name ||
      currentUser?.displayName ||
      currentUser?.email?.split('@')[0] ||
      'User';

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendApplicationMessage(application.id, {
        senderId: currentUser?.uid || 'user',
        senderName,
        senderRole,
        content: text,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[680px] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Application Messages</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {application.applicationId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                {application.serviceName} • {application.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
          {/* Welcome / Instruction Note */}
          <div className="text-center py-2">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              🔒 End-to-end secured chat with Nautiyal Cyber Cafe support team
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No messages yet.</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Have a question or need to clarify documents? Send a message below.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.uid;
              const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'main_admin';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      {isStaff ? (
                        <>
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-300">Staff: {msg.senderName}</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-cyan-400" />
                          <span className="text-slate-300">{msg.senderName}</span>
                        </>
                      )}
                    </span>
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                        : isStaff
                        ? 'bg-slate-800 border border-amber-600/30 text-amber-100 rounded-tl-none'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message, query or clarification..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-40 flex-shrink-0 shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
