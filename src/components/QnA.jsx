import React, { useState, useEffect, useRef } from 'react';

/**
 * QnA – Spurningagluggi
 * Börnin geta sent inn spurningar meðan þæð lesa.
 * Foreldrar geta svarð hverri spurningu.
 * Allt geymt eftir köflum í localStorage.
 */
export default function QnA({ currentChapterIndex, qnaDict, setQnaDict }) {
  const [questionInput, setQuestionInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // index in current chapter's Q list
  const listRef = useRef(null);

  const currentQs = qnaDict[currentChapterIndex] || [];

  // Reset inputs when chapter changes
  useEffect(() => {
    setQuestionInput('');
    setReplyInput('');
    setReplyingTo(null);
  }, [currentChapterIndex]);

  // Scroll to bottom when new questions arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [currentQs.length]);

  const submitQuestion = () => {
    const text = questionInput.trim();
    if (!text) return;
    const newQ = { question: text, answer: '', timestamp: Date.now() };
    setQnaDict(prev => ({
      ...prev,
      [currentChapterIndex]: [...(prev[currentChapterIndex] || []), newQ],
    }));
    setQuestionInput('');
  };

  const submitReply = (idx) => {
    const text = replyInput.trim();
    if (!text) return;
    setQnaDict(prev => {
      const updated = [...(prev[currentChapterIndex] || [])];
      updated[idx] = { ...updated[idx], answer: text };
      return { ...prev, [currentChapterIndex]: updated };
    });
    setReplyInput('');
    setReplyingTo(null);
  };

  const deleteQuestion = (idx) => {
    setQnaDict(prev => {
      const updated = [...(prev[currentChapterIndex] || [])];
      updated.splice(idx, 1);
      return { ...prev, [currentChapterIndex]: updated };
    });
    if (replyingTo === idx) setReplyingTo(null);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="qna-container">
      <div className="qna-header">
        <span className="qna-icon">💬</span>
        <span>Spurningar</span>
        {currentQs.length > 0 && (
          <span className="qna-count">{currentQs.length}</span>
        )}
      </div>

      {/* Spurningalisti */}
      <div className="qna-list" ref={listRef}>
        {currentQs.length === 0 && (
          <p className="qna-empty">Engar spurningar enn. Strákarnir geta skrifað spurningu hér að neðan!</p>
        )}
        {currentQs.map((item, idx) => (
          <div key={idx} className="qna-item">
            <div className="qna-question-bubble">
              <div className="qna-bubble-label">Spurning</div>
              <div className="qna-bubble-text">{item.question}</div>
              <div className="qna-bubble-actions">
                <button
                  className="qna-action-btn"
                  onClick={() => {
                    setReplyingTo(replyingTo === idx ? null : idx);
                    setReplyInput(item.answer || '');
                  }}
                  title="Svara"
                >
                  {item.answer ? '✏️ Breyta svari' : '↩ Svara'}
                </button>
                <button
                  className="qna-action-btn qna-delete-btn"
                  onClick={() => deleteQuestion(idx)}
                  title="Eyða"
                >
                  ✕
                </button>
              </div>
            </div>

            {item.answer && replyingTo !== idx && (
              <div className="qna-answer-bubble">
                <div className="qna-bubble-label">Svar</div>
                <div className="qna-bubble-text">{item.answer}</div>
              </div>
            )}

            {replyingTo === idx && (
              <div className="qna-reply-area">
                <textarea
                  className="qna-reply-input"
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, () => submitReply(idx))}
                  placeholder="Skrifaðu svar (Enter til að vista)..."
                  autoFocus
                  rows={3}
                />
                <div className="qna-reply-btns">
                  <button className="btn-primary" onClick={() => submitReply(idx)}>Vista svar</button>
                  <button onClick={() => { setReplyingTo(null); setReplyInput(''); }}>Hætta við</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nýtt spurningasvæði */}
      <div className="qna-input-area">
        <input
          type="text"
          className="qna-question-input"
          value={questionInput}
          onChange={e => setQuestionInput(e.target.value)}
          onKeyDown={e => handleKeyDown(e, submitQuestion)}
          placeholder="Strákarnir skrifa spurningu hér..."
        />
        <button
          className="btn-primary qna-submit-btn"
          onClick={submitQuestion}
          disabled={!questionInput.trim()}
          title="Senda spurningu (Enter)"
        >
          Spyrja
        </button>
      </div>
    </div>
  );
}
