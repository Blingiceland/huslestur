import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function CloudLibrary({ onSelectStory, onBack }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  // Setjum sögurnar í flokka eða síum eftir leitarorði
  const filteredStories = useMemo(() => {
    return stories.filter(s => 
      (selectedCategory ? s.category === selectedCategory : true) &&
      (s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stories, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(stories.map(s => s.category || 'Annað'));
    return Array.from(cats).sort();
  }, [stories]);

  // Ef byrjað er að leita, þá sýnum við bara allar leitarniðurstöður (kannski af öllum flokkum ef enginn flokkur var valinn)
  // Annars ef flokkur er EKKI valinn, sýnum við flokkavalmynd
  if (!loading && !selectedCategory && !searchTerm && categories.length > 0) {
    return (
      <div className="category-picker">
        <header className="picker-header">
          <button className="picker-back-btn" onClick={onBack}>← Til baka</button>
          <h1 className="picker-title">📚 Bókasafnið</h1>
          <p className="picker-subtitle">Veldu flokk eða leitaðu að sögu</p>
        </header>
        
        <div className="library-search-container">
          <input 
            type="text" 
            placeholder="Leita að sögu..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="library-search-input"
          />
        </div>

        <div className="picker-grid">
          {categories.map(cat => (
            <button
              key={cat}
              className="picker-card"
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="picker-card-emoji">📁</div>
              <h2 className="picker-card-title">{cat}</h2>
              <div className="picker-card-desc">
                {stories.filter(s => s.category === cat).length} sögur
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Ef flokkur ER valinn eða verið er að leita
  return (
    <div className="category-picker">
      <header className="picker-header">
        <button 
          className="picker-back-btn" 
          onClick={() => {
            if (searchTerm) setSearchTerm('');
            else if (selectedCategory) setSelectedCategory(null);
            else onBack();
          }}
        >
          ← Til baka
        </button>
        <h1 className="picker-title">
          {selectedCategory ? `📁 ${selectedCategory}` : '📚 Bókasafnið'}
        </h1>
        <p className="picker-subtitle">
          {loading ? 'Hleður inn sögum úr skýinu...' : `${filteredStories.length} niðurstöður`}
        </p>
      </header>

      {!loading && (
        <div className="library-search-container">
          <input 
            type="text" 
            placeholder={`Leita í ${selectedCategory || 'öllu safninu'}...`} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="library-search-input"
          />
        </div>
      )}

      {loading ? (
         <div className="app-loading">
            <div className="app-loading-rune">&#x16ED;</div>
         </div>
      ) : (
        <div className="picker-grid library-grid">
          {filteredStories.map(story => (
            <button
              key={story.id}
              className="picker-card library-card"
              onClick={() => onSelectStory(story)}
            >
              <div className="picker-card-emoji">📖</div>
              <h2 className="picker-card-title">{story.title}</h2>
              <div className="library-card-meta">
                <span>{story.chapters[0].paragraphs.length} mgr.</span>
              </div>
            </button>
          ))}
          {filteredStories.length === 0 && (
            <p style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', opacity: 0.5 }}>
              Engar sögur fundust við þessa leit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
