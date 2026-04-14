import React, { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';

export default function Sidebar({
  chapters,
  currentChapterIndex,
  setCurrentChapterIndex,
  readStatus,
  isOpen,
  toggleSidebar,
  activeBook,
  sidebarTitle,
}) {
  const [search, setSearch] = useState('');
  const { family, getShareLink, isChildMode } = useFamily();
  const [copiedLink, setCopiedLink] = useState(false);

  const filtered = chapters
    .map((ch, idx) => ({ ...ch, idx }))
    .filter(ch =>
      search.trim() === '' ||
      ch.title.toLowerCase().includes(search.toLowerCase())
    );

  const readCount = Object.values(readStatus).filter(Boolean).length;

  const isFolkTales = activeBook === 'thjodsogar';
  const isVoluspa = activeBook === 'voluspa';
  const isHavamal = activeBook === 'havamal';
  const isEdda = isVoluspa || isHavamal;
  
  const title = sidebarTitle || (isFolkTales ? 'Íslenskar þjóðsögur' : isVoluspa ? 'Völuspá' : isHavamal ? 'Hávamál' : 'Gylfaginning');
  const unit = isFolkTales ? 'sögur' : isEdda ? 'hlutar' : 'kaflar';
  const unitRead = isFolkTales ? 'sögur lesnar' : isEdda ? 'hlutar lesnir' : 'kaflar lesnir';

  const handleCopyLink = (e, book, idx) => {
    e.stopPropagation();
    const url = getShareLink(book, idx);
    if (url) {
       navigator.clipboard.writeText(url);
       setCopiedLink(true);
       setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div>{title}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.6, marginTop: 2 }}>
          {readCount}/{chapters.length} {unitRead}
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder={`Leita í ${isFolkTales ? 'sögum' : 'köflum'}…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <ul className="chapter-list">
        {filtered.map(({ title, idx }) => {
          const isActive = idx === currentChapterIndex;
          const isRead = readStatus[idx];
          return (
            <li
              key={idx}
              className={`chapter-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                setCurrentChapterIndex(idx);
                if (window.innerWidth <= 768) toggleSidebar();
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{title} {isRead && '✅'}</span>
                {isActive && family && !isChildMode && (
                  <button 
                    onClick={(e) => handleCopyLink(e, activeBook, idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 5px' }}
                    title="Afrita tengil á þennan kafla handa barni"
                  >
                    {copiedLink ? '✓ Afritað' : '🔗 Deila'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li style={{ padding: '16px 20px', opacity: 0.5, fontSize: '0.9rem' }}>
            Engar {unit} fundust
          </li>
        )}
      </ul>
    </div>
  );
}
