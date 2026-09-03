'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { fetchDocuments, uploadDocumentAttachment } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { FolderOpen, FileText, CheckCircle2, Upload, Search, Clock, FileCheck2 } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function DocumentsPage() {
  const [role, setRole] = useState<UserRole>('REGISTRAR');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDocumentAttachment(file, 'general-dossier');
      await loadDocs();
    } catch (err: any) {
      alert(`Document upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      doc.name.toLowerCase().includes(q) ||
      (doc.category && doc.category.toLowerCase().includes(q)) ||
      (doc.regNumber && doc.regNumber.toLowerCase().includes(q))
    );
  });

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title="Document Locker & Repository"
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Real-Time Document Locker & Repository
              </h2>
              <p className="text-xs text-slate-500">
                Live candidate verification dossiers, captured document images & uploaded attachments ({documents.length} Records)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search document, student..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0">
              <Upload className="h-4 w-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
            </label>
          </div>
        </div>

        {/* Real-time Document Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
            <FolderOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-800">No Documents Found</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload candidate identity proofs or registration documents using the button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-start justify-between hover:border-blue-300 transition-all group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {doc.name}
                    </h3>
                    {doc.regNumber && (
                      <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">
                        {doc.regNumber}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Category: <span className="font-semibold text-slate-700">{doc.category || 'General Dossier'}</span>
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block pt-1">
                      Size: {doc.size || '1.2 MB'} | Date: {doc.updated}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    doc.status === 'Verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {doc.status || 'Verified'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
