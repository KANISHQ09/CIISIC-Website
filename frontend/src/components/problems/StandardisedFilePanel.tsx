import React, { useRef, useState } from 'react';
import { CheckCircle, ExternalLink, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getOriginalFileName } from '../../lib/file';
import { ProblemStatement } from '../../types';

const MAX_SIZE = 10 * 1024 * 1024;

/**
 * The CII-standardised version of an industry's raw file.
 * CII admins manage it, the owning company can open it, and other viewers are told
 * that the document above is the standardised version.
 */
export const StandardisedFilePanel: React.FC<{
  submission: ProblemStatement;
  isAdmin: boolean;
  onUpdated: (updated: ProblemStatement) => void;
}> = ({ submission, isAdmin, onUpdated }) => {
  const { setStandardisedFile, showToast } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const file = submission.standardisedFile;

  if (!isAdmin && !file) return null;

  if (!isAdmin && !submission.ownedByRequester) {
    return (
      <p className="flex items-center gap-2 text-xs font-medium text-emerald-800">
        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        This document has been standardised by CII.
      </p>
    );
  }

  const save = async (next: File | null) => {
    setIsSaving(true);
    try {
      onUpdated(await setStandardisedFile(submission.id, next));
      setConfirmRemove(false);
      showToast(next ? 'Standardised file saved.' : 'Standardised file removed.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not update the standardised file.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      showToast('Please choose a PDF file.', 'error');
      return;
    }
    if (selected.size > MAX_SIZE) {
      showToast('The file must be 10MB or smaller.', 'error');
      return;
    }
    save(selected);
  };

  return (
    <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[#063028]">Standardised document</h3>
        <p className="text-xs text-stone-600 mt-0.5">
          {file
            ? 'Institutions and visitors see this version instead of the original file.'
            : 'Upload a standardised PDF of the industry\'s file. Until then, viewers see the original.'}
        </p>
      </div>

      {file && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-semibold text-[#063028] hover:underline min-w-0"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{getOriginalFileName(file.url)}</span>
        </a>
      )}

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} className="hidden" aria-label="Choose standardised PDF" />
          {confirmRemove ? (
            <>
              <span className="text-xs font-medium text-stone-600">Show the original file again?</span>
              <button
                type="button"
                onClick={() => save(null)}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                Yes, remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 border border-stone-300 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#063028] hover:bg-[#04201a] disabled:opacity-50 cursor-pointer"
              >
                {file ? <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> : <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />}
                {isSaving ? 'Saving...' : file ? 'Replace PDF' : 'Upload PDF'}
              </button>
              {file && (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-700 border border-red-200 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
