import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import LandingPage from './components/LandingPage';
import CategoryPicker from './components/CategoryPicker';
import Sidebar from './components/Sidebar';
import Reader from './components/Reader';
import ReadingDashboard from './components/ReadingDashboard';
import NotesPanel from './components/NotesPanel';
import ReadersSetup from './components/ReadersSetup';
import gylfData from './chapters.json';
import './index.css';

// Load þjóðsögur lazily
let thjodCache = null;
async function loadThjodsogar() {
  if (!thjodCache) {
    const mod = await import('./thjodsogar.json');
    thjodCache = mod.default;
  }
  return thjodCache;
}

export default function App() {
  // view: 'home' | 'categories' | 'reader'
  const [view,         setView]         = useLocalStorage('gylfa-view',  'home');
  const [activeBook,   setActiveBook]   = useLocalStorage('gylfa-book',  'gylfaginning');
  const [activeCategory, setActiveCategory] = useState(null); // slug string

  const [chapters,     setChapters]     = useState(gylfData);
  const [thjodCategories, setThjodCategories] = useState([]);

  const [currentChapterIndex, setCurrentChapterIndex] = useLocalStorage('gylfa-kafli', 0);
  const [readStatus,   setReadStatus]   = useLocalStorage('gylfa-lesid',        {});
  const [notesDict,    setNotesDict]    = useLocalStorage('gylfa-glosur',       {});
  const [qnaDict,      setQnaDict]      = useLocalStorage('gylfa-spurningar',   {});
  const [familyDict,   setFamilyDict]   = useLocalStorage('gylfa-vidsegjum',    {});
  const [readers,      setReaders]      = useLocalStorage('gylfa-readers',      []);
  const [theme,        setTheme]        = useLocalStorage('gylfa-theme',        'light');

  const [readingMode,  setReadingMode]  = useState(false);
  const [annotateMode, setAnnotateMode] = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(window.innerWidth > 1024);
  const [notesOpen,    setNotesOpen]    = useState(false);
  const [readersOpen,  setReadersOpen]  = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) { setSidebarOpen(false); setNotesOpen(false); }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Book opening ───────────────────────────────────────────────
  const openBook = async (bookId) => {
    setActiveBook(bookId);
    setAnnotateMode(false);
    setReadingMode(false);

    if (bookId === 'thjodsogar') {
      // Load categories and show picker first
      const data = await loadThjodsogar();
      setThjodCategories(data);
      setView('categories');
    } else if (bookId === 'voluspa') {
      const mod = await import('./voluspa.json');
      setChapters(mod.default);
      setCurrentChapterIndex(0);
      setView('reader');
    } else if (bookId === 'havamal') {
      const mod = await import('./havamal.json');
      setChapters(mod.default);
      setCurrentChapterIndex(0);
      setView('reader');
    } else if (bookId === 'dmyrk' || bookId === 'gilitr' || bookId === 'saemi') {
      const data = await loadThjodsogar();
      // dmyrk -> draugar, gilitr -> troll, saemi -> galdrar
      let slug = 'draugar';
      if (bookId === 'gilitr') slug = 'troll';
      if (bookId === 'saemi') slug = 'galdrar';
      
      const category = data.find(c => c.slug === slug);
      const story = category.stories.find(s => s.id === bookId);
      
      setChapters([story]);
      setCurrentChapterIndex(0);
      setView('reader');
    } else {
      // Gylfaginning — go straight to reader
      setChapters(gylfData);
      setCurrentChapterIndex(0);
      setView('reader');
    }
  };

  const openCategory = (categorySlug) => {
    const cat = thjodCategories.find(c => c.slug === categorySlug);
    if (!cat) return;
    setActiveCategory(cat);
    setChapters(cat.stories.map((s, i) => ({
      number: i + 1,
      title:  s.title,
      paragraphs: s.paragraphs,
    })));
    setCurrentChapterIndex(0);
    setView('reader');
  };

  // ── Helpers ────────────────────────────────────────────────────
  const toggleReadStatus = (idx) => setReadStatus(prev => ({ ...prev, [idx]: !prev[idx] }));

  const cycleTheme = () => {
    const themes = ['light', 'sepia', 'dark'];
    setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
  };

  const toggleReadingMode = () => {
    setReadingMode(r => {
      if (!r) { setSidebarOpen(false); setNotesOpen(false); setAnnotateMode(false); }
      else if (window.innerWidth > 1024) setSidebarOpen(true);
      return !r;
    });
  };

  const toggleAnnotateMode = () => {
    setAnnotateMode(a => {
      if (!a) setNotesOpen(true);
      return !a;
    });
  };

  const handleAddFamilyEntry = (entry) => {
    setFamilyDict(prev => ({
      ...prev,
      [currentChapterIndex]: [...(prev[currentChapterIndex] || []), { ...entry, id: Date.now() }],
    }));
    setNotesOpen(true);
  };

  const themeLabel = theme === 'light' ? '☀️' : theme === 'sepia' ? '📜' : '🌙';

  const totalActivity =
    Object.values(familyDict).reduce((s, a) => s + a.length, 0) +
    Object.values(qnaDict).reduce((s, a) => s + a.filter(q => !q.answer).length, 0);

  // Sidebar display name
  const sidebarTitle =
    activeBook === 'thjodsogar' && activeCategory
      ? `${activeCategory.emoji} ${activeCategory.label}`
      : activeBook === 'voluspa'
      ? 'Völuspá'
      : activeBook === 'havamal'
      ? 'Hávamál'
      : (activeBook === 'dmyrk' || activeBook === 'gilitr' || activeBook === 'saemi')
      ? 'Myndskreytt saga'
      : 'Gylfaginning';

  // ── Views ──────────────────────────────────────────────────────

  if (view === 'home') {
    return (
      <>
        <div className="landing-theme-toggle">
          <button onClick={cycleTheme}>{themeLabel}</button>
        </div>
        <LandingPage
          readers={readers}
          setReaders={setReaders}
          onOpenBook={openBook}
        />
      </>
    );
  }

  if (view === 'categories') {
    return (
      <>
        <div className="landing-theme-toggle">
          <button onClick={cycleTheme}>{themeLabel}</button>
        </div>
        <CategoryPicker
          categories={thjodCategories}
          onSelectCategory={openCategory}
          onBack={() => setView('home')}
        />
      </>
    );
  }

  // ── Reader view ───────────────────────────────────────────────
  return (
    <div className={`app-container ${readingMode ? 'reading-mode' : ''}`}>
      <Sidebar
        chapters={chapters}
        currentChapterIndex={currentChapterIndex}
        setCurrentChapterIndex={setCurrentChapterIndex}
        readStatus={readStatus}
        isOpen={sidebarOpen && !readingMode}
        toggleSidebar={() => setSidebarOpen(o => !o)}
        activeBook={activeBook}
        sidebarTitle={sidebarTitle}
      />

      <div className="reader-container">
        <div className="top-bar">
          <div className="toolbar-group">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? 'Fela valmynd' : 'Opna valmynd'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <button
              onClick={() => activeBook === 'thjodsogar' ? setView('categories') : setView('home')}
              style={{ opacity: 0.6, fontSize: '0.82rem' }}
            >
              {activeBook === 'thjodsogar' ? '← Flokkar' : '← Aftur á forsíðu'}
            </button>
            <span className="top-bar-title">{chapters[currentChapterIndex]?.title ?? ''}</span>
          </div>
          <div className="toolbar-group">
            <button onClick={cycleTheme}>{themeLabel}</button>
            <button onClick={() => setReadersOpen(true)} className="readers-btn">
              👥 {readers.length > 0 ? readers.join(', ') : 'Þátttakendur'}
            </button>
            <button
              onClick={toggleReadingMode}
              className={readingMode ? 'btn-primary' : ''}
            >
              {readingMode ? '✕ Hætta' : '📖 Lestrishamur'}
            </button>
            <button
              onClick={toggleAnnotateMode}
              className={annotateMode ? 'btn-annotate-active' : ''}
            >
              {annotateMode ? '✏️ Samlestur (kveikt)' : '✏️ Samlestur'}
            </button>
            <button
              onClick={() => setNotesOpen(o => !o)}
              className={notesOpen ? 'btn-primary' : ''}
            >
              {totalActivity > 0 ? `📋 (${totalActivity})` : '📋 Glósur'}
            </button>
          </div>
        </div>

        <ReadingDashboard
          chapters={chapters}
          currentChapterIndex={currentChapterIndex}
          readStatus={readStatus}
          activeBook={activeBook}
          currentChapterTitle={chapters[currentChapterIndex]?.title ?? ''}
        />

        <Reader
          chapter={chapters[currentChapterIndex]}
          currentChapterIndex={currentChapterIndex}
          totalChapters={chapters.length}
          setCurrentChapterIndex={setCurrentChapterIndex}
          isRead={!!readStatus[currentChapterIndex]}
          toggleReadStatus={toggleReadStatus}
          readers={readers}
          onAddEntry={handleAddFamilyEntry}
          annotateMode={annotateMode}
        />
      </div>

      <NotesPanel
        currentChapterIndex={currentChapterIndex}
        notesDict={notesDict}
        setNotesDict={setNotesDict}
        qnaDict={qnaDict}
        setQnaDict={setQnaDict}
        familyDict={familyDict}
        setFamilyDict={setFamilyDict}
        readers={readers}
        isOpen={notesOpen && !readingMode}
      />

      {readersOpen && (
        <ReadersSetup
          readers={readers}
          setReaders={setReaders}
          onClose={() => setReadersOpen(false)}
        />
      )}
    </div>
  );
}
