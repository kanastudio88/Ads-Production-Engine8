import React, { useState } from 'react';
import { SavedLink } from '../../types';

interface SavedLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedLinks: SavedLink[];
  onAddLink: (link: Omit<SavedLink, 'id' | 'addedAt'>) => void;
  onDeleteLink: (linkId: string) => void;
  onTogglePin?: (link: SavedLink) => void;
  currentUserName: string;
}

export const SavedLinksModal: React.FC<SavedLinksModalProps> = ({
  isOpen,
  onClose,
  savedLinks,
  onAddLink,
  onDeleteLink,
  onTogglePin,
  currentUserName
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<SavedLink['category']>('Traffic Sheet');
  const [description, setDescription] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'ALL',
    'Traffic Sheet',
    'Google Drive',
    'Court / Gazette',
    'Editorial Reference',
    'Internal Tool'
  ];

  const filteredLinks = savedLinks.filter((link) => {
    const matchesCat = activeCategory === 'ALL' || link.category === activeCategory;
    const matchesQuery =
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleCopy = (id: string, linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let validUrl = url.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    onAddLink({
      title: title.trim(),
      url: validUrl,
      category,
      description: description.trim(),
      addedBy: currentUserName || 'Operator',
      isPinned
    });

    setTitle('');
    setUrl('');
    setDescription('');
    setIsPinned(false);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-lg">link</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Pautan Tersimpan (Firebase Cloud)</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                  🔥 {savedLinks.length} Pautan Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Semua pautan penting (Google Sheets, Portal Gazette, Drive) disimpan dan diselaraskan secara langsung dalam Firebase Firestore.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pautan tajuk atau URL..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">
                {showAddForm ? 'close' : 'add'}
              </span>
              <span>{showAddForm ? 'Tutup Borang' : 'Tambah Pautan Baru'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Pautan' : cat}
            </button>
          ))}
        </div>

        {/* Add Link Form Collapsible */}
        {showAddForm && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-4 bg-blue-50/70 border-b border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150"
          >
            <div className="md:col-span-2">
              <span className="text-xs font-bold text-blue-900 block mb-1">
                Tambah Pautan Baru ke Firebase
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                Tajuk Pautan *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth: NSTP Master Traffic Sheet 2026"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SavedLink['category'])}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Traffic Sheet">Traffic Sheet (Google Sheets)</option>
                <option value="Google Drive">Google Drive / Cloud Folder</option>
                <option value="Court / Gazette">Court / Gazette / e-Kehakiman</option>
                <option value="Editorial Reference">Editorial Reference</option>
                <option value="Internal Tool">Internal Tool</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                URL Pautan (https://...) *
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                Penerangan Ringkas (Pilihan)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="cth: Fail Google Sheets utama untuk semakan iklan notis"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Pin pautan ini di bahagian atas</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">save</span>
                  <span>Simpan ke Firebase</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Links List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredLinks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">
                link_off
              </span>
              <p className="text-xs font-medium">Tiada pautan ditemui untuk carian atau kategori ini.</p>
            </div>
          ) : (
            filteredLinks.map((link) => (
              <div
                key={link.id}
                className={`p-3 rounded-lg border transition-all ${
                  link.isPinned
                    ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                } flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                      link.category === 'Traffic Sheet'
                        ? 'bg-emerald-100 text-emerald-700'
                        : link.category === 'Google Drive'
                        ? 'bg-blue-100 text-blue-700'
                        : link.category === 'Court / Gazette'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {link.category === 'Traffic Sheet'
                        ? 'table_view'
                        : link.category === 'Google Drive'
                        ? 'folder_open'
                        : link.category === 'Court / Gazette'
                        ? 'gavel'
                        : 'link'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{link.title}</h4>
                      {link.isPinned && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                          PINNED
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                        {link.category}
                      </span>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-blue-600 hover:underline block truncate mt-0.5"
                    >
                      {link.url}
                    </a>

                    {link.description && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                        {link.description}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Ditambah oleh: {link.addedBy}</span>
                      <span>·</span>
                      <span>{link.addedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  {onTogglePin && (
                    <button
                      onClick={() => onTogglePin(link)}
                      title={link.isPinned ? 'Nyah-pin' : 'Pin pautan'}
                      className={`p-1.5 rounded text-xs cursor-pointer ${
                        link.isPinned
                          ? 'text-amber-600 hover:bg-amber-100'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">push_pin</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(link.id, link.url)}
                    title="Salin URL"
                    className="p-1.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-base">
                      {copiedId === link.id ? 'check' : 'content_copy'}
                    </span>
                    <span className="text-[10px] font-mono">
                      {copiedId === link.id ? 'Disalin!' : 'Salin'}
                    </span>
                  </button>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <span>Buka</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>

                  <button
                    onClick={() => {
                      if (confirm(`Padam pautan "${link.title}" dari Firebase?`)) {
                        onDeleteLink(link.id);
                      }
                    }}
                    title="Padam pautan"
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firestore: /saved_links & /app_settings</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
