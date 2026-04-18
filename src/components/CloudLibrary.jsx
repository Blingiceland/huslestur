import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const CATEGORY_COVERS = {
  'HC Andersen':      '/hc-andersen-cover.png',
  'Íslensk ævintýri': '/islensk-aevintiri-cover.png',
  'Íslendingasögur':  '/islendingasogur-cover.png',
};

const CATEGORY_ACCENTS = {
  'HC Andersen':      '#a78bfa',
  'Íslensk ævintýri': '#34d399',
  'Íslendingasögur':  '#fbbf24',
};

const STORY_COVERS_BY_TITLE = {
  'hans klaufi': '/hans_klaufi.png',
  'klukkan': '/klukkan.png',
  'litli kláus og stóri kláus': '/litli_klaus.png',
  'prinsessan á bauninni': '/prinsessan_bauninni.png',
  'sólargeislinn og fanginn': '/solargeislinn.png',
  'vatnsdropinn': '/vatnsdropinn.png',
  'brennu-njáls saga': '/brennu_njals_saga.png',
  'egils saga': '/egils_saga.png',
  'grettis saga': '/grettis_saga.png',
  'bandamannasaga': '/bandamannasaga.png',
  'bjarnar saga hítdælakappa': '/bjarnar_saga.png',
  'bárðar saga snæfellsáss': '/bardar_saga.png',
  'droplaugarsona saga': '/droplaugarsona_saga.png',
  'eyrbyggja saga': '/eyrbyggja_saga.png',
  'fljótsdæla saga': '/fljotsdaela_saga.png',
  'flóamanna saga': '/floamanna_saga.png',
  'fóstbræðra saga': '/fostbraedra_saga.png',
  'finnboga saga ramma': '/finnboga_saga.png',
  'færeyinga saga': '/faereyinga_saga.png',
  'grænlendinga saga': '/graenlendinga_saga.png',
  'grænlendinga þáttur': '/graenlendinga_thattur.png',
  'gull-þóris saga': '/gull_thoris_saga.png',
  'gunnars saga keldugnúpsfífls': '/gunnars_saga.png',
  'gunnlaugs saga ormstungu': '/gunnlaugs_saga.png',
  'gísla saga súrssonar': '/gisla_saga.png',
  'hallfreðar saga vandræðaskálds': '/hallfredar_saga.png',
  'harðar saga og hólmverja': '/hardar_saga.png',
  'heiðarvíga saga': '/heidarviga_saga.png',
  'hrana saga hrings': '/hrana_saga.png',
  'hænsna-þóris saga': '/haensna_thoris_saga.png',
  'hávarðar saga ísfirðings': '/havardar_saga.png',
  'hrafnkels saga freysgoða': '/hrafnkels_saga.png',
  'þórðar saga hreðu': '/thordar_saga.png',
  'kjalnesinga saga': '/kjalnesinga_saga.png',
  'kormáks saga': '/kormaks_saga.png',
  'króka-refs saga': '/kroka_refs_saga.png',
  'laxdæla saga': '/laxdaela_saga.png',
  'ljósvetninga saga': '/ljosvetninga_saga.png',
  'svarfdæla saga': '/svarfdaela_saga.png',
  'þorsteins saga hvíta': '/thorsteins_saga_hvita.png',
  'þorsteins saga síðu-hallssonar': '/thorsteins_saga_hallssonar.png',
  'valla-ljóts saga': '/valla_ljots_saga.png',
  'vatnsdæla saga': '/vatnsdaela_saga.png',
  'víga-glúms saga': '/viga_glums_saga.png',
  'reykdæla saga og víga-skútu': '/reykdaela_saga.png',
  'víglundar saga': '/viglundar_saga.png',
  'vápnfirðinga saga': '/vopnfirdinga_saga.png',
  
  // Ævintýri
  'bangsímon': '/bangsimon.png',
  'brjáms saga': '/brjams_saga_aev.png', // Til að forðast rugling ef til
  'báráður': '/baradur.png',
  'bóndadæturnar': '/bondadaeturnar.png',
  'búkolla - i': '/bukolla_1.png',
  'búkolla - ii': '/bukolla_2.png',
  'gorvömb': '/gorvomb.png',
  'grautardalls saga': '/grautardalls_saga.png',
  'helga karlsdóttir': '/helga_karlsdottir.png',
  'grámann': '/gramann.png',
  'sagan af kolrössu krókríðandi': '/kolrossu.png',
  'sagan af líneik og laufey': '/lineik.png',
  'sagan af loðinbarða': '/lodinbarda.png',
  'karlsdæturnar': '/karlsdaeturnar.png',
  'ásmundur kóngsson og signý systir hans': '/asmundur_kongsson.png',
  'sagan af brauðþekkjara, vatnsþekkjara og mannþekkjara': '/braudthekkjara.png',
  'sagan af birni bragðastakk': '/birni_bragdastakk.png',
  'sagan af þrem kóngssonum': '/threm_kongssonum.png',
  'sagan af fertram og ísól björtu': '/fertram_isol.png',
  'saga af finnu forvitru': '/finnu_forvitru.png',
  'sagan af geirlaugu og græðara': '/geirlaugu_graedara.png',
  'sagan af gríshildi góðu': '/grishildi_godu.png',
  'sagan af hans karlssyni': '/hans_karlssyni.png',
  'sagan af hermóði og háðvöru': '/hermodi_hadvoru.png',
  'sagan af hildi góðu stjúpu': '/hildi_godu.png',
  'sagan af hlini kóngssyni': '/hlini_kongssyni.png',
  'himinbjargar saga': '/himinbjargar_saga.png',
  'sagan af hlinik kóngssyni og þóru karlsdóttur': '/hlinik_thoru.png',
  'sagan af hordingul': '/hordingul.png',
  'sagan af hringi kóngssyni': '/hringi_kongssyni.png',
  'ingibjörg kóngsdóttir': '/ingibjorg_kongsdottir.png',
  'sagan af jónídes konungssyni og hildi konungsdóttur': '/jonides.png',
  'karlsdæturnar þrjár': '/karlsdaeturnar_thriar.png',
  'kiðuvaldi': '/kiduvaldi.png',
  'karlssonur og kötturinn hans': '/karlssonur_kotturinn.png',
  'koltrýnu saga': '/koltrynu_saga.png',
  'sagan af kóngsdótturinni og kölska': '/kongsdottirin_kolska.png',
  'mærþallar saga': '/maerthallar_saga.png',
  'mjaðveig og króka': '/mjadveig_og_kroka.png',
  'sagan af mjaðveigu mánadóttur': '/mjadveigu_manadottur.png',
  'olbogabarnið': '/olbogabarnid.png',
  'neyttu á meðan á nefinu stendur': '/neyttu_a_medan.png',
  'sagan af sigurði kóngssyni og ingibjörgu systur hans': '/sigurdi_ingibjorgu.png',
  'sigurður kóngsson': '/sigurdur_kongsson.png',
  'sagan af sigurði kóngssyni': '/sigurdur_kongsson.png', // Sömu mynd
};

