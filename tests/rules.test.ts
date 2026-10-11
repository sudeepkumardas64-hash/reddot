import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc, writeBatch, query, where, getDocs } from "firebase/firestore";

let env: RulesTestEnvironment;
const profile = { name: "Asha Rao", phone: "+919800000000", bloodType: "O-", city: "Mumbai", lat: 19.07, lng: 72.87, available: true, lastDonationDate: "" };
const request = (uid: string) => ({
  requesterId: uid, requesterName: "Asha", patientLabel: "R.K.", bloodType: "A+", units: 2, hospitalName: "KEM Hospital",
  hospitalAddress: "Parel", city: "Mumbai", lat: 19.0, lng: 72.84, urgency: "critical", status: "active", notes: "", createdAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-reddot", firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
});
beforeEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

const as = (uid: string) => env.authenticatedContext(uid).firestore();

describe("users (private)", () => {
  it("owner can write and read own profile", async () => {
    await assertSucceeds(setDoc(doc(as("alice"), "users/alice"), profile));
    await assertSucceeds(getDoc(doc(as("alice"), "users/alice")));
  });
  it("others cannot read a profile (phone, exact location)", async () => {
    await setDoc(doc(as("alice"), "users/alice"), profile);
    await assertFails(getDoc(doc(as("bob"), "users/alice")));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice")));
  });
  it("cannot self-assign verified", async () => {
    await assertFails(setDoc(doc(as("alice"), "users/alice"), { ...profile, verified: true }));
  });
  it("rejects invalid blood group", async () => {
    await assertFails(setDoc(doc(as("alice"), "users/alice"), { ...profile, bloodType: "Z+" }));
  });
});

describe("requests", () => {
  it("signed-in user can post own request", async () => {
    await assertSucceeds(addDoc(collection(as("alice"), "requests"), request("alice")));
  });
  it("cannot post on behalf of someone else", async () => {
    await assertFails(addDoc(collection(as("bob"), "requests"), request("alice")));
  });
  it("anonymous cannot read requests", async () => {
    await assertFails(getDocs(query(collection(env.unauthenticatedContext().firestore(), "requests"), where("status", "==", "active"))));
  });
  it("only requester can mark fulfilled, and only status changes", async () => {
    const ref = await addDoc(collection(as("alice"), "requests"), request("alice"));
    await assertFails(updateDoc(doc(as("bob"), "requests", ref.id), { status: "fulfilled" }));
    await assertFails(updateDoc(doc(as("alice"), "requests", ref.id), { units: 10 }));
    await assertSucceeds(updateDoc(doc(as("alice"), "requests", ref.id), { status: "fulfilled" }));
  });
});

describe("chat", () => {
  const thread = { participants: ["alice", "bob"], names: { alice: "Asha", bob: "Bala" }, requestId: "r1", lastMessage: "", updatedAt: serverTimestamp() };
  it("participants can create thread and send messages; outsiders cannot read", async () => {
    const bob = as("bob");
    await assertSucceeds(setDoc(doc(bob, "threads/alice_bob"), thread));
    const b = writeBatch(bob);
    b.set(doc(collection(bob, "threads/alice_bob/messages")), { senderId: "bob", text: "I can donate", createdAt: serverTimestamp() });
    b.update(doc(bob, "threads/alice_bob"), { lastMessage: "I can donate", updatedAt: serverTimestamp() });
    await assertSucceeds(b.commit());
    await assertSucceeds(getDocs(collection(as("alice"), "threads/alice_bob/messages")));
    await assertFails(getDocs(collection(as("eve"), "threads/alice_bob/messages")));
    await assertFails(getDoc(doc(as("eve"), "threads/alice_bob")));
  });
  it("cannot create a thread for two other people or with a mismatched id", async () => {
    await assertFails(setDoc(doc(as("eve"), "threads/alice_bob"), thread));
    await assertFails(setDoc(doc(as("bob"), "threads/bob_alice"), thread));
  });
  it("cannot impersonate sender", async () => {
    await setDoc(doc(as("bob"), "threads/alice_bob"), thread);
    await assertFails(addDoc(collection(as("bob"), "threads/alice_bob/messages"), { senderId: "alice", text: "hi", createdAt: serverTimestamp() }));
  });
});
