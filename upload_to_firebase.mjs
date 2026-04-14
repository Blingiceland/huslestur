import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Sækja breytur úr .env.local
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
  console.log(`Fann ${files.length} sögur, byrja upphal í "library"...`);

  let count = 0;
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const story = JSON.parse(raw);

    // Búum til einstakt auðkenni úr skráarnafninu (t.d. "asm-kong" án .json)
    const bookId = file.replace('.json', '');

    try {
      // Setjum söguna upp í /library/{bookId}
      await setDoc(doc(db, 'library', bookId), {
        id: bookId,
        title: story.title,
        sourceUrl: story.source,
        category: story.category || 'Íslensk ævintýri',
        chapters: [
          {
            title: story.title,
            paragraphs: story.paragraphs
          }
        ],
        uploadedAt: new Date().toISOString()
      });
      console.log(`✅ Upphalaði: ${story.title} í flokk: ${story.category || 'Íslensk ævintýri'}`);
      count++;
    } catch (e) {
      console.error(`❌ Gat ekki uploadað ${story.title}:`, e.message);
    }
  }

  console.log(`\n🎉 Klárað! Hlöðum upp ${count} sögum í Firebase.`);
  process.exit(0);
}

uploadLibrary();
