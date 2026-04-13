import React, { useState, useEffect, useRef } from 'react';

export default function SelectionPopup({ selection, readers, onSubmit, onClose }) {
  const [text, setText] = useState('');
  const [who, setWho] = useState(readers[0] || null);
  const [isQuestion, setIsQuestion] = useState(false);
  const textRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => textRef.current?.focus(), 50);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({ quote: selection.text, text: text.trim(), who, isQuestion });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  // Position: above selection rect for drag-mode, above click point for click-mode
  const POPUP_W = 310;
  const POPUP_H_EST = selection.clickMode ? 210 : 230;
  const left = Math.max(8, Math.min(
    selection.rect.left + (selection.rect.width || 0) / 2 - POPUP_W / 2,
    window.innerWidth - POPUP_W - 8
  ));
  const top = Math.max(8, selection.rect.top - POPUP_H_EST);

  return (
    <div
      className="sel-popup"
      style={{ left, top, width: POPUP_W }}
    >
      {/* Selected quote preview — only show if there's a quote */}
      {selection.text && (
        <div className="sel-popup-quote">
          „{selection.text.length > 70
            ? selection.text.slice(0, 70) + '…'
            : selection.text}"
        </div>
      )}

      {/* Who selector – only when readers are configured */}
      {readers.length > 0 && (
        <div className="sel-popup-who-row">
          {readers.map(r => (
            <button
              key={r}
              className={`family-who-btn ${who === r ? 'active' : ''}`}
              onClick={() => setWho(who === r ? null : r)}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Comment or Question toggle */}
      <div className="sel-popup-type-row">
        <button
          className={`sel-type-btn ${!isQuestion ? 'active' : ''}`}
          onClick={() => setIsQuestion(false)}
        >
          💬 Athugasemd
        </button>
        <button
          className={`sel-type-btn ${isQuestion ? 'active' : ''}`}
          onClick={() => setIsQuestion(true)}
        >
          ❓ Spurning
        </button>
      </div>

      {/* Text input */}
      <input
        ref={textRef}
        type="text"
        className="sel-popup-input"
        placeholder={isQuestion ? 'Spurning…' : 'Athugasemd…'}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {/* Actions */}
      <div className="sel-popup-actions">
        <button className="btn-primary" onClick={handleSubmit} disabled={!text.trim()}>
          Vista
        </button>
        <button onClick={onClose}>Hætta við</button>
      </div>
    </div>
  );
}
