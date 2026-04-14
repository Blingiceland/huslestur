import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadLibrary() {
  const dataDir = path.join(process.cwd(), 'scraped_data');
  if (!fs.existsSync(dataDir)) {
    console.error('Fann ekki scraped_data möppuna!');
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  console.log(`\nFann ${files.length} skrár í scraped_data/`);

  // Lesa og sía út tómar sögur (< 3 málsgreinar)
  const stories = [];
  const skipped = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const story = JSON.parse(raw);
    if (!story.paragraphs || story.paragraphs.length < 3) {
      skipped.push(file);
    } else {
      stories.push({ file, story });
    }
  }

  // Sýna yfirlit eftir flokkum
  const catMap = {};
  for (const { story } of stories) {
    const cat = story.category || 'Óþekkt';
    catMap[cat] = (catMap[cat] || 0) + 1;
  }
  console.log('\n📚 Sögur eftir flokkum:');
  for (const [cat, n] of Object.entries(catMap).sort()) {
    console.log(`   ${cat}: ${n} sögur`);
  }
  console.log(`\n⏩ Sleppir ${skipped.length} tómum skrám`);
  console.log(`\n🚀 Byrja að hlaða upp ${stories.length} sögum...\n`);

  let count = 0;
  let skippedExisting = 0;
  for (const { file, story } of stories) {
    const bookId = file.replace('.json', '');

    // Sleppa ef þegar til í Firebase
    const existing = await getDoc(doc(db, 'library', bookId));
    if (existing.exists()) {
      skippedExisting++;
      continue;
    }

    try {
      await setDoc(doc(db, 'library', bookId), {
        id: bookId,
        title: story.title,
        sourceUrl: story.source,
        category: story.category || 'Íslensk ævintýri',
        chapters: [{ title: story.title, paragraphs: story.paragraphs }],
        uploadedAt: new Date().toISOString()
      });
      count++;
      if (count % 10 === 0) console.log(`   ... ${count} sögur komnar upp`);
    } catch (e) {
      console.error(`❌ Villa: ${story.title}:`, e.message);
    }
  }

  console.log(`\n🎉 Klárað!`);
  console.log(`   ✅ Nýjar sögur: ${count}`);
  console.log(`   ⏩ Þegar til: ${skippedExisting}`);
  console.log(`   🗑  Tómar (sleppt): ${skipped.length}`);
  process.exit(0);
}

uploadLibrary();
