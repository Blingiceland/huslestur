import { writeFileSync } from 'fs';

async function main() {
  console.log('Sæki Völuspá frá Wikisource...');
  const res = await fetch('https://is.wikisource.org/w/api.php?action=parse&page=V%C3%B6lusp%C3%A1&format=json');
  const data = await res.json();
  const html = data.parse.text['*'];

  // Stanzas are inside <dl><dd>Line 1</dd><dd>Line 2</dd></dl>
  const stanzas = [];
  const dlRegex = /<dl>([\s\S]*?)<\/dl>/gi;
  let match;
  while ((match = dlRegex.exec(html)) !== null) {
    const rawDl = match[1];
    
    // Extract text from each <dd>
    const lines = [];
    const ddRegex = /<dd>([\s\S]*?)<\/dd>/gi;
    let ddMatch;
    while ((ddMatch = ddRegex.exec(rawDl)) !== null) {
      lines.push(ddMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    if (lines.length > 0) {
      stanzas.push(lines.join('\n'));
    }
  }

  // Create chapters of ~10 stanzas each
  const chapters = [];
  for (let i = 0; i < stanzas.length; i += 10) {
    chapters.push({
      number: (i / 10) + 1,
      title: `Kafli ${(i / 10) + 1} — Erindi ${i + 1}-${Math.min(i + 10, stanzas.length)}`,
      paragraphs: stanzas.slice(i, i + 10)
    });
  }

  writeFileSync('src/voluspa.json', JSON.stringify(chapters, null, 2), 'utf-8');
  console.log('Völuspá vistuð! Erindi:', stanzas.length);
}

main().catch(console.error);
