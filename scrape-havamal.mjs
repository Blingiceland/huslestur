import { writeFileSync } from 'fs';

async function fetchText(url) {
  const res = await fetch(url);
  return res.text();
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  console.log('Sæki Hávamál...');
  const html = await fetchText('https://www.snerpa.is/net/kvaedi/havamal.htm');
  
  // Extract just the body text inside the page to avoid nav elements
  const bodyM = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let text = stripHtml(bodyM ? bodyM[1] : html);
  
  // We notice the sections are separated by roman numerals in the raw text, e.g. "II. Mansöngur"
  // Let's just find the indexes of the roman numerals.

  const sections = [
    { num: 1, title: 'I. Gestaþáttur', startStr: '1. Gáttir', endStr: 'II. Mansöngur' },
    { num: 2, title: 'II. Mansöngur', startStr: '84. Meyjar orðum', endStr: 'III. Heilræði' },
    { num: 3, title: 'III. Heilræði', startStr: '111. Mál er að þylja', endStr: 'IV. Píslir og rúnir' },
    { num: 4, title: 'IV. Píslir og rúnir', startStr: '138. Veit eg að eg hékk', endStr: 'V. Galdur' },
    { num: 5, title: 'V. Galdur', startStr: '146. Ljóð eg þau kann', endStr: 'VI. Ljóðalok' },
    { num: 6, title: 'VI. Ljóðalok', startStr: '164. Nú eru Háva mál kveðin', endStr: null }
  ];

  let chapters = [];

  for (let s of sections) {
    let startIdx = text.indexOf(s.startStr);
    let endIdx = s.endStr ? text.indexOf(s.endStr) : text.length;

    let partText = text.substring(startIdx, endIdx);

    // Split part into stanzas by matching patterns like `12. ` or `111. ` at the start of a line
    // We will just split on `\n\n` because blockquotes are separated or numbers are separated...
    // Actually, splitting by regex `\n(?=\d+\. )` is safest.
    
    let stanzasRaw = partText.split(/\n(?=\d+\.\s)/g);
    
    let paragraphs = stanzasRaw
      .map(st => st.replace(/\n(?!\n)/g, '\n').trim()) // keep newlines between verses
      .filter(st => st.length > 5);

    chapters.push({
      number: s.num,
      title: s.title,
      paragraphs: paragraphs
    });
  }

  writeFileSync('src/havamal.json', JSON.stringify(chapters, null, 2), 'utf-8');
  console.log('Klár! Vistaði Hávamál (6 hlutar).');
}

main().catch(console.error);
