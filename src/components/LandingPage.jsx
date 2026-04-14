import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Grunnbækur með fallegum litum
const FEATURED_BOOKS = [
  {
    id: 'gylfaginning',
    title: 'Gylfaginning',
    subtitle: 'Edda Snorra Sturlusonar',
    description: 'Sagan af sköpun heimsins, guðunum og Ragnarök.',
    cover: '/gylfaginning-cover.png',
    color: '#2d1b69',
    accent: '#a78bfa',
    kaflar: '9 kaflar',
  },
  {
    id: 'voluspa',
    title: 'Völuspá',
    subtitle: 'Eddukvæði',
    description: 'Frá sköpun til ragnaraka — eitt frægasta kvæði fornaldar.',
    cover: '/voluspa-cover.png',
    color: '#1a3a2a',
    accent: '#34d399',
    kaflar: '7 hlutar',
  },
  {
    id: 'havamal',
    title: 'Hávamál',
    subtitle: 'Eddukvæði',
    description: 'Lífsspeki og heilræði Óðins til manna.',
    cover: '/havamal-cover.png',
    color: '#3b1a10',
    accent: '#fb923c',
    kaflar: '6 hlutar',
  },
  {
    id: 'thjodsogar',
    title: 'Þjóðsögur',
    subtitle: 'Jón Árnason 1862',
    description: 'Huldufólk, álfar, draugar og tröll — 588 sögur.',
    cover: '/thjodsogar-cover.png',
    color: '#1e1b4b',
    accent: '#818cf8',
    kaflar: '588 sögur',
    ctaLabel: 'Finna sögu',
  },
];

const ILLUSTRATED = [
  { id: 'dmyrk', title: 'Djákninn á Myrká', cover: '/dmyrk-2.png', color: '#1a1a2e', accent: '#e879f9' },
  { id: 'gilitr', title: 'Gilitrutt', cover: '/gilitr-2.png', color: '#1a2e1a', accent: '#4ade80' },
  { id: 'saemi', title: 'Sæmundur fróði', cover: '/saemi-2.png', color: '#2e1a1a', accent: '#f87171' },
];

const CATEGORY_IMAGES = {
  'HC Andersen': '/hc-andersen-cover.png',
  'Íslensk ævintýri': '/islensk-aevintiri-cover.png',
  'Íslendingasögur': '/islendingasogur-cover.png',
};

// Flokkur glósur/litir
const CAT_THEMES = [
  { color: '#1e1b4b', accent: '#818cf8', emoji: '📜' },
  { color: '#1a3a2a', accent: '#34d399', emoji: '🌿' },
  { color: '#3b1a10', accent: '#fb923c', emoji: '🔥' },
  { color: '#1a1a2e', accent: '#e879f9', emoji: '✨' },
  { color: '#0c1a2e', accent: '#38bdf8', emoji: '🌊' },
  { color: '#2e2a10', accent: '#facc15', emoji: '⭐' },
  { color: '#1a2e2a', accent: '#2dd4bf', emoji: '🏔️' },
  { color: '#2e1a2e', accent: '#c084fc', emoji: '🌙' },
];

