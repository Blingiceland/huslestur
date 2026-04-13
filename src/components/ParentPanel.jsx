/**
 * ParentPanel – Foreldragluggi
 * Sýnir allar lesturupptökur barna. Foreldri getur hlustað,
 * samþykkt eða beðið barn um að taka aftur upp.
 */
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const STATUS_LABELS = {
  pending:    { label: 'Í bið',      emoji: '⏳', cls: 'status-pending'    },
  approved:   { label: 'Samþykkt',   emoji: '✅', cls: 'status-approved'   },
  needs_work: { label: 'Reyndu aftur', emoji: '🔄', cls: 'status-needswork' },
};

export default function ParentPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [playingId, setPlayingId]   = useState(null);

  useEffect(() => {
    if (!user || !isOpen) return;
    setLoading(true);
    const q = query(
      collection(db, 'families', user.uid, 'recordings'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setRecordings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user, isOpen]);

  const setStatus = async (id, status) => {
    if (!user) return;
    await updateDoc(doc(db, 'families', user.uid, 'recordings', id), { status });
  };

  const fmt = s => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '';

  if (!isOpen) return null;

  return (
    <div className="parent-overlay" onClick={onClose}>
      <div className="parent-panel" onClick={e => e.stopPropagation()}>
        <div className="parent-panel-header">
          <span>🎧 Lesturupptökur</span>
          <button className="parent-close" onClick={onClose}>✕</button>
        </div>

        {loading && <p className="parent-loading">Hleður...</p>}

        {!loading && recordings.length === 0 && (
          <p className="parent-empty">
            Engar lesturupptökur enn. Þegar barn tekur upp lestur, birtist það hér.
          </p>
        )}

        <div className="parent-list">
          {recordings.map(rec => {
            const st = STATUS_LABELS[rec.status] || STATUS_LABELS.pending;
            return (
              <div key={rec.id} className={`parent-rec-card ${st.cls}`}>
                <div className="parent-rec-top">
                  <div>
                    <span className="parent-rec-reader">👤 {rec.reader}</span>
                    <span className="parent-rec-chapter">{rec.chapterTitle}</span>
                  </div>
                  <span className={`parent-rec-status ${st.cls}`}>
                    {st.emoji} {st.label}
                  </span>
                </div>

                {rec.duration && (
                  <span className="parent-rec-duration">⏱ {fmt(rec.duration)}</span>
                )}

                {rec.url && (
                  <audio
                    className="parent-rec-audio"
                    src={rec.url}
                    controls
                    onPlay={() => setPlayingId(rec.id)}
                  />
                )}

                <div className="parent-rec-actions">
                  <button
                    className={`parent-btn-approve ${rec.status === 'approved' ? 'active' : ''}`}
                    onClick={() => setStatus(rec.id, 'approved')}
                  >
                    ✅ Samþykkja
                  </button>
                  <button
                    className={`parent-btn-retry ${rec.status === 'needs_work' ? 'active' : ''}`}
                    onClick={() => setStatus(rec.id, 'needs_work')}
                  >
                    🔄 Reyndu aftur
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
