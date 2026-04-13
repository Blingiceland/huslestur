import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BOOKS = [
  {
    id: 'gylfaginning',
    title: 'Gylfaginning',
    subtitle: 'Úr Eddu Snorra Sturlusonar',
    description: 'Sagan af sköpun heimsins, guðunum í Ásgarði, Baldri, Loka, og Ragnarök — frásögn sem hefur lifað í þúsund ár.',
    cover: '/gylfaginning-cover.png',
    chapters: 9,
    available: true,
  },
  {
    id: 'thjodsogar',
    title: 'Íslenskar þjóðsögur',
    subtitle: 'Safnað af Jóni Árnasyni (1862)',
    description: 'Sögur af huldufólki, álfum, draugum og tröllum úr íslensku þjóðlífi — 588 sögur skipt í 10 flokka.',
    cover: '/thjodsogar-cover.png',
    chapters: 588,
    available: true,
    ctaLabel: 'Finna sögu →',
  },
  {
    id: 'voluspa',
    title: 'Völuspá',
    subtitle: 'Eddukvæði',
    description: 'Saga heimsins frá sköpun til ragnaraka eins og völvan sagði Óðni. Eitt frægasta kvæði fornaldar, fært í nútímastafsetningu.',
    cover: '/voluspa-cover.png',
    chapters: 7,
    available: true,
  },
  {
    id: 'havamal',
    title: 'Hávamál',
    subtitle: 'Eddukvæði',
    description: 'Lífsspeki og heilræði Óðins til manna. Fjallar um vináttu, siðferði, gestrisni og rúnatákn, fært í nútímastafsetningu.',
    cover: '/havamal-cover.png',
    chapters: 6,
    available: true,
  },
  {
    id: 'dmyrk',
    title: 'Djákninn á Myrká',
    subtitle: 'Myndskreytt þjóðsaga',
    description: 'Sérstök útgáfa af frægustu draugasögu Íslands, ægisifislega myndskreytt með 3 glænýjum listaverkum.',
    cover: '/dmyrk-2.png',
    chapters: 1,
    available: true,
  },
  {
    id: 'gilitr',
    title: 'Gilitrutt',
    subtitle: 'Myndskreytt þjóðsaga',
    description: 'Frægasta tröllasaga Íslands af letu bændakonunni og stórskorinni tröllskessu sem spann ullina hennar.',
    cover: '/gilitr-2.png',
    chapters: 1,
    available: true,
  },
  {
    id: 'saemi',
    title: 'Sæmundur fróði',
    subtitle: 'Myndskreytt þjóðsaga',
    description: 'Sagan af Sæmundi í Svartaskóla, og hvernig hann plataði kölska og barði selinn í höfuðið með saltaranum.',
    cover: '/saemi-2.png',
    chapters: 1,
    available: true,
  },
];

const AVATAR_COLORS = [
  '#4a7fcb', '#c05252', '#4a9e6e', '#8e5fad',
  '#c07d3a', '#3a8ea8', '#a85f7a', '#6b7fa8',
];

