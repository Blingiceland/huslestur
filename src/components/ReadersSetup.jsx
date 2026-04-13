import React, { useState, useRef, useEffect } from 'react';

/**
 * ReadersSetup – sprettigluggi til að stjórna þátttakendum.
 * Opnast úr toppstiku. Nöfn eru geymd í localStorage.
 */
export default function ReadersSetup({ readers, setReaders, onClose }) {
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addReader = () => {
    const name = newName.trim();
    if (!name || readers.includes(name)) return;
    setReaders(prev => [...prev, name]);
    setNewName('');
  };

  const removeReader = (name) => {
    setReaders(prev => prev.filter(r => r !== name));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addReader();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="readers-overlay" onClick={onClose}>
      <div
        className="readers-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="readers-header">
          <span>👥 Hverjir eru að lesa?</span>
          <button className="readers-close" onClick={onClose}>✕</button>
        </div>

        <p className="readers-hint">
          Bætið við nöfnum þeirra sem taka þátt. Þau birtast þegar
          þið merkið athugasemdir og spurningar.
        </p>

        <ul className="readers-list">
          {readers.length === 0 && (
            <li className="readers-empty">Enginn skráður enn.</li>
          )}
          {readers.map(r => (
            <li key={r} className="reader-item">
              <span className="reader-avatar">{r[0]?.toUpperCase()}</span>
              <span className="reader-name">{r}</span>
              <button
                className="reader-remove"
                onClick={() => removeReader(r)}
                title={`Fjarlægja ${r}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="readers-add-row">
          <input
            ref={inputRef}
            type="text"
            className="qna-question-input"
            placeholder="Nafn lesanda…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn-primary"
            onClick={addReader}
            disabled={!newName.trim() || readers.includes(newName.trim())}
          >
            Bæta við
          </button>
        </div>
      </div>
    </div>
  );
}