const AVATAR_COLORS = [
  '#4a7fcb','#c05252','#4a9e6e','#8e5fad',
  '#c07d3a','#3a8ea8','#a85f7a','#6b7fa8',
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
  const [cloudCats, setCloudCats] = useState([]);
  const [copied, setCopied] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'library')).then(snap => {
      const cats = {};
      snap.forEach(doc => {
        const cat = doc.data().category || 'Annað';
        cats[cat] = (cats[cat] || 0) + 1;
      });
      const sorted = Object.keys(cats).sort().map((name, i) => ({
        name,
        count: cats[name],
        theme: CAT_THEMES[i % CAT_THEMES.length],
      }));
      setCloudCats(sorted);
    });
  }, []);

  const addReader = () => {
    const name = newName.trim();
    if (!name || readers.includes(name)) return;
    setReaders(prev => [...prev, name]);
    setNewName('');
    inputRef.current?.focus();
  };
  const removeReader = (name) => setReaders(prev => prev.filter(r => r !== name));

  const handleShare = () => {
    const link = `${window.location.origin}/lesa/${family.shareCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => prompt('Afritaðu linkinn:', link));
  };

  const featuredCats = cloudCats.filter(c => CATEGORY_IMAGES[c.name]);
  const otherCats = cloudCats.filter(c => !CATEGORY_IMAGES[c.name]);

  return (
    <div className="lp">
      {/* ── Top bar ── */}
      <header className="lp-topbar">
        <div className="lp-logo">
          <span className="lp-rune">᛭</span>
          <span className="lp-logo-text">Lestrarsalurinn</span>
        </div>
        <div className="lp-topbar-right">
          {family && (
            <>
              <span className="lp-family-name">{family.name}</span>
              {family.shareCode && (
                <button className="lp-share-btn" onClick={handleShare}>
                  {copied ? '✓ Afritað!' : '🔗 Deila með börnum'}
                </button>
              )}
              <button className="lp-logout-btn" onClick={logOut}>Útskrá</button>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <p className="lp-hero-eyebrow">Íslenskt bókasafn fyrir börn</p>
          <h1 className="lp-hero-title">Lesum saman.</h1>
          <p className="lp-hero-sub">Gylfaginning, Eddukvæði, Þjóðsögur og hundruð íslenzkra ævintýra — allt á einum stað.</p>

          {/* Readers */}
          <div className="lp-readers-bar">
            {readers.map(name => (
              <button
                key={name}
                className="lp-reader-chip"
                style={{ background: avatarColor(name) }}
                onClick={() => removeReader(name)}
                title={`Fjarlægja ${name}`}
              >
                {name[0].toUpperCase()} {name}
              </button>
            ))}
            <button className="lp-reader-add-toggle" onClick={() => setReaderOpen(o => !o)}>
              {readerOpen ? '×' : '+ Bæta við lesanda'}
            </button>
          </div>
          {readerOpen && (
            <div className="lp-reader-input-row">
              <input
                ref={inputRef}
                className="lp-reader-input"
                placeholder="Nafn barns..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addReader()}
                autoFocus
              />
              <button className="lp-reader-confirm" onClick={addReader}>Bæta við</button>
            </div>
          )}
        </div>
        <div className="lp-hero-deco" aria-hidden>
          <div className="lp-hero-rune-bg">ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ</div>
        </div>
      </section>

      <div className="lp-content">

        {/* ══ BÓKASAFNIÐ — eitt sameinað safn ══ */}
        <section className="lp-section">
          <h2 className="lp-section-title">Bókasafnið</h2>

          {/* Horizontal scroll: Gylfaginning, Völuspá, Hávamál, Þjóðsögur */}
          <div className="lp-books-row">
            {FEATURED_BOOKS.map(book => (
              <button
                key={book.id}
                className="lp-fcard"
                style={{ '--card-bg': book.color, '--card-accent': book.accent }}
                onClick={() => onOpenBook(book.id)}
              >
                <div className="lp-fcard-cover">
                  {book.cover
                    ? <img src={book.cover} alt={book.title} />
                    : <span className="lp-fcard-emoji">📖</span>
                  }
                </div>
                <div className="lp-fcard-body">
                  <div className="lp-fcard-tag">{book.subtitle}</div>
                  <h3 className="lp-fcard-title">{book.title}</h3>
                  <p className="lp-fcard-desc">{book.description}</p>
                  <div className="lp-fcard-meta">{book.kaflar}</div>
                </div>
                <div className="lp-fcard-cta">{book.ctaLabel || 'Byrja →'}</div>
              </button>
            ))}
          </div>

          {/* HC Andersen / Íslendingasögur / Íslenskar ævintýri */}
          {featuredCats.length > 0 && (
            <div className="lp-cloud-grid" style={{ marginTop: '20px' }}>
              {featuredCats.map(({ name, count, theme }) => (
                <button
                  key={name}
                  className="lp-cloud-card"
                  style={{ '--card-accent': theme.accent }}
                  onClick={() => onOpenBook('snerpa', null, name)}
                >
                  <img src={CATEGORY_IMAGES[name]} alt={name} className="lp-cloud-card-img" />
                  <div className="lp-cloud-card-overlay">
                    <span className="lp-cloud-card-subtitle">Bókasafn</span>
                    <span className="lp-cloud-card-title">{name}</span>
                    <span className="lp-cloud-card-count" style={{ color: theme.accent }}>{count} sögur →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Myndskreyttar sögur — neðst ── */}
        <section className="lp-section">
          <h2 className="lp-section-title">Myndskreyttar sögur</h2>
          <div className="lp-illus-grid">
            {ILLUSTRATED.map(book => (
              <button
                key={book.id}
                className="lp-icard"
                style={{ '--card-bg': book.color, '--card-accent': book.accent }}
                onClick={() => onOpenBook(book.id)}
              >
                <img src={book.cover} alt={book.title} className="lp-icard-img" />
                <div className="lp-icard-overlay">
                  <span className="lp-icard-title">{book.title}</span>
                  <span className="lp-icard-cta">Lesa →</span>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>



      <footer className="lp-footer">
        Lestrarsalurinn · Byggt á Snerpu-gagnagrunni · Íslenska bókmenntaarfleifð
      </footer>
    </div>
  );
}
