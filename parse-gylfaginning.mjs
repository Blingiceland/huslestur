/**
 * parse-gylfaginning.mjs
 * Parses the Gylfaginning text from the fetched content.md file
 * and writes chapters.json to src/
 */
import fs from 'fs';
import path from 'path';

const contentPath = process.argv[2] || 'gylfaginning-source.txt';
const raw = fs.readFileSync(contentPath, 'utf-8');

// Split on chapter headings like "7. kafli\n" or "46 kafli\n"
// Some have a period, some don't
const chapterRegex = /^(\d+)\.?\s*kafli\s*$/gm;

const matches = [...raw.matchAll(chapterRegex)];

const chapters = [];

for (let i = 0; i < matches.length; i++) {
  const match = matches[i];
  const num = parseInt(match[1], 10);
  const start = match.index + match[0].length;
  const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;

  const body = raw.slice(start, end).trim();

  // Split into paragraphs on blank lines or line breaks
  const paragraphs = body
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && l !== '---');

  if (paragraphs.length > 0) {
    chapters.push({ number: num, title: `${num}. kafli`, paragraphs });
  }
}

console.log(`Parsed ${chapters.length} chapters.`);

fs.writeFileSync(
  path.join('src', 'chapters.json'),
  JSON.stringify(chapters, null, 2),
  'utf-8'
);

console.log('Written to src/chapters.json');
