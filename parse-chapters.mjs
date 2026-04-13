import fs from 'fs';

const html = fs.readFileSync('output.html', 'utf-8');

// Splitting logic: Look for <p><strong>Kafli
const chapterSections = html.split('<p><strong>Kafli ');
// The first element is before Kafli 1, usually empty or prologue.
chapterSections.shift();

const chapters = chapterSections.map(section => {
  // section looks like: `1 — Áður en heimurinn var</strong></p><p>...</p>`
  const titleEndIndex = section.indexOf('</strong></p>');
  const titlePart = section.substring(0, titleEndIndex).trim(); // "1 — Áður en heimurinn var"
  const contentHtml = section.substring(titleEndIndex + '</strong></p>'.length);
  
  // Extract paragraphs
  const paragraphs = contentHtml
    .split('<p>')
    .filter(p => p.trim() !== '')
    .map(p => p.replace('</p>', '').trim())
    // Exclude 'Top of Form' / 'Bottom of Form' from word doc artifacts
    .filter(p => p !== 'Top of Form' && p !== 'Bottom of Form' && p !== '');

  return {
    title: 'Kafli ' + titlePart,
    paragraphs: paragraphs
  };
});

fs.writeFileSync('src/chapters.json', JSON.stringify(chapters, null, 2));
console.log('Successfully wrote src/chapters.json');
