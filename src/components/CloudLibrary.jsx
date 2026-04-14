import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const CATEGORY_COVERS = {
  'HC Andersen':      '/hc-andersen-cover.png',
  'Íslensk ævintýri': '/islensk-aevintiri-cover.png',
  'Íslendingasögur':  '/islendingasogur-cover.png',
};

const CATEGORY_ACCENTS = {
  'HC Andersen':      '#a78bfa',
  'Íslensk ævintýri': '#34d399',
  'Íslendingasögur':  '#fbbf24',
};

// Laga titla sem eru í hástöfum (t.d. "BANDAMANNASAGA" → "Bandamannasaga")
function fixTitle(title) {
  if (!title) return title;
  if (title === title.toUpperCase() && title.length > 4) {
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  }
  return title;
}

export default function CloudLibrary({ onSelectStory, onBack, initialCategory = null }) {
  const [stories, setStories]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const q = query(collection(db, 'library'), orderBy('title'));
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(doc => results.push(doc.data()));
        setStories(results);
      } catch (e) {
        console.error('Load library error:', e);
      }
      setLoading(false);
    }
    loadLibrary();
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter(s =>
      (selectedCategory ? s.category === selectedCategory : true) &&
      (fixTitle(s.title).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stories, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(stories.map(s => s.category || 'Annað'));
    return Array.from(cats).sort();
  }, [stories]);

  const coverImg  = selectedCategory ? CATEGORY_COVERS[selectedCategory]  : null;
  const accent    = selectedCategory ? (CATEGORY_ACCENTS[selectedCategory] || '#a78bfa') : '#a78bfa';

  return (
    <div className="cl-root">

      {/* ── HERO BANNER ── */}
      <div className="cl-hero" style={{ '--cl-accent': accent }}>
        {coverImg && (
          <img src={coverImg} alt={selectedCategory} className="cl-hero-img" />
        )}
        <div className="cl-hero-overlay">
          <button className="cl-back-btn" onClick={() => {
            if (searchTerm) { setSearchTerm(''); return; }
            if (selectedCategory && !initialCategory) { setSelectedCategory(null); return; }
            onBack();
          }}>← Til baka</button>

          <div className="cl-hero-text">
            <p className="cl-hero-eyebrow">Bókasafnið</p>
            <h1 className="cl-hero-title">
              {selectedCategory || 'Veldu flokk'}
            </h1>
            {!loading && (
              <p className="cl-hero-count" style={{ color: accent }}>
                {filteredStories.length} {selectedCategory ? 'sögur' : 'flokkar'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      {(selectedCategory || searchTerm) && !loading && (
        <div className="cl-search-wrap">
          <input
            type="text"
            className="cl-search-input"
            placeholder={`Leita í ${selectedCategory || 'öllu safninu'}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus={!!selectedCategory}
          />
        </div>
      )}

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="app-loading">
          <div className="app-loading-rune">&#x16ED;</div>
        </div>
      ) : !selectedCategory && !searchTerm ? (
        /* ── Category grid — only featured (with cover) ── */
        <div className="cl-cat-grid">
          {categories.filter(cat => CATEGORY_COVERS[cat]).map(cat => {
            const cover = CATEGORY_COVERS[cat];
            const acc   = CATEGORY_ACCENTS[cat] || '#a78bfa';
            const count = stories.filter(s => s.category === cat).length;
            return (
              <button
                key={cat}
                className="cl-cat-imgcard"
                style={{ '--cl-accent': acc }}
                onClick={() => setSelectedCategory(cat)}
              >
                <img src={cover} alt={cat} className="cl-cat-imgcard-img" />
                <div className="cl-cat-imgcard-overlay">
                  <span className="cl-cat-imgcard-title">{cat}</span>
                  <span className="cl-cat-imgcard-count" style={{ color: acc }}>{count} sögur →</span>
                </div>
              </button>
            );
          })}
        </div>

      ) : (
        /* ── Story grid ── */
        <div className="cl-story-grid">
          {filteredStories.map(story => {
            const pgCount = story.chapters?.[0]?.paragraphs?.length || 0;
            const title   = fixTitle(story.title);
            // Approximate reading time (avg 3 paragraphs per minute for kids)
            const mins    = Math.max(1, Math.round(pgCount / 3));
            return (
              <button
                key={story.id}
                className="cl-story-card"
                style={{ '--cl-accent': accent }}
                onClick={() => onSelectStory(story)}
              >
                <div className="cl-story-icon">📖</div>
                <h2 className="cl-story-title">{title}</h2>
                <div className="cl-story-meta">
                  <span>{pgCount} kaflar</span>
                  <span className="cl-story-dot">·</span>
                  <span>~{mins} mín</span>
                </div>
              </button>
            );
          })}
          {filteredStories.length === 0 && (
            <p className="cl-empty">Engar sögur fundust.</p>
          )}
        </div>
      )}
    </div>
  );
}
