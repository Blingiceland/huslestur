import React, { useState, useEffect, useRef } from 'react';
import QnA from './QnA';

/**
 * NotesPanel – tveir flipar:
 *   1. 💬 Athugasemdir  – allar færslur (úr Samlestrinum og spurningum)
 *   2. 📝 Glósur        – einkaglósur
 */
export default function NotesPanel({
  currentChapterIndex,
  notesDict,
  setNotesDict,
  qnaDict,
  setQnaDict,
  familyDict,
  setFamilyDict,
  readers,
  isOpen,
}) {
  const [activeTab, setActiveTab] = useState('annotations');
  const [localNote, setLocalNote] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    setLocalNote(notesDict[currentChapterIndex] || '');
    setSaveStatus('');
  }, [currentChapterIndex, notesDict]);

  const annotationCount = (familyDict[currentChapterIndex] || []).length;
  const questionCount   = (qnaDict[currentChapterIndex] || []).length;
  const totalCount      = annotationCount + questionCount;

  const handleSaveNote = () => {
    setNotesDict(prev => ({ ...prev, [currentChapterIndex]: localNote }));
    setSaveStatus('Vistað!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const deleteAnnotation = (id) => {
    setFamilyDict(prev => ({
      ...prev,
      [currentChapterIndex]: (prev[currentChapterIndex] || []).filter(e => e.id !== id),
    }));
  };

  const annotations = familyDict[currentChapterIndex] || [];

  const WHO_COLORS = ['#4a7fcb','#c05252','#4a9e6e','#8e5fad','#c07d3a','#3a8ea8'];
  const whoColor = (name) => {
    if (!name) return 'var(--accent-color)';
    let s = 0; for (const c of name) s += c.charCodeAt(0);
    return WHO_COLORS[s % WHO_COLORS.length];
  };

  return (
    <div className={`notes-panel ${isOpen ? 'open' : 'closed'}`}>
      {/* Flipar */}
      <div className="panel-tabs">
        <button
          className={`panel-tab ${activeTab === 'annotations' ? 'active' : ''}`}
          onClick={() => setActiveTab('annotations')}
        >
          💬 Athugasemdir
          {totalCount > 0 && <span className="qna-count">{totalCount}</span>}
        </button>
        <button
          className={`panel-tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          📝 Glósur
        </button>
      </div>

      {/* Athugasemdir: Samlestur og spurningar saman */}
      {activeTab === 'annotations' && (
        <div className="annotations-panel">
          {/* Samlestursfærslur */}
          {annotations.length > 0 && (
            <div className="annotation-section">
              <div className="annotation-section-label">Frá samlestrinum</div>
              {annotations.map(entry => (
                <div key={entry.id} className="annotation-entry">
                  {entry.quote && (
                    <div className="family-entry-quote">„{entry.quote}"</div>
                  )}
                  <div className="family-entry-main">
                    {entry.isQuestion && <span className="family-q-badge">❓</span>}
                    {entry.who && (
                      <span className="family-who" style={{ color: whoColor(entry.who) }}>
                        {entry.who}:
                      </span>
                    )}
                    <span className="family-text">{entry.text}</span>
                  </div>
                  <button
                    className="family-delete"
                    onClick={() => deleteAnnotation(entry.id)}
                    title="Eyða"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Spurningar */}
          <QnA
            currentChapterIndex={currentChapterIndex}
            qnaDict={qnaDict}
            setQnaDict={setQnaDict}
            compact={annotations.length > 0}
          />

          {annotations.length === 0 && questionCount === 0 && (
            <p className="qna-empty" style={{ padding: '16px 20px' }}>
              Engar athugasemdir enn. Notaðu ✏️ Samlestur til að klikka á texta,
              eða settu inn spurningu hér að neðan.
            </p>
          )}
        </div>
      )}

      {/* Einkaglósur */}
      {activeTab === 'notes' && (
        <div className="notes-content">
          <div className="note-section">
            <h3>Mínar glósur</h3>
            <textarea
              placeholder="Skrifaðu niður pælingar, tengingar eða þætti til að ræða síðar…"
              value={localNote}
              onChange={e => setLocalNote(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-primary" onClick={handleSaveNote}>Vista glósur</button>
            {saveStatus && (
              <span style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>{saveStatus}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
