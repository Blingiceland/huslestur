/**
 * FamilyContext – geymir og samstillir fjölskyldugögn við Firestore.
 *
 * Firestore uppbygging:
 *   families/{uid}/
 *     name: string
 *     members: string[]          ← nöfn barna
 *     createdAt: timestamp
 *
 *   families/{uid}/progress/{bookId}
 *     readStatus: { [idx]: boolean }
 *
 *   families/{uid}/notes/{bookId}
 *     text: string
 *
 *   families/{uid}/qna/{bookId}
 *     questions: [{question, answer, timestamp}]
 *
 *   families/{uid}/annotations/{bookId}
 *     entries: [{id, text, who, quote, isQuestion}]
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [family,      setFamily]      = useState(null);   // { name, members[] }
  const [loadingFamily, setLoadingFamily] = useState(true);

  // Hlusta á fjölskylduskjal í rauntíma
  useEffect(() => {
    if (!uid) { setFamily(null); setLoadingFamily(false); return; }
    setLoadingFamily(true);
    const ref = doc(db, 'families', uid);
    const unsub = onSnapshot(ref, (snap) => {
      setFamily(snap.exists() ? snap.data() : null);
      setLoadingFamily(false);
    });
    return unsub;
  }, [uid]);

  // Búa til fjölskyldu eftir fyrstu innskráningu
  const createFamily = async (familyName, memberNames) => {
    if (!uid) return;
    await setDoc(doc(db, 'families', uid), {
      name: familyName,
      members: memberNames,
      ownerEmail: user.email,
      ownerName: user.displayName,
      createdAt: serverTimestamp(),
    });
  };

  const updateMembers = async (members) => {
    if (!uid) return;
    await updateDoc(doc(db, 'families', uid), { members });
  };

  // ── Hjálparfall til að lesa undirskjal ───────────────────────
  const subRef = (collection, bookId) =>
    doc(db, 'families', uid, collection, bookId);

  // ── Lesframgangur ────────────────────────────────────────────
  const getProgress = useCallback(async (bookId) => {
    if (!uid) return {};
    const snap = await getDoc(subRef('progress', bookId));
    return snap.exists() ? (snap.data().readStatus ?? {}) : {};
  }, [uid]);

  const setReadStatus = async (bookId, readStatus) => {
    if (!uid) return;
    await setDoc(subRef('progress', bookId), { readStatus }, { merge: true });
  };

  // ── Glósur ───────────────────────────────────────────────────
  const getNotes = useCallback(async (bookId) => {
    if (!uid) return {};
    const snap = await getDoc(subRef('notes', bookId));
    return snap.exists() ? (snap.data().notesDict ?? {}) : {};
  }, [uid]);

  const saveNotes = async (bookId, notesDict) => {
    if (!uid) return;
    await setDoc(subRef('notes', bookId), { notesDict }, { merge: true });
  };

  // ── Spurningar (Q&A) ─────────────────────────────────────────
  const getQna = useCallback(async (bookId) => {
    if (!uid) return {};
    const snap = await getDoc(subRef('qna', bookId));
    return snap.exists() ? (snap.data().qnaDict ?? {}) : {};
  }, [uid]);

  const saveQna = async (bookId, qnaDict) => {
    if (!uid) return;
    await setDoc(subRef('qna', bookId), { qnaDict }, { merge: true });
  };

  // ── Athugasemdir (annotations) ───────────────────────────────
  const getAnnotations = useCallback(async (bookId) => {
    if (!uid) return {};
    const snap = await getDoc(subRef('annotations', bookId));
    return snap.exists() ? (snap.data().familyDict ?? {}) : {};
  }, [uid]);

  const saveAnnotations = async (bookId, familyDict) => {
    if (!uid) return;
    await setDoc(subRef('annotations', bookId), { familyDict }, { merge: true });
  };

  return (
    <FamilyContext.Provider value={{
      family, loadingFamily, createFamily, updateMembers,
      getProgress, setReadStatus,
      getNotes, saveNotes,
      getQna, saveQna,
      getAnnotations, saveAnnotations,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
