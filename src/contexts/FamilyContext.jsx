/**
 * FamilyContext -- geymir og samstillir fjolskyldugogn vid Firestore.
 *
 * Firestore uppbygging:
 *   families/{uid}/ - fjolskylduskjal med name, members[], shareCode
 *   shares/{shareCode} - uppflettiskjal med { uid }
 *   families/{uid}/progress/{bookId}
 *   families/{uid}/notes/{bookId}
 *   families/{uid}/qna/{bookId}
 *   families/{uid}/annotations/{bookId}
 *   families/{uid}/recordings/{autoId}
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FamilyContext = createContext(null);

// Bua til 6-stafa koda
function generateShareCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function FamilyProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [family,        setFamily]        = useState(null);
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [childMode,     setChildMode]     = useState(null);   // { uid, reader } ef barn er innskrad
  const [familyUid,     setFamilyUid]     = useState(null);   // uid sem er i notkun (foreldri eda barn)
  const [targetRoute,   setTargetRoute]   = useState(null);

  // Ef barn opnar /lesa/XXXXXX eða /lesa/XXXXXX/bók/kafli link
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/lesa\/([A-Z0-9]{6})(?:\/([^/]+))?(?:\/(\d+))?$/i);
    
    if (match) {
      const code = match[1].toUpperCase();
      if (match[2]) {
        setTargetRoute({ bookId: match[2], chapterIndex: match[3] ? parseInt(match[3], 10) : 0 });
      }

      // Fletta upp shareCode
      getDoc(doc(db, 'shares', code)).then(snap => {
        if (snap.exists()) {
          const parentUid = snap.data().uid;
          setFamilyUid(parentUid);
          // Saekja fjolskyldu
          getDoc(doc(db, 'families', parentUid)).then(fSnap => {
            if (fSnap.exists()) {
              setFamily(fSnap.data());
              setChildMode({ uid: parentUid, reader: null, shareCode: code });
            }
            setLoadingFamily(false);
          });
        } else {
          setLoadingFamily(false);
        }
      });
      return;
    }
  }, []);

  // Hlusta a fjolskylduskjal i rauntima (for parent)
  useEffect(() => {
    if (childMode) return; // barn notar ekki listener
    if (!uid) { setFamily(null); setLoadingFamily(false); return; }
    setLoadingFamily(true);
    setFamilyUid(uid);
    const ref = doc(db, 'families', uid);
    const unsub = onSnapshot(ref, (snap) => {
      setFamily(snap.exists() ? snap.data() : null);
      setLoadingFamily(false);
    });
    return unsub;
  }, [uid, childMode]);

  // activeUid = foreldri eda barnagatt uid
  const activeUid = childMode?.uid || uid;

  // Bua til fjolskyldu eftir fyrstu innskraningu
  const createFamily = async (familyName, memberNames) => {
    if (!uid) return;
    const shareCode = generateShareCode();
    await setDoc(doc(db, 'families', uid), {
      name: familyName,
      members: memberNames,
      shareCode,
      ownerEmail: user.email,
      ownerName: user.displayName,
      createdAt: serverTimestamp(),
    });
    // Vista share code uppflettiskjal
    await setDoc(doc(db, 'shares', shareCode), { uid });
  };

  const updateMembers = async (members) => {
    if (!activeUid) return;
    await updateDoc(doc(db, 'families', activeUid), { members });
  };

  // Hjalparfall til ad lesa undirskjal
  const subRef = (coll, bookId) =>
    doc(db, 'families', activeUid, coll, bookId);

  // -- Lesframgangur --
  const getProgress = useCallback(async (bookId) => {
    if (!activeUid) return {};
    const snap = await getDoc(subRef('progress', bookId));
    return snap.exists() ? (snap.data().readStatus ?? {}) : {};
  }, [activeUid]);

  const setReadStatus = async (bookId, readStatus) => {
    if (!activeUid) return;
    await setDoc(subRef('progress', bookId), { readStatus }, { merge: true });
  };

  // -- Glosur --
  const getNotes = useCallback(async (bookId) => {
    if (!activeUid) return {};
    const snap = await getDoc(subRef('notes', bookId));
    return snap.exists() ? (snap.data().notesDict ?? {}) : {};
  }, [activeUid]);

  const saveNotes = async (bookId, notesDict) => {
    if (!activeUid) return;
    await setDoc(subRef('notes', bookId), { notesDict }, { merge: true });
  };

  // -- Spurningar (Q&A) --
  const getQna = useCallback(async (bookId) => {
    if (!activeUid) return {};
    const snap = await getDoc(subRef('qna', bookId));
    return snap.exists() ? (snap.data().qnaDict ?? {}) : {};
  }, [activeUid]);

  const saveQna = async (bookId, qnaDict) => {
    if (!activeUid) return;
    await setDoc(subRef('qna', bookId), { qnaDict }, { merge: true });
  };

  // -- Athugasemdir --
  const getAnnotations = useCallback(async (bookId) => {
    if (!activeUid) return {};
    const snap = await getDoc(subRef('annotations', bookId));
    return snap.exists() ? (snap.data().familyDict ?? {}) : {};
  }, [activeUid]);

  const saveAnnotations = async (bookId, familyDict) => {
    if (!activeUid) return;
    await setDoc(subRef('annotations', bookId), { familyDict }, { merge: true });
  };

  // Set child reader name
  const pickChildReader = (name) => {
    if (childMode) setChildMode({ ...childMode, reader: name });
  };

  // Fa share link (med valkvaemum bok/kafla)
  const getShareLink = (bookId = null, chapterIndex = null) => {
    if (!family?.shareCode) return null;
    const origin = window.location.origin;
    let url = `${origin}/lesa/${family.shareCode}`;
    if (bookId) {
      url += `/${bookId}`;
      if (chapterIndex !== null) url += `/${chapterIndex}`;
    }
    return url;
  };

  return (
    <FamilyContext.Provider value={{
      family, loadingFamily, createFamily, updateMembers,
      getProgress, setReadStatus,
      getNotes, saveNotes,
      getQna, saveQna,
      getAnnotations, saveAnnotations,
      childMode, pickChildReader, getShareLink,
      targetRoute, setTargetRoute,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
