/**
 * CategoryPicker – birtist þegar notandi opnar Þjóðsögur.
 * Sýnir 10 flokka sem kort; smellt á einn opnar lesarann.
 */
import React from 'react';

export default function CategoryPicker({ categories, onSelectCategory, onBack }) {
  return (
    <div className="cat-picker">
      <header className="cat-picker-header">
        <button className="cat-back-btn" onClick={onBack}>← Aftur á forsíðu</button>
        <h1 className="cat-picker-title">Íslenskar þjóðsögur</h1>
        <p className="cat-picker-sub">Veldu flokk til að lesa</p>
      </header>

      <div className="cat-grid">
        {categories.map(cat => (
          <button
            key={cat.slug}
            className="cat-card"
            onClick={() => onSelectCategory(cat.slug)}
          >
            <div 
              className="cat-card-img" 
              style={{ backgroundImage: `url(/cat-${cat.slug}.png)` }}
              title={cat.label}
            />
            <span className="cat-card-label">{cat.label}</span>
            <span className="cat-card-count">{cat.stories.length} sögur</span>
          </button>
        ))}
      </div>
    </div>
  );
}