function avatarColor(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function LandingPage({ readers, setReaders, onOpenBook, family }) {
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);
  const { logOut } = useAuth();

  const addReader = () => {
    const name = newName.trim();
    if (!name || readers.includes(name)) return;
    setReaders(prev => [...prev, name]);
    setNewName('');
    inputRef.current?.focus();
  };

  const removeReader = (name) => setReaders(prev => prev.filter(r => r !== name));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addReader();
  };

  return (
    <div className="landing">
      {/* Hero */}
      <header className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-rune">᛭</div>
          <h1 className="landing-title">Lestrarsalurinn</h1>
          <p className="landing-tagline">Lesið saman, spyrjið saman, finnið saman.</p>
        </div>
      </header>

      <main className="landing-main">
        {/* Family banner */}
        {family && (
          <div className="landing-family-banner">
            <span className="landing-family-name">{family.name}</span>
            <div className="landing-family-actions">
              {family.shareCode && (
                <button
                  className="landing-share-btn"
                  onClick={() => {
                    const link = `${window.location.origin}/lesa/${family.shareCode}`;
                    navigator.clipboard.writeText(link).then(() => {
                      alert('Linkur afritadur! Sendu hann til barnanna.');
                    }).catch(() => {
                      prompt('Afritadu linkinn:', link);
                    });
                  }}
                >
                  Deila med bornum
                </button>
              )}
              <button className="landing-logout-btn" onClick={logOut}>Skra ut</button>
            </div>
          </div>
        )}
        {/* Participants */}
        <section className="landing-section">
          <h2 className="landing-section-title">Hverjir eru að lesa í dag?</h2>
          <p className="landing-section-hint">
            Skráið nöfn þátttakenda. Þið getið merkt athugasemdir og spurningar
            við hvert nafn meðan þið lesið.
          </p>

          <div className="landing-readers">
            {readers.map(name => (
              <div key={name} className="landing-reader-chip">
                <span
                  className="landing-reader-avatar"
                  style={{ background: avatarColor(name) }}
                >
                  {name[0].toUpperCase()}
                </span>
                <span>{name}</span>
                <button
                  className="landing-reader-remove"
                  onClick={() => removeReader(name)}
                  title={`Fjarlægja ${name}`}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="landing-reader-add">
              <input
                ref={inputRef}
                type="text"
                className="landing-name-input"
                placeholder="Bæta við nafni…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="landing-add-btn"
                onClick={addReader}
                disabled={!newName.trim() || readers.includes(newName.trim())}
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* Book shelf */}
        <section className="landing-section">
          <h2 className="landing-section-title">Veldu sögu til að lesa</h2>

          <div className="landing-shelf">
            {BOOKS.filter(b => b.subtitle !== 'Myndskreytt þjóðsaga').map(book => (
              <div
                key={book.id}
                className={`landing-book-card ${!book.available ? 'unavailable' : ''}`}
              >
                <div className="landing-book-cover">
                  {book.cover
                    ? <img src={book.cover} alt={book.title} />
                    : <div className="landing-book-cover-placeholder">
                        <span>{book.coverEmoji || book.title[0]}</span>
                      </div>
                  }
                  {!book.available && (
                    <div className="landing-book-soon">Bráðum</div>
                  )}
                </div>

                <div className="landing-book-info">
                  <h3 className="landing-book-title">{book.title}</h3>
                  <p className="landing-book-subtitle">{book.subtitle}</p>
                  <p className="landing-book-desc">{book.description}</p>
                  {book.available && (
                    <div className="landing-book-meta">
                      {book.chapters} kaflar
                    </div>
                  )}
                </div>

                {book.available && (
                  <button
                    className="landing-start-btn"
                    onClick={() => onOpenBook(book.id)}
                  >
                    {book.ctaLabel || 'Byrja að lesa →'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Illustrated stories */}
        <section className="landing-section">
          <h2 className="landing-section-title">Myndskreyttar sögur</h2>

          <div className="landing-shelf">
            {BOOKS.filter(b => b.subtitle === 'Myndskreytt þjóðsaga').map(book => (
              <div
                key={book.id}
                className={`landing-book-card ${!book.available ? 'unavailable' : ''}`}
              >
                <div className="landing-book-cover">
                  {book.cover
                    ? <img src={book.cover} alt={book.title} />
                    : <div className="landing-book-cover-placeholder">
                        <span>{book.coverEmoji || book.title[0]}</span>
                      </div>
                  }
                  {!book.available && (
                    <div className="landing-book-soon">Bráðum</div>
                  )}
                </div>

                <div className="landing-book-info">
                  <h3 className="landing-book-title">{book.title}</h3>
                  <p className="landing-book-subtitle">{book.subtitle}</p>
                  <p className="landing-book-desc">{book.description}</p>
                </div>

                {book.available && (
                  <button
                    className="landing-start-btn"
                    onClick={() => onOpenBook(book.id)}
                  >
                    Byrja að lesa →
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
