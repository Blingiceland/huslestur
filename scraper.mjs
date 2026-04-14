import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';

const INDEXES = [
  { url: 'https://www.snerpa.is/net/isl/isl.htm', category: 'Íslendingasögur', base: 'https://www.snerpa.is/net/isl/' },
];


const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPage(url) {
  try {
    await delay(1000); // Bíða í smá stund til að verða ekki blockaður
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
    const html = await res.text();
    return cheerio.load(html);
  } catch (error) {
    console.error(`Gat ekki sótt ${url}:`, error.message);
    return null;
  }
}

async function scrapeAll() {
  const allStories = [];

  for (const idx of INDEXES) {
    console.log(`\n============================`);
    console.log(`Leita í flokki: ${idx.category} (${idx.url})`);
    const $ = await fetchPage(idx.url);
    if (!$) continue;

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      
      // Finna alla hlekki sem enda á .htm
      if (href && href.endsWith('.htm') && title && !href.includes('../')) {
         const cleanHref = href.startsWith('./') ? href.replace('./', '') : href;
         allStories.push({ title, url: idx.base + cleanHref, category: idx.category });
      }
    });
  }

  console.log(`\nFann ALLS ${allStories.length} sögur yfir alla flokkana! Byrja að sækja...`);
  
  if (allStories.length > 0) {
    for (let i = 0; i < allStories.length; i++) {
        await scrapeStory(allStories[i]);
    }
  }
}

async function scrapeStory(storyInfo) {
  const outDir = path.join(process.cwd(), 'scraped_data');
  if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
  }
  
  const filename = storyInfo.url.split('/').pop().replace('.htm', '.json');
  if (fs.existsSync(path.join(outDir, filename))) {
      console.log(`Sleppi ${storyInfo.title}, þegar til!`);
      return;
  }

  console.log(`\nSæki: ${storyInfo.title} (${storyInfo.url})`);
  const $ = await fetchPage(storyInfo.url);
  if (!$) return;

  // Finnum titilinn (oft í <title> eða <h2>)
  let docTitle = $('title').text().trim() || storyInfo.title;

  // Meginmálið er langoftast inní tvöföldu <BLOCKQUOTE>
  let contentHtml = $('blockquote blockquote').html();
  
  // Ef ekkert fannst inní blockquote, reynum við body beint
  if (!contentHtml) {
      contentHtml = $('body').html();
  }

  // Hreinsum HTMLið
  const paragraphs = [];
  if (contentHtml) {
    const $content = cheerio.load(contentHtml);

    // 1. Prófum fyrst <p> tög (Íslendingasögur nota þetta)
    $content('p').each((i, el) => {
      const text = $content(el).text().trim().replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
      if (text && text.length > 20) paragraphs.push(text);
    });

    // 2. Ef engar <p> tög, reynum text nodes beint
    if (paragraphs.length === 0) {
      $content('body').contents().each((i, el) => {
        if (el.type === 'text') {
          const text = $content(el).text().trim().replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
          if (text && text.length > 20) paragraphs.push(text);
        }
      });
    }

    // 3. Fallback: skipta öllu texta á \n\n
    if (paragraphs.length === 0) {
      const raw = $content.text().replace(/\n\s+/g, '\n').split('\n\n');
      raw.forEach(p => {
        const t = p.trim().replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
        if (t && t.length > 20) paragraphs.push(t);
      });
    }
  }

  // Post-processing: ef bara 1 löng málsgrein, skiptum á kafla-númerum eða \n
  if (paragraphs.length === 1 && paragraphs[0].length > 500) {
    const raw = paragraphs[0];
    // Skiptum á kaflanúmerum eins og "2. Þess er getið" osfrv.
    const chapterSplit = raw.split(/(?=\s\d{1,2}\.\s[A-ZÁÉÍÓÚÝÐÞÆÖ])/);
    if (chapterSplit.length > 2) {
      paragraphs.length = 0;
      chapterSplit.forEach(chunk => {
        const t = chunk.trim();
        if (t.length > 20) paragraphs.push(t);
      });
    } else {
      // Skiptum á hverjar ~1500 stafir við punkta
      paragraphs.length = 0;
      let remaining = raw;
      while (remaining.length > 1800) {
        let cutAt = remaining.lastIndexOf('. ', 1800);
        if (cutAt < 500) cutAt = remaining.lastIndexOf(' ', 1800);
        if (cutAt < 0) cutAt = 1800;
        paragraphs.push(remaining.slice(0, cutAt + 1).trim());
        remaining = remaining.slice(cutAt + 1).trim();
      }
      if (remaining.length > 20) paragraphs.push(remaining);
    }
  }


  const result = {
      title: docTitle,
      source: storyInfo.url,
      category: storyInfo.category,
      paragraphs: paragraphs
  };

  fs.writeFileSync(path.join(outDir, filename), JSON.stringify(result, null, 2), 'utf8');
  console.log(`Vistaði ${result.paragraphs.length} málsgreinar í scraped_data/${filename}`);
}

scrapeAll();
