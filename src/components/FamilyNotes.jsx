import React, { useState } from 'react';

const WHO_COLORS = [
  '#0056b3', '#c0392b', '#27ae60', '#8e44ad',
  '#d35400', '#2980b9', '#16a085', '#2c3e50',
];

function whoColor(readers, who) {
  const idx = readers.indexOf(who);
  return WHO_COLORS[idx % WHO_COLORS.length] || '#0056b3';
}

export default function FamilyNotes({ currentChapterIndex, familyDict, setFamilyDict, readers }) {
  const [text, setText] = useState('');
  const [who, setWho] = useState('');

  const entries = familyDict[currentChapterIndex] || [];

  const addEntry = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry = { text: trimmed, who: who || null, isQuestion: false, id: Date.now() };
    setFamilyDict(prev => ({
      ...prev,
      [currentChapterIndex]: [...(prev[currentChapterIndex] || []), entry],
    }));
    setText('');
  };

  const deleteEntry = (id) => {
    setFamilyDict(prev => ({
      ...prev,
      [currentChapterIndex]: (prev[currentChapterIndex] || []).filter(e => e.id !== id),
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addEntry(); }
  };

  const activeReaders = readers.length > 0 ? readers : ['Nafnlaust'];

  return (
    <div className="family-container">
      <div className="family-header">
        <span>✍️</span>
        <span>Við segjum</span>
        {entries.length > 0 && <span className="qna-count">{entries.length}</span>}
      </div>

      <div className="family-intro">
        Veldu texta í bókinni til að bæta við athugasemd, eða skrifaðu beint hér.
      </div>

      <div className="family-list">
        {entries.length === 0 && (
          <p className="qna-empty">
            Ekkert skráð enn. Veldu texta í bókinni eða skrifaðu hér að neðan!
          </p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="family-entry">
            <div className="family-entry-body">
              {/* Quote if this came from text selection */}
              {entry.quote && (
                <div className="family-entry-quote">„{entry.quote}"</div>
              )}
              <div className="family-entry-main">
                {entry.isQuestion && <span className="family-q-badge">❓</span>}
                {entry.who && (
                  <span
                    className="family-who"
                    style={{ color: whoColor(readers, entry.who) }}
                  >
                    {entry.who}:
                  </span>
                )}
                <span className="family-text">{entry.text}</span>
              </div>
            </div>
            <button
              className="family-delete"
              onClick={() => deleteEntry(entry.id)}
              title="Eyða"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Quick-add input */}
      <div className="family-input-area">
        <div className="family-who-row">
          {activeReaders.map((name) => (
            <button
              key={name}
              className={`family-who-btn ${who === name ? 'active' : ''}`}
              onClick={() => setWho(who === name ? '' : name)}
              style={who === name ? {
                background: whoColor(readers, name),
                borderColor: whoColor(readers, name),
              } : {}}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="family-text-row">
          <input
            type="text"
            className="qna-question-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={who ? `${who} segir…` : 'Skrifið hér…'}
          />
          <button
            className="btn-primary qna-submit-btn"
            onClick={addEntry}
            disabled={!text.trim()}
          >
            Bæta við
          </button>
        </div>
      </div>
    </div>
  );
}
