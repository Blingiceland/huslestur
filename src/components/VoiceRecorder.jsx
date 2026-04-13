import React, { useState, useRef, useEffect, useCallback } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const STATES = { IDLE: 'idle', COUNTDOWN: 'countdown', RECORDING: 'recording', UPLOADING: 'uploading', DONE: 'done' };

export default function VoiceRecorder({ chapterTitle, readers = [], compact = false }) {
  const { user } = useAuth();
  const [state, setState]       = useState(STATES.IDLE);
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed]   = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError]       = useState(null);
  const [open, setOpen]         = useState(false);
  const [reader, setReader]     = useState(readers[0] || '');
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const mediaRecorder = useRef(null);
  const chunks        = useRef([]);
  const timerRef      = useRef(null);
  const streamRef     = useRef(null);
  const audioRef      = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const startCountdown = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    setUploadedUrl(null);
    setElapsed(0);
    setCountdown(3);
    setState(STATES.COUNTDOWN);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      let count = 3;
      const cd = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) { clearInterval(cd); beginRecording(stream); }
      }, 1000);
    } catch {
      setError('Leyfðu vafranum að nota hljóðnemann og reyndu aftur.');
      setState(STATES.IDLE);
    }
  }, []);

  function beginRecording(stream) {
    chunks.current = [];
    const mr = new MediaRecorder(stream, { mimeType: getSupportedMime() });
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunks.current, { type: getSupportedMime() });
      setAudioUrl(URL.createObjectURL(blob));
      setState(STATES.DONE);
      stream.getTracks().forEach(t => t.stop());
      // Upphala sjálfkrafa
      uploadRecording(blob);
    };
    mr.start(100);
    mediaRecorder.current = mr;
    setState(STATES.RECORDING);
    let secs = 0;
    timerRef.current = setInterval(() => { secs++; setElapsed(secs); }, 1000);
  }

  async function uploadRecording(blob) {
    if (!user) return;
    setState(STATES.UPLOADING);
    try {
      const ext  = getSupportedMime().includes('ogg') ? 'ogg' : 'webm';
      const safe = (chapterTitle || 'kafli').replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '-');
      const ts   = Date.now();
      const path = `families/${user.uid}/recordings/${safe}-${ts}.${ext}`;

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      setUploadedUrl(url);

      // Vista lýsigögn í Firestore
      await addDoc(collection(db, 'families', user.uid, 'recordings'), {
        chapterTitle,
        reader:    reader || 'Nafnlaust',
        url,
        path,
        duration:  elapsed,
        status:    'pending',   // 'pending' | 'approved' | 'needs_work'
        createdAt: serverTimestamp(),
      });

      setState(STATES.DONE);
    } catch (e) {
      console.error(e);
      setError('Upphal mistókst. Reyndu aftur.');
      setState(STATES.DONE);
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRecorder.current?.stop();
  }

  function reset() {
    setAudioUrl(null);
    setUploadedUrl(null);
    setElapsed(0);
    setState(STATES.IDLE);
  }

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!open) {
    return compact ? (
      <button className="recorder-compact-btn" onClick={() => setOpen(true)}>
        🎙️ Taka upp
      </button>
    ) : (
      <div className="recorder-launcher">
        <button className="recorder-open-btn" onClick={() => setOpen(true)}>
          🎙️ Taka upp lestur
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? 'recorder-panel recorder-panel--inline' : 'recorder-panel'}>
      <div className="recorder-header">
        <span className="recorder-title">🎙️ Lesturupptaka</span>
        <button className="recorder-close" onClick={() => { setOpen(false); reset(); }}>✕</button>
      </div>

      <p className="recorder-chapter-name">„{chapterTitle}"</p>

      {/* Lesandaval */}
      {readers.length > 0 && state === STATES.IDLE && (
        <div className="recorder-reader-pick">
          <span className="recorder-reader-label">Hver er að lesa?</span>
          <div className="recorder-reader-btns">
            {readers.map(r => (
              <button
                key={r}
                className={`family-who-btn ${reader === r ? 'active' : ''}`}
                onClick={() => setReader(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="recorder-error">{error}</p>}

      {state === STATES.IDLE && (
        <div className="recorder-idle">
          <p className="recorder-hint">Setjið ykkur vel, finnið blaðsíðuna og smellið þegar þið eruð tilbúin!</p>
          <button className="recorder-start-btn" onClick={startCountdown}>
            🎙️ Byrja
          </button>
        </div>
      )}
      {state === STATES.COUNTDOWN && (
        <div className="recorder-countdown">
          <div className="recorder-countdown-number">{countdown}</div>
          <p>Lesturinn hefst...</p>
        </div>
      )}
      {state === STATES.RECORDING && (
        <div className="recorder-recording">
          <div className="recorder-pulse"><div className="recorder-pulse-dot" /></div>
          <div className="recorder-timer">{fmt(elapsed)}</div>
          <p className="recorder-hint">Lestu þér í hægðarleysi — við erum að taka upp! 📖</p>
          <button className="recorder-stop-btn" onClick={stopRecording}>⏹ Hætta</button>
        </div>
      )}
      {state === STATES.UPLOADING && (
        <div className="recorder-uploading">
          <div className="recorder-upload-spinner">⬆️</div>
          <p>Hleð upp upptöku...</p>
        </div>
      )}
      {state === STATES.DONE && audioUrl && (
        <div className="recorder-done">
          <div className="recorder-success-icon">🌟</div>
          {uploadedUrl
            ? <p className="recorder-done-msg">Glæsileg lesning! Foreldri þitt getur nú hlustað. 🎉</p>
            : <p className="recorder-done-msg">Glæsileg lesning! Hlustið á ykkur:</p>
          }
          <audio ref={audioRef} src={audioUrl} controls className="recorder-audio" />
          <div className="recorder-actions">
            <button className="recorder-again-btn" onClick={reset}>🔄 Taka upp aftur</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getSupportedMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
}
