import React, { useState } from 'react';
import { ApplicationRecord } from '../../types';
import { triggerFileDownload, formatFileSize } from '../../utils/fileHelpers';
import {
  FileCheck2,
  Download,
  Eye,
  Calendar,
  ShieldCheck,
  Search,
  FileText,
  UserCheck,
} from 'lucide-react';

interface MyDocumentsProps {
  applications: ApplicationRecord[];
}

export const MyDocuments: React.FC<MyDocumentsProps> = ({ applications }) => {
  const [activeTab, setActiveTab] = useState<'completed' | 'submitted'>('completed');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);

  // Extract all completed return documents across applications
  const completedDocsList = applications.flatMap((app) =>
    (app.completedDocuments || []).map((doc) => ({
      ...doc,
      applicationId: app.applicationId,
      serviceName: app.serviceName,
      createdAt: app.createdAt,
    }))
  );

  // Extract all submitted user documents across applications
  const submittedDocsList = applications.flatMap((app) =>
    (app.submittedDocuments || []).map((doc) => ({
      ...doc,
      applicationId: app.applicationId,
      serviceName: app.serviceName,
      customerName: app.customerName,
    }))
  );

  const filteredCompleted = completedDocsList.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.applicationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubmitted = submittedDocsList.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.applicationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-400" />
            <span>Digital Document Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Access, view & download official certificates, acknowledgments and submitted proofs anytime.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Completed Returns ({completedDocsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'submitted'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Uploaded Proofs ({submittedDocsList.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by name or App ID..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* TAB 1: Completed / Returned Documents */}
      {activeTab === 'completed' && (
        <div>
          {filteredCompleted.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No Completed Documents Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Once our cyber cafe operators verify and finish your application, your official digital certificate or acknowledgment PDF will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompleted.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-emerald-700/60 transition group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        App: {doc.applicationId}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {doc.name || 'Official Returned Document'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{doc.serviceName}</p>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>
                        Verified & Returned by:{' '}
                        <strong className="text-white">{doc.adminName || 'Authorized Staff'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {doc.fileName}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDoc({ url: doc.dataUrl, name: doc.name })}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => triggerFileDownload(doc.dataUrl, doc.fileName)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Uploaded Proofs */}
      {activeTab === 'submitted' && (
        <div>
          {filteredSubmitted.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No Uploaded Files</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Documents you upload during service applications will be archived here safely.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredSubmitted.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-cyan-700/60 transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                      <span>{doc.applicationId}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{doc.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{doc.serviceName}</p>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{doc.fileName}</p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPreviewDoc({ url: doc.dataUrl, name: doc.name })}
                      className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => triggerFileDownload(doc.dataUrl, doc.fileName)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white truncate">{previewDoc.name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-slate-950 rounded-xl p-2">
              {previewDoc.url.startsWith('data:image/') ? (
                <img
                  src={previewDoc.url}
                  alt="Preview"
                  className="max-h-[70vh] object-contain rounded"
                />
              ) : (
                <iframe
                  src={previewDoc.url}
                  title="Document Preview"
                  className="w-full h-[65vh] rounded"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => triggerFileDownload(previewDoc.url, previewDoc.name)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
