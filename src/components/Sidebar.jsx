import React, { useState } from 'react';

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
              <span>{title}</span>
              {isRead && <span className="read-badge">✓</span>}
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
