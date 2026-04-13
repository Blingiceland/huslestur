import React, { useState, useEffect, useRef, useCallback } from 'react';
import SelectionPopup from './SelectionPopup';


export default function Reader({
  chapter,
  currentChapterIndex,
  totalChapters,
  setCurrentChapterIndex,
  isRead,
  toggleReadStatus,
  readers,
  onAddEntry,
  annotateMode,
}) {
  const [selection, setSelection] = useState(null); // { text, rect }
  const contentRef = useRef(null);

  // Scroll to top when chapter changes, and clear any popup
  useEffect(() => {
    document.querySelector('.reader-container')?.scrollTo({ top: 0 });
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [currentChapterIndex]);

  // Clear popup when leaving annotate mode
  useEffect(() => {
    if (!annotateMode) {
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  }, [annotateMode]);

  // Close popup when clicking outside both the content area AND the popup itself
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!selection) return;
      const insideContent = contentRef.current?.contains(e.target);
      const insidePopup   = e.target.closest('.sel-popup');
      if (!insideContent && !insidePopup) {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [selection]);

  const handleMouseUp = useCallback(() => {
    // Only use drag-to-select when NOT in annotate mode
    if (annotateMode) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!text || text.length < 4) return;
      if (!contentRef.current?.contains(sel.anchorNode)) return;
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({ text, rect });
      } catch { /* ignore */ }
    }, 50);
  }, [annotateMode]);

  // Click-to-annotate in samlestur mode
  const handleClick = useCallback((e) => {
    if (!annotateMode) return;
    const para = e.target.closest('p');
    const raw = para?.textContent?.trim() || '';
    const snippet = raw.length > 80 ? raw.slice(0, 80) + '…' : raw;
    const rect = { left: e.clientX, top: e.clientY, width: 0, height: 20 };
    setSelection({ text: snippet, rect, clickMode: true });
  }, [annotateMode]);

  const handleAddEntry = useCallback((entry) => {
    onAddEntry(entry);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [onAddEntry]);

  if (!chapter) return null;

  return (
    <>
      {/* Samlestur hint bar */}
      {annotateMode && (
        <div className="annotate-bar">
          ✏️ Samlestur — klikkaðu á málsgrein til að bæta við athugasemd
        </div>
      )}

      <div
        className={`reader-content${annotateMode ? ' annotate-mode' : ''}`}
        ref={contentRef}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      >
        <h1>{chapter.title}</h1>

        {chapter.paragraphs.map((p, i) => {
          let img = null;
          if (chapter.id === 'dmyrk' || chapter.title === 'DJÁKNINN Á MYRKÁ') {
            if (i === 0) img = { src: "/dmyrk-1.png", cap: "Hér stendur hesturinn Faxi nakinn úti í hríðinni og bíður eftir djáknanum sem drukknaði fyrr um daginn í Hörgá." };
            if (i === 2) img = { src: "/dmyrk-2.png", cap: "Ríkt er af stað í djúpu myrkri, en tunglið verður skyndilega ofur bjart og lýsir upp höfuðdjásnið — sem reynist vera bert höfuðkúpubein!" };
            if (i === 5) img = { src: "/dmyrk-3.png", cap: "Sáluhliðið á Myrká. Djákninn fellur aftur á bak ofan í myrka gröfina á meðan Guðrún hangir skelfingu lostin á kirkjuklukkustrengnum." };
          } else if (chapter.id === 'gilitr' || chapter.title === 'GILITRUTT') {
            if (i === 0) img = { src: "/gilitr-1.png", cap: "Lata bændakonan horfir í örvæntingu ofan í hauginn af óunninni ull sem bóndi hennar ætlast til að hún kembi og spinni." };
            if (i === 2) img = { src: "/gilitr-2.png", cap: "Stórskorin og ferleg tröllskessa mætir inn í baðstofuna hjá konunni. Hún býðst til að vinna ullina... gegn ansi krefjandi gjaldi." };
          } else if (chapter.id === 'saemi' || chapter.title === 'SÆMUNDUR FRÓÐI') {
            if (i === 5) img = { src: "/saemi-1.png", cap: "Sæmundur flýr hinn alræmda Svartaskóla djúpt undir Parísarborg þar sem myrkuöflin krefjast sálar hans að loknu námi." };
            if (i === 11) img = { src: "/saemi-2.png", cap: "Kölski hefur brugðið sér í selskíki og syndir með Sæmund yfir Rín, en Sæmundur býr sig undir að slá kölska þungt í höfuðið með saltaranum góða." };
          } else if (chapter.title === 'Kafli 1 — Áður en heimurinn var') {
            if (i === 6) img = { src: "/gylf-ch1-surtr.png", cap: "Eldurinn í Múspellsheimi fyrir sköpun heimsins. Surtur situr þar fremstur á verði og heldur á logandi sverði — hann sem mun einn dag bera það sama sverð yfir himininn þegar Ragnarök ganga yfir." };
            if (i === 10) img = { src: "/gylf-ch1-ymir.png", cap: "Hrímþursinn Ýmir — eitt af frumverum heimsins — rís daufur og gríðarstór upp úr Ginnungagapi, mótaður úr eitrinum og krapa sem mættu þar í hinum tóma bil. Úr holdi hans og beinum yrði heimurinn til." };
            if (i === 15) img = { src: "/gylf-ch1-audhumla.png", cap: "Frumkýrin Auðhumla sleikir himneskan salt úr ísblokkinni, og dag eftir dag birtist eitthvað í ísinum — þangað til höfuðið af Búra, eina forsælu verunnar, brotnar loks í ljós." };
          } else if (chapter.title === 'Kafli 2 — Heimurinn mótast') {
            if (i === 3) img = { src: "/gylf-ch2-ymir-slaughter.png", cap: "Óðinn og bræður hans, Vili og Vé, standa yfir líkama Ýmis sem er stór sem fjallakeðja. Enn renna blóðlækir niður hlíðarnar og varða í dal og haf — þetta var upphaf jarðarinnar." };
            if (i === 7) img = { src: "/gylf-ch2-skull-sky.png", cap: "Bræðurnir lyftir höfuðkúpu Ýmis upp yfir allt og gera hana að himininum. Síðan taka þeir neista og logandi þræði úr Múspelli og setja þá á hvelfinguna — þannig urðu stjörnurnar til." };
            if (i === 10) img = { src: "/gylf-ch2-sun-chariot.png", cap: "Sól og tungl voru send á ferð um himininn á vögnum, drifin af hrossum. Á eftir Sólinni elur úlfurinn Sköll, skuggi hans stór á jörðinni. Einn dag, að Ragnarök komnum, nær hann henni — en það er enn langt í land." };
            if (i === 14) img = { src: "/gylf-ch2-askur-embla.png", cap: "Guðirnir þrír finna tvo trjábolta á ströndinni, hrundir og burtu skolaðir. Óðinn gefur þeim anda, Vili gefur þeim vit og hjarta, Vé gefur þeim líkama og skilningarvit. Þannig opnuðu Askur og Embla augun og urðu fyrstu mennirnir — forfeður okkar allra." };
          } else if (chapter.title === 'Kafli 3 — Heimarnir og guðirnir') {
            if (i === 7) img = { src: "/gylf-ch3-yggdrasil.png", cap: "Yggdrasill — heimstréð — er svo gífurlegt að greinar þess ná yfir alla níu heimana. Í toppinum situr örn sem sér yfir öll lönd. Íkornan Ratatoskur hleypur upp og niður stofninn og flytur skilaboð — oftast eitrleg — á milli arnarins og orms Níðhöggs í rótinni." };
            if (i === 10) img = { src: "/gylf-ch3-nornir.png", cap: "Við Urðarbrunn, neðst í rótum Yggdrasils, sitja þrjár nornir — Urður (fortíðin), Verðandi (nútíminn) og Skuld (framtíðin). Þær vefa þráðinn sem ákvarðar líf og dauða hvers mannfólks. Jafnvel guðirnir geta ekki breytt því sem þær ákveða." };
            if (i === 12) img = { src: "/gylf-ch3-odin-hlidskjalf.png", cap: "Frá hásæti sínu, Hliðskjálfi, getur Óðinn séð yfir alla níu heimana í einu. Hrafnarnir tveir, Huginn (hugsunin) og Muninn (minningin), fljúga á hverjum degi um heiminn og koma aftur og segja honum allt sem þeir hafa séð og heyrt." };
            if (i === 15) img = { src: "/gylf-ch3-loki-children.png", cap: "Börnin þrjú Loka og gýgjunnar Angrboðu: úlfurinn Fenrir sem er svo stór að guðirnir þorðu ekki við hann og festu hann í hléðslubönd — hann mun stökkva þeim við Ragnarök; Jörmungandr, heimsormurinn, sem liggur í hring um allan heiminn; og Hel, hálflifandi, hálfgröfin, sem ræður yfir dánda þeim sem deyja ekki í bardaga." };
          } else if (chapter.title === 'Kafli 4 — Baldur') {
            if (i === 1) img = { src: "/gylf-ch4-baldur.png", cap: "Baldur — ljósguð Ásgarðs og elskastur allra guða. Þar sem aðrir guðir buðu upp á kraft og vald, buðu návist Baldurs upp á eitthvað sem var sjaldgæfara: frið. Þegar hann var til staðar virtist heimurinn öruggari og betri. Guðirnir mátu hann yfir allt." };
            if (i === 6) img = { src: "/gylf-ch4-frigg-oath.png", cap: "Frigg, móðir Baldurs, fer á flakk um alla heimana og biður hvert einasta efni, dýr og plöntu um að sverja eiðinn að skaða Baldur aldrei — eld og vatn, járn og steinn, tré og dýr. Allt svarar já. Nema eitt: mistiltein, of ungur og of léttvægur til að þykja hættulegur." };
            if (i === 11) img = { src: "/gylf-ch4-loki-disguise.png", cap: "Loki, breytt í mynd gamallar konu, leikur sig í gegnum vörn Friggjar með sælum spurningum. Frigg, sem trúir að hún hafi tryggt Baldur að fullu, segir honum hjartans gleðilega frá eina undantekningunni — mistilteini, sem hún hugðist of óhættan til að bíða eiðinn. Loki hefur nú lykillinn." };
            if (i === 19) img = { src: "/gylf-ch4-baldur-falls.png", cap: "Höð, blindur bróðir Baldurs, kastar mistilteinsörinni — leidinn af Loka sem stendur á bak við hann og bendir honum í áttina. Örin ferðast þvers yfir völlinn og leggur Baldur í hjel í þögn. Þetta er sorglegasta stundirnar í norrænum goðsögum — drápið á því sem var björtast og bezt í heiminum." };
          } else if (chapter.title === 'Kafli 5 — Leiðin til Heljar') {
            if (i === 3) img = { src: "/gylf-ch5-baldur-funeral.png", cap: "Bálför Baldurs á skipi hans, Hringhorni — stærsta skipi í heimi. Risakonan Hyrrokkin kom á vargi sínum og ýtti skipinu af landi með slíkum þunga að jörðin skalf. Guðirnir stóðu á bökkum og horfðu á eldinn gleypa það besta sem þeir höfðu þekkt. Óðinn beygði sig og hvíslaði lokungarorð í eyra sonar síns." };
            if (i === 6) img = { src: "/gylf-ch5-hermod-sleipnir.png", cap: "Hermóður ríður Sleipni, átta-fættu hesti Óðins, í fullum hlaupum í gegnum nótt Niflheims — heiminn undir heimunum. Engin kynnt vegur, engin ljós, aðeins þokudrykki og dauðar trjárrætur. Hann ríður í níu daga og níu nætur til þess að ná Helju." };
            if (i === 7) img = { src: "/gylf-ch5-gjoll-bridge.png", cap: "Gjallarbrú — brúin gullþökt yfir ána Gjöll — skiptir heimum lifenda og dauðra. Vörðurinn Móðguðr stöðvar Hermóð og spyr af hverju lifandi maður nálgist þennan stað. Hermóður útskýrir erindi sitt og er leyfður yfir — inn í land án endurkomu." };
            if (i === 10) img = { src: "/gylf-ch5-hel-throne.png", cap: "Í höllinni Éljúðnir tekur Hel á móti Hermóði. Hún er hálfur lifandi, hálfur dauður — ríkisstjóri þess sem á eftir kemur. Baldur situr við hliðina á henni, friðsær en fjarri. Hel gefur þá svörin: ef heimurinn grátur allt saman, kemur Baldur heim. En eitt grátur ekki." };
          } else if (chapter.title === 'Kafli 6 — Loki bundinn') {
            if (i === 5) img = { src: "/gylf-ch6-loki-net.png", cap: "Loki hefur falið sig sem lax í fossinum en guðirnir draga net yfir ána. Loka líður styttst þegar hann reynir að stökkva yfir netið — og þar er grep Þórs á baki hans. Þetta var listinni ástríðna Loka að teljast til: hann uppfinst sjálfur netið en gleymdi að nota það." };
            if (i === 10) img = { src: "/gylf-ch6-loki-bound.png", cap: "Loki er bundinn í hellinum með þörmunum úr eigin syni. Ormur er festur yfir höfuð hans og drýpur eitur á andlit hans. Sigyn, kona hans, situr við hlið hans og heldur skálinni. Hún getur ekki hugað að sér — aðeins að honum. Þegar skálin er full og hún fer að tæma hana, þjáist Loki óhindraðar. Þannig liður tíminn." };
          } else if (chapter.title === 'Kafli 7 — Merkin og það sem nálgast') {
            if (i === 2) img = { src: "/gylf-ch7-fimbulwinter.png", cap: "Fimbulvetr — þrír vetur í röð án þess að sumar komi á milli. Landið frýs, uppskera bregst, húsdýr deyja og fólk börðust sín í milli um það sem eftir er. Þetta eru fyrstu merkin um Ragnarök — þótt enginn þori að nefna það nafn." };
            if (i === 11) img = { src: "/gylf-ch7-naglfar.png", cap: "Naglfar — skip dauðra, smíðað úr nöglum og tánöglum hinna látnu. Af þessum sökum var mönnum tíðrætt um að skera nögl sín áður en þeir dóu — hvert nagl sem fór óskorinn í gröfina þjónaði sem byggingarefni á þessum fáránlega og skelfilega flota." };
          } else if (chapter.title === 'Kafli 8 — Ragnarök') {
            if (i === 3) img = { src: "/gylf-ch8-ragnarok.png", cap: "Ragnarök — endir heimsins eins og við þekktum hann. Fenrir gleypur Óðinn, Þór og Miðgarðsormur ráðast á hvorn annan í vígi þar sem báðir falla, Bifröst brotnar undir þyngd óvinarins. Þetta er ekki bardagi heldur umbreyting — heimurinn að ljúka einni söguhringferð." };
            if (i === 14) img = { src: "/gylf-ch8-surtur-fire.png", cap: "Surtur gengur loks yfir jörðina með logandi sverð í hendi — hann sem sat í Múspellsheimi alla tíð frá upphafi heimsins og beið þessa augnabliks. Hann brennir allt sem eftir er. Yggdrasill hreyfast en stendur enn einhvern tíma. Hafið gleypur jörðina." };
          } else if (chapter.title === 'Kafli 9 — Eftir eldinn') {
            if (i === 1) img = { src: "/gylf-ch9-new-earth.png", cap: "Jörðin rís úr hafinu að nýju — hrein og ósnertin, ferskari en hún hafði nokkurn tíma verið. Foss rennur þar sem eldurinn brunni. Þeir guðar sem lifðu af standa á hæð og horfa yfir heim sem er enn að verða til. Heimurinn endar ekki. Hann byrjar aftur." };
            if (i === 5) img = { src: "/gylf-ch9-baldur-returns.png", cap: "Baldur kemur aftur úr Hel, ásamt Höð bróður sínum. Þeir ganga í sólskin nýja heimsins. Í grasinu við fætur þeirra glitra gullnar töflur — leiktöflur hinna gömlu guða úr gullöld heimsins. Þær eru minnin sem heimurinn bar með sér yfir eldinn. Baldur er líflegt svar við þeirri spurningu: hvað er svo dýrmætt að það getur lifað jafnvel Ragnarök?" };
          } else if (chapter.title === 'BARÐSGÁTT') {
            if (i === 10) img = { src: "/bgatt-bone-mist.png", cap: "Þeir voru að grafa í gamla kirkjugarðinum þegar þeir fundu stórt lærleggsbein. Tappi úr tré sat í öðrum endanum. Um leið og maðurinn kippti tappanum úr, vall út dökk og köld gufa sem hvarf út í loftið. Gamli draugurinn, Barðsgátt, var llaus úr prísundinni." };
            if (i === 12) img = { src: "/bgatt-knife-bed.png", cap: "Séra Guðmundur lá í rúmi sínu um miðnætti þegar hann fann að eitthvað þreif í rúmfötin af illsku. Úr myrkrinu kastaði hann fram rauðskefta hnífnum sínum. Hann heyrði hann stingast í eitthvað — en morguninn eftir fannst hann ekki." };
          }

          return (
            <div key={i} className="para-block">
              <p title={annotateMode ? 'Klikka til að bæta við' : undefined}>{p}</p>
              {img && (
                <figure className="story-illustration-container">
                  <img src={img.src} className="story-illustration" alt="Mynd úr sögu" />
                  <figcaption className="story-caption">{img.cap}</figcaption>
                </figure>
              )}
            </div>
          );
        })}

        <div className="chapter-nav">
          <div>
            <button
              onClick={() => setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1))}
              disabled={currentChapterIndex === 0}
            >
              ← Fyrri kafli
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={isRead}
                onChange={() => toggleReadStatus(currentChapterIndex)}
              />
              Merkt lesið
            </label>
          </div>

          <div>
            <button
              onClick={() => setCurrentChapterIndex(Math.min(totalChapters - 1, currentChapterIndex + 1))}
              disabled={currentChapterIndex === totalChapters - 1}
              className={currentChapterIndex !== totalChapters - 1 ? 'btn-primary' : ''}
            >
              Næsti kafli →
            </button>
          </div>
        </div>
      </div>

      {/* Floating selection popup – always show when text is selected */}
      {selection && (
        <SelectionPopup
          selection={selection}
          readers={readers}
          onSubmit={handleAddEntry}
          onClose={() => {
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      )}
    </>
  );
}
