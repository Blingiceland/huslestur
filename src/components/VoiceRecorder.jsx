import React, { useState, useRef, useEffect, useCallback } from 'react';

const STATES = { IDLE: 'idle', COUNTDOWN: 'countdown', RECORDING: 'recording', DONE: 'done' };

export default function VoiceRecorder({ chapterTitle, compact = false }) {
  const [state, setState] = useState(STATES.IDLE);
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const startCountdown = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
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
    };
    mr.start(100);
    mediaRecorder.current = mr;
    setState(STATES.RECORDING);
    let secs = 0;
    timerRef.current = setInterval(() => { secs++; setElapsed(secs); }, 1000);
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRecorder.current?.stop();
  }

  function handleDownload() {
    const ext = getSupportedMime().includes('ogg') ? 'ogg' : 'webm';
    const safe = (chapterTitle || 'kafli').replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '-');
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `Lestur-${safe}.${ext}`;
    a.click();
  }

  function reset() {
    setAudioUrl(null);
    setElapsed(0);
    setState(STATES.IDLE);
  }

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Compact mode: just a pill button in the dashboard, panel renders below dashboard
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

  // When open — panel renders in place (in dashboard row if compact, standalone if not)
  const panel = (
    <div className={compact ? 'recorder-panel recorder-panel--inline' : 'recorder-panel'}>
      <div className="recorder-header">
        <span className="recorder-title">🎙️ Lesturupptaka</span>
        <button className="recorder-close" onClick={() => { setOpen(false); reset(); }}>✕</button>
      </div>
      <p className="recorder-chapter-name">„{chapterTitle}"</p>
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
      {state === STATES.DONE && audioUrl && (
        <div className="recorder-done">
          <div className="recorder-success-icon">🌟</div>
          <p className="recorder-done-msg">Glæsileg lesning! Hlustið á ykkur:</p>
          <audio ref={audioRef} src={audioUrl} controls className="recorder-audio" />
          <div className="recorder-actions">
            <button className="recorder-download-btn" onClick={handleDownload}>⬇️ Vista á tölvuna</button>
            <button className="recorder-again-btn" onClick={reset}>🔄 Taka upp aftur</button>
          </div>
        </div>
      )}
    </div>
  );

  return panel;
}

function getSupportedMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
}
