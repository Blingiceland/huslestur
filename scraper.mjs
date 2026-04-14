import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';

const INDEXES = [
  { url: 'https://www.snerpa.is/net/thjod/aevin.htm', category: 'Íslensk ævintýri', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/hans.htm', category: 'H.C. Andersen', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/alfa.htm', category: 'Huldufólk & Álfar', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/saga.htm', category: 'Sögur af sögulegum atburðum', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/kima.htm', category: 'Kímnisögur', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/nyr.htm', category: 'Nýrri þjóðsögur', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/draug.htm', category: 'Draugasögur', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/gald.htm', category: 'Galdrasögur', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/natt.htm', category: 'Náttúrusögur', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/thjod/tru.htm', category: 'Trúarsögur', base: 'https://www.snerpa.is/net/thjod/' },
  { url: 'https://www.snerpa.is/net/fornrit.htm', category: 'Fornrit', base: 'https://www.snerpa.is/net/' },
  { url: 'https://www.snerpa.is/net/kv.htm', category: 'Kvæði', base: 'https://www.snerpa.is/net/' },
  { url: 'https://www.snerpa.is/net/roman/roman.htm', category: 'Skáldsögur', base: 'https://www.snerpa.is/net/roman/' },
  { url: 'https://www.snerpa.is/net/sma/sma.htm', category: 'Smásögur', base: 'https://www.snerpa.is/net/sma/' },
  { url: 'https://www.snerpa.is/net/1001/1001.htm', category: 'Þúsund og ein nótt', base: 'https://www.snerpa.is/net/1001/' },
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
      // Brjóta niður á <p> eða <br><br>
      $content('body').contents().each((i, el) => {
          if (el.type === 'text') {
              const text = $(el).text().trim().replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
              if (text) {
                  paragraphs.push(text);
              }
          } else if (el.tagName === 'p') {
              const text = $(el).text().trim().replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
              if (text) paragraphs.push(text);
          }
      });
      // Ef ofangreint skilar tómu grípum við allt
      if (paragraphs.length === 0) {
         let raw = $content.text().replace(/\n\s+/g, '\n').split('\n\n');
         raw.forEach(p => {
             const t = p.trim().replace(/\n/g, ' ');
             if(t) paragraphs.push(t);
         });
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
