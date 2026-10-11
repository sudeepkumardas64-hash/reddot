import {
  addDoc,
  collection,

  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { fuzz } from "./blood";
import type { BloodRequest, ChatMessage, DonorCard, Thread, UserProfile } from "./types";

// ---------- Profile ----------

export function useProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  useEffect(() => {
    if (!uid) return setProfile(undefined);
    return onSnapshot(
      doc(db, "users", uid),
      (s) => setProfile(s.exists() ? (s.data() as UserProfile) : null),
      () => setProfile(null),
    );
  }, [uid]);
  return profile;
}

export async function saveProfile(uid: string, p: Omit<UserProfile, "createdAt" | "updatedAt">, isNew: boolean) {
  const batch = writeBatch(db);
  batch.set(
    doc(db, "users", uid),
    { ...p, updatedAt: serverTimestamp(), ...(isNew ? { createdAt: serverTimestamp() } : {}) },
    { merge: true },
  );
  const card: Omit<DonorCard, "updatedAt"> = {
    displayName: p.name.trim().split(/\s+/)[0] || "Donor",
    bloodType: p.bloodType,
    city: p.city,
    approxLat: fuzz(p.lat),
    approxLng: fuzz(p.lng),
    available: p.available,
    lastDonationDate: p.lastDonationDate,
  };
  batch.set(doc(db, "donors", uid), { ...card, updatedAt: serverTimestamp() });
  await batch.commit();
}

export async function deleteMyData(uid: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", uid));
  batch.delete(doc(db, "donors", uid));
  await batch.commit();
}

// ---------- Donors ----------

export function useDonors(enabled: boolean) {
  const [donors, setDonors] = useState<(DonorCard & { id: string })[]>([]);
  useEffect(() => {
    if (!enabled) return;
    const q = query(collection(db, "donors"), where("available", "==", true), limit(500));
    return onSnapshot(q, (s) => setDonors(s.docs.map((d) => ({ id: d.id, ...(d.data() as DonorCard) }))));
  }, [enabled]);
  return donors;
}

// ---------- Requests ----------

export function useActiveRequests(enabled: boolean) {
  const [requests, setRequests] = useState<BloodRequest[] | undefined>(undefined);
  const [error, setError] = useState<string>("");
  useEffect(() => {
    if (!enabled) return;
    const q = query(collection(db, "requests"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(200));
    return onSnapshot(
      q,
      (s) => setRequests(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BloodRequest, "id">) }))),
      (e) => setError(e.message),
    );
  }, [enabled]);
  return { requests, error };
}

export type NewRequest = Omit<BloodRequest, "id" | "requesterId" | "status" | "createdAt">;

export async function createRequest(uid: string, r: NewRequest) {
  return addDoc(collection(db, "requests"), { ...r, requesterId: uid, status: "active", createdAt: serverTimestamp() });
}

export async function closeRequest(id: string, status: "fulfilled" | "cancelled") {
  return updateDoc(doc(db, "requests", id), { status });
}

// ---------- Chat ----------

export function threadIdFor(a: string, b: string) {
  return [a, b].sort().join("_");
}

export async function openThread(me: string, myName: string, other: string, otherName: string, requestId: string) {
  const id = threadIdFor(me, other);
  const ref = doc(db, "threads", id);
  const existing = await getDoc(ref).catch(() => null);
  if (!existing?.exists()) {
    await setDoc(ref, {
      participants: [me, other].sort(),
      names: { [me]: myName, [other]: otherName },
      requestId,
      lastMessage: "",
      updatedAt: serverTimestamp(),
    });
  }
  return id;
}

export function useThreads(uid: string) {
  const [threads, setThreads] = useState<Thread[]>([]);
  useEffect(() => {
    const q = query(collection(db, "threads"), where("participants", "array-contains", uid), orderBy("updatedAt", "desc"), limit(100));
    return onSnapshot(q, (s) => setThreads(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Thread, "id">) }))));
  }, [uid]);
  return threads;
}

export function useMessages(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    const q = query(collection(db, "threads", threadId, "messages"), orderBy("createdAt", "asc"), limit(500));
    return onSnapshot(q, (s) => setMessages(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))));
  }, [threadId]);
  return messages;
}

export async function sendMessage(threadId: string, uid: string, text: string) {
  const clean = text.trim().slice(0, 1000);
  if (!clean) return;
  const batch = writeBatch(db);
  batch.set(doc(collection(db, "threads", threadId, "messages")), { senderId: uid, text: clean, createdAt: serverTimestamp() });
  batch.update(doc(db, "threads", threadId), { lastMessage: clean.slice(0, 120), updatedAt: serverTimestamp() });
  await batch.commit();
}

