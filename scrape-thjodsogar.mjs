/**
 * scrape-thjodsogar-v2.mjs
 *
 * Sækir ALLAR íslenskar þjóðsögur frá netutgafan.snerpa.is með flokkaskipan:
 *   Álfar og huldufólk, Draugar, Galdrar, Kímnisögur, Tröll,
 *   Helgisögur, Sjósögur, Útilegumannasögur, Viðburðasögur, Ýmislegt
 *
 * Keyrsla:  node scrape-thjodsogar-v2.mjs
 *
 * Textarnir eru safnaðir þjóðsögur Jóns Árnasonar (1862-64) o.fl.
 * — allar án höfundarréttar (public domain). Vistast á okkar
 * eigin geymslu í src/thjodsogar.json.
 */

import { writeFileSync } from 'fs';
import { setTimeout as delay } from 'timers/promises';

const BASE      = 'https://netutgafan.snerpa.is';
const INDEX_URL = 'https://netutgafan.snerpa.is/thjod/thjod.htm';

// ── Category definitions (order and emoji for UI) ────────────────
const CATEGORY_META = {
  'alfa.htm':  { label: 'Álfar og huldufólk', emoji: '🌿', slug: 'alfar' },
  'draug.htm': { label: 'Draugar',             emoji: '👻', slug: 'draugar' },
  'galdr.htm': { label: 'Galdrar',             emoji: '🔮', slug: 'galdrar' },
  'kimni.htm': { label: 'Kímnisögur',          emoji: '😄', slug: 'kimni' },
  'troll.htm': { label: 'Tröll',               emoji: '🏔️', slug: 'troll' },
  'efra.htm':  { label: 'Helgisögur',          emoji: '⛪', slug: 'helgi' },
  'sjo.htm':   { label: 'Úr sjó og vötnum',    emoji: '🌊', slug: 'sjovar' },
  'util.htm':  { label: 'Útilegumannasögur',   emoji: '🌲', slug: 'util' },
  'vidb.htm':  { label: 'Viðburðasögur',       emoji: '📜', slug: 'vidbudir' },
  'ymisl.htm': { label: 'Ýmislegt',            emoji: '✨', slug: 'ymisl' },
};

// ── Helpers ──────────────────────────────────────────────────────

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
  return res.text();
}

/** Strip HTML tags, collapse whitespace, decode entities */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;?/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract all story links from a category index page */
function parseCategoryIndex(html, catBase) {
  const links = [];
  const re = /href=[\"']([^\"'#]*\.htm)[\"']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    // Skip category pages themselves and the main index
    const filename = href.split('/').pop();
    if (Object.keys(CATEGORY_META).includes(filename)) continue;
    if (filename === 'thjod.htm' || filename === 'alfa.htm') continue; // alpha-index skip

    let url;
    if (href.startsWith('http')) url = href;
    else if (href.startsWith('/')) url = BASE + href;
    else url = catBase + href;

    if (!links.includes(url)) links.push(url);
  }
  return links;
}

/** Extract title and paragraphs from a story page */
function parsePage(html) {
  // Title from <title> or <h2>
  let title = '';
  const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleM) title = titleM[1].trim();
  const h2M = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2M) title = stripHtml(h2M[1]).trim();

  // Body text
  const bodyM = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyM ? bodyM[1] : html;
  const cleaned = bodyHtml
    .replace(/<(script|style|nav|header|footer)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const raw = stripHtml(cleaned);

  const paragraphs = raw
    .split('\n\n')
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(p =>
      p.length > 20 &&
      !p.startsWith('©') &&
      !p.includes('snerpa.is') &&
      !/^(heim|til baka|back)/i.test(p)
    );

  return { title, paragraphs };
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('Sæki yfirlit yfir flokka…\n');

  const indexHtml = await fetchHtml(INDEX_URL);
  const catBase   = 'https://netutgafan.snerpa.is/thjod/';

  // Find category links in main index
  const catRe = /href=[\"']([^\"'#]*\.htm)[\"']/gi;
  const categoryUrls = [];
  let m;
  while ((m = catRe.exec(indexHtml)) !== null) {
    const href = m[1];
    const filename = href.split('/').pop();
    if (CATEGORY_META[filename]) {
      const url = href.startsWith('http') ? href : catBase + href;
      if (!categoryUrls.find(c => c.filename === filename)) {
        categoryUrls.push({ filename, url, meta: CATEGORY_META[filename] });
      }
    }
  }

  console.log(`Fann ${categoryUrls.length} flokka:\n${categoryUrls.map(c => `  ${c.meta.emoji} ${c.meta.label}`).join('\n')}\n`);

  const categories = [];
  const seenUrls = new Set();
  let totalOk = 0, totalFail = 0;

  for (const cat of categoryUrls) {
    console.log(`\n── ${cat.meta.emoji} ${cat.meta.label} ──`);

    const catHtml  = await fetchHtml(cat.url);
    const storyUrls = parseCategoryIndex(catHtml, catBase);
    console.log(`  ${storyUrls.length} sögur`);

    const stories = [];

    for (let i = 0; i < storyUrls.length; i++) {
      const url  = storyUrls[i];
      const slug = url.split('/').pop().replace('.htm', '');

      // Some stories appear in multiple categories — include text only once
      if (seenUrls.has(url)) {
        // Still add a reference to this category with the title we already have
        process.stdout.write(`  [${i+1}/${storyUrls.length}] ${slug} (þegar sótt)\n`);
        stories.push({ id: slug, duplicate: true });
        continue;
      }
      seenUrls.add(url);

      process.stdout.write(`  [${i+1}/${storyUrls.length}] ${slug}…`);
      try {
        const html = await fetchHtml(url);
        const { title, paragraphs } = parsePage(html);

        if (!paragraphs.length) {
          process.stdout.write(' (tóm)\n');
          totalFail++;
          continue;
        }

        stories.push({ id: slug, title: title || slug, paragraphs, source: url });
        process.stdout.write(` ✓ (${paragraphs.length} mlsgr.)\n`);
        totalOk++;

        if (i < storyUrls.length - 1) await delay(200);
      } catch (err) {
        process.stdout.write(` ✗ ${err.message}\n`);
        totalFail++;
      }
    }

    categories.push({
      slug:   cat.meta.slug,
      label:  cat.meta.label,
      emoji:  cat.meta.emoji,
      stories: stories.filter(s => !s.duplicate),
    });
  }

  const out = 'src/thjodsogar.json';
  writeFileSync(out, JSON.stringify(categories, null, 2), 'utf-8');

  const storyCount = categories.reduce((s, c) => s + c.stories.length, 0);
  console.log(`\n✅ Lokið! ${storyCount} sögur í ${categories.length} flokkum vistaðar í ${out}`);
  console.log(`   (${totalFail} misheppnuðust)`);
}

main().catch(err => { console.error(err); process.exit(1); });
