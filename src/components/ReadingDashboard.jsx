import React, { useEffect, useState, useRef } from 'react';
import VoiceRecorder from './VoiceRecorder';

const BADGES = [
  { at: 1,   icon: '📖', label: 'Fyrsti kafli!' },
  { at: 3,   icon: '🌟', label: 'Lesandi á leiðinni' },
  { at: 5,   icon: '🛡️', label: 'Ásagott' },
  { at: 8,   icon: '🧌', label: 'Trollavörður' },
  { at: 12,  icon: '⚡', label: 'Þórsmáttur' },
  { at: 20,  icon: '🦅', label: 'Huginns auga' },
  { at: 35,  icon: '🌲', label: 'Yggdrasilsverður' },
  { at: 50,  icon: '🔱', label: 'Ásagoð' },
];

function getBadge(totalRead) {
  let earned = null;
  for (const b of BADGES) {
    if (totalRead >= b.at) earned = b;
  }
  return earned;
}

function getNextBadge(totalRead) {
  return BADGES.find(b => b.at > totalRead) || null;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Streak: list of dates read, stored in localStorage
function updateStreak() {
  const key = 'gylfa-streak-dates';
  const today = getTodayKey();
  const raw = localStorage.getItem(key);
  const dates = raw ? JSON.parse(raw) : [];
  if (!dates.includes(today)) {
    dates.push(today);
    localStorage.setItem(key, JSON.stringify(dates));
  }
  // Count consecutive days up to today
  let streak = 0;
  const d = new Date();
  while (true) {
    const k = d.toISOString().slice(0, 10);
    if (dates.includes(k)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export default function ReadingDashboard({
  chapters,
  currentChapterIndex,
  readStatus,
  activeBook,
  currentChapterTitle,
  readers = [],
}) {
  const totalChapters = chapters.length;
  const readCount = Object.values(readStatus).filter(Boolean).length;
  const pct = totalChapters > 0 ? Math.round((readCount / totalChapters) * 100) : 0;

  const [streak, setStreak] = useState(0);
  const [celebration, setCelebration] = useState(null);
  const prevRead = useRef(readCount);

  useEffect(() => {
    setStreak(updateStreak());
  }, []);

  // Celebrate when a new chapter is marked read
  useEffect(() => {
    if (readCount > prevRead.current) {
      const badge = getBadge(readCount);
      if (badge && getBadge(prevRead.current)?.at !== badge.at) {
        setCelebration(badge);
        setTimeout(() => setCelebration(null), 3500);
      }
      prevRead.current = readCount;
    }
  }, [readCount]);

  const badge = getBadge(readCount);
  const next = getNextBadge(readCount);

  return (
    <div className="rdash">
      {/* Celebration overlay */}
      {celebration && (
        <div className="rdash-celebration">
          <div className="rdash-celebration-inner">
            <span className="rdash-cel-icon">{celebration.icon}</span>
            <strong>Merki unnið!</strong>
            <span>{celebration.label}</span>
          </div>
        </div>
      )}

      {/* Top row */}
      <div className="rdash-top">
        {/* Badge */}
        <div className="rdash-badge" title={badge?.label || 'Les kafla til að vinna merki!'}>
          <span className="rdash-badge-icon">{badge ? badge.icon : '🌱'}</span>
          <span className="rdash-badge-label">{badge ? badge.label : 'Byrjandi'}</span>
        </div>

        {/* Progress */}
        <div className="rdash-progress-area">
          <div className="rdash-progress-label">
            <span>{readCount} / {totalChapters} kaflar lesið</span>
            <span className="rdash-pct">{pct}%</span>
          </div>
          <div className="rdash-bar-track">
            <div className="rdash-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          {next && (
            <div className="rdash-next-badge">
              Næsta merki: <strong>{next.at - readCount}</strong> kaflar í burtu → {next.icon} {next.label}
            </div>
          )}
        </div>

        {/* Taka upp — lesandaval fylgir með */}
        <VoiceRecorder chapterTitle={currentChapterTitle} readers={readers} compact />

        {/* Streak */}
        <div className="rdash-streak">
          <span className="rdash-streak-flame">🔥</span>
          <span className="rdash-streak-num">{streak}</span>
          <span className="rdash-streak-lbl">dagar í röð</span>
        </div>
      </div>

      {/* Chapter stars row */}
      <div className="rdash-stars-row" title="Hvert tákn er einn kafli">
        {chapters.map((ch, i) => (
          <span
            key={i}
            className={`rdash-star ${readStatus[i] ? 'rdash-star--done' : ''} ${i === currentChapterIndex ? 'rdash-star--current' : ''}`}
            title={ch.title}
          >
            {readStatus[i] ? '⭐' : '○'}
          </span>
        ))}
      </div>
    </div>
  );
}