const GENERIC_COVERS = {
  'Íslendingasögur': '/islendingasogur_generic.png',
  'Íslensk ævintýri': '/islensk_aevintyri_generic.png',
};

// Laga titla sem eru í hástöfum (t.d. "BANDAMANNASAGA" → "Bandamannasaga")
function fixTitle(title) {
  if (!title) return title;
  if (title === title.toUpperCase() && title.length > 4) {
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  }
  return title;
}

export default function CloudLibrary({ onSelectStory, onBack, initialCategory = null }) {
  const [stories, setStories]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const q = query(collection(db, 'library'), orderBy('title'));
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(doc => results.push(doc.data()));
        setStories(results);
      } catch (e) {
        console.error('Load library error:', e);
      }
      setLoading(false);
    }
    loadLibrary();
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter(s =>
      (selectedCategory ? s.category === selectedCategory : true) &&
      (fixTitle(s.title).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stories, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(stories.map(s => s.category || 'Annað'));
    return Array.from(cats).sort();
  }, [stories]);

  const coverImg  = selectedCategory ? CATEGORY_COVERS[selectedCategory]  : null;
  const accent    = selectedCategory ? (CATEGORY_ACCENTS[selectedCategory] || '#a78bfa') : '#a78bfa';

  return (
    <div className="cl-root">

      {/* ── HERO BANNER ── */}
      <div className="cl-hero" style={{ '--cl-accent': accent }}>
        {coverImg && (
          <img src={coverImg} alt={selectedCategory} className="cl-hero-img" />
        )}
        <div className="cl-hero-overlay">
          <button className="cl-back-btn" onClick={() => {
            if (searchTerm) { setSearchTerm(''); return; }
            if (selectedCategory && !initialCategory) { setSelectedCategory(null); return; }
            onBack();
          }}>← Til baka</button>

          <div className="cl-hero-text">
            <p className="cl-hero-eyebrow">Bókasafnið</p>
            <h1 className="cl-hero-title">
              {selectedCategory || 'Veldu flokk'}
            </h1>
            {!loading && (
              <p className="cl-hero-count" style={{ color: accent }}>
                {filteredStories.length} {selectedCategory ? 'sögur' : 'flokkar'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      {(selectedCategory || searchTerm) && !loading && (
        <div className="cl-search-wrap">
          <input
            type="text"
            className="cl-search-input"
            placeholder={`Leita í ${selectedCategory || 'öllu safninu'}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus={!!selectedCategory}
          />
        </div>
      )}

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="app-loading">
          <div className="app-loading-rune">&#x16ED;</div>
        </div>
      ) : !selectedCategory && !searchTerm ? (
        /* ── Category grid — only featured (with cover) ── */
        <div className="cl-cat-grid">
          {categories.filter(cat => CATEGORY_COVERS[cat]).map(cat => {
            const cover = CATEGORY_COVERS[cat];
            const acc   = CATEGORY_ACCENTS[cat] || '#a78bfa';
            const count = stories.filter(s => s.category === cat).length;
            return (
              <button
                key={cat}
                className="cl-cat-imgcard"
                style={{ '--cl-accent': acc }}
                onClick={() => setSelectedCategory(cat)}
              >
                <img src={cover} alt={cat} className="cl-cat-imgcard-img" />
                <div className="cl-cat-imgcard-overlay">
                  <span className="cl-cat-imgcard-title">{cat}</span>
                  <span className="cl-cat-imgcard-count" style={{ color: acc }}>{count} sögur →</span>
                </div>
              </button>
            );
          })}
        </div>

      ) : (
        <div className="cl-story-grid">
          {filteredStories.map(story => {
            const pgCount = story.chapters?.[0]?.paragraphs?.length || 0;
            const title   = fixTitle(story.title);
            let coverImg = STORY_COVERS_BY_TITLE[title.toLowerCase()];
            if (!coverImg && GENERIC_COVERS[story.category]) {
              coverImg = GENERIC_COVERS[story.category];
            }
            // Approximate reading time (avg 3 paragraphs per minute for kids)
            const mins    = Math.max(1, Math.round(pgCount / 3));

            if (coverImg) {
              return (
                <button
                  key={story.id}
                  className="cl-cat-imgcard"
                  style={{ '--cl-accent': accent, aspectRatio: '1 / 1' }}
                  onClick={() => onSelectStory(story)}
                >
                  <img src={coverImg} alt={title} className="cl-cat-imgcard-img" />
                  <div className="cl-cat-imgcard-overlay" style={{ padding: '16px 16px 14px' }}>
                    <span className="cl-cat-imgcard-title" style={{ fontSize: '1.2rem', lineHeight: '1.2', marginBottom: '4px' }}>{title}</span>
                    <div className="cl-story-meta">
                      <span>{pgCount} kaflar</span>
                      <span className="cl-story-dot">·</span>
                      <span>~{mins} mín</span>
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={story.id}
                className="cl-story-card"
                style={{ '--cl-accent': accent }}
                onClick={() => onSelectStory(story)}
              >
                <div className="cl-story-icon">📖</div>
                <h2 className="cl-story-title">{title}</h2>
                <div className="cl-story-meta">
                  <span>{pgCount} kaflar</span>
                  <span className="cl-story-dot">·</span>
                  <span>~{mins} mín</span>
                </div>
              </button>
            );
          })}
          {filteredStories.length === 0 && (
            <p className="cl-empty">Engar sögur fundust.</p>
          )}
        </div>
      )}
    </div>
  );
}
