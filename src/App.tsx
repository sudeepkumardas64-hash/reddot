import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, firebaseConfigured } from "./lib/firebase";
import { useActiveRequests, useProfile, useThreads } from "./lib/data";
import { canDonateTo, distanceKm } from "./lib/blood";
import Login from "./components/Login";
import ProfileForm from "./components/ProfileForm";
import RequestFeed from "./components/RequestFeed";
import NewRequestForm from "./components/NewRequestForm";
import DonorFinder from "./components/DonorFinder";
import Chats from "./components/Chats";
import ChatView from "./components/ChatView";
import Me from "./components/Me";
import SetupNeeded from "./components/SetupNeeded";
import Logo from "./components/Logo";

type Tab = "requests" | "donors" | "chats" | "me";
const ALERT_RADIUS_KM = 50;

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => (firebaseConfigured ? onAuthStateChanged(auth, setUser) : undefined), []);
  const profile = useProfile(user?.uid);

  if (!firebaseConfigured) return <SetupNeeded />;
  if (user === undefined || (user && profile === undefined)) return <Splash />;
  if (!user) return <Login />;
  if (profile === null) return <ProfileForm uid={user.uid} initial={null} defaultName={user.displayName ?? ""} defaultPhone={user.phoneNumber ?? ""} />;
  return <Main user={user} profile={profile!} />;
}

function Splash() {
  return (
    <div className="splash">
      <Logo size={56} />
      <p className="muted">Loading…</p>
    </div>
  );
}

function Main({ user, profile }: { user: User; profile: NonNullable<ReturnType<typeof useProfile>> }) {
  const [tab, setTab] = useState<Tab>("requests");
  const [composing, setComposing] = useState(false);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  const { requests, error } = useActiveRequests(true);
  const threads = useThreads(user.uid);

  // Alert about new compatible requests that arrive while the app is open.
  const startedAt = useRef(Date.now());
  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (!requests) return;
    for (const r of requests) {
      if (seen.current.has(r.id)) continue;
      seen.current.add(r.id);
      const created = r.createdAt?.toMillis?.() ?? Date.now();
      if (created < startedAt.current || r.requesterId === user.uid) continue;
      if (!canDonateTo(profile.bloodType, r.bloodType)) continue;
      const km = distanceKm(profile.lat, profile.lng, r.lat, r.lng);
      if (km > ALERT_RADIUS_KM) continue;
      const msg = `${r.urgency === "critical" ? "CRITICAL: " : ""}${r.bloodType} needed at ${r.hospitalName} (${Math.round(km)} km)`;
      setToast(msg);
      if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification("Red.Dot — blood needed nearby", { body: msg, icon: import.meta.env.BASE_URL + "icon.svg" }); } catch { /* ignore */ }
      }
    }
  }, [requests, profile, user.uid]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  const matchCount = useMemo(
    () =>
      (requests ?? []).filter(
        (r) => r.requesterId !== user.uid && canDonateTo(profile.bloodType, r.bloodType) && distanceKm(profile.lat, profile.lng, r.lat, r.lng) <= ALERT_RADIUS_KM,
      ).length,
    [requests, profile, user.uid],
  );

  const goChat = (id: string) => {
    setOpenChat(id);
    setTab("chats");
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <Logo size={30} />
          <span>Red.Dot</span>
        </div>
        <nav className="toptabs" aria-label="Main">
          <TabButton t="requests" cur={tab} set={setTab} label="Requests" badge={matchCount} />
          <TabButton t="donors" cur={tab} set={setTab} label="Find donors" />
          <TabButton t="chats" cur={tab} set={setTab} label="Chats" />
          <TabButton t="me" cur={tab} set={setTab} label="Profile" />
        </nav>
        <button className="btn primary sm" onClick={() => setComposing(true)}>+ Request blood</button>
      </header>

      <main className="content">
        {tab === "requests" && (
          <RequestFeed requests={requests} error={error} me={user.uid} profile={profile} onChat={goChat} />
        )}
        {tab === "donors" && <DonorFinder me={user.uid} profile={profile} onChat={goChat} />}
        {tab === "chats" &&
          (openChat ? (
            <ChatView threadId={openChat} me={user.uid} thread={threads.find((t) => t.id === openChat)} onBack={() => setOpenChat(null)} />
          ) : (
            <Chats threads={threads} me={user.uid} onOpen={setOpenChat} />
          ))}
        {tab === "me" && <Me user={user} profile={profile} />}
      </main>

      <nav className="bottombar" aria-label="Main">
        <TabButton t="requests" cur={tab} set={setTab} label="Requests" icon="🩸" badge={matchCount} />
        <TabButton t="donors" cur={tab} set={setTab} label="Donors" icon="🔍" />
        <button className="fab" onClick={() => setComposing(true)} aria-label="Request blood">+</button>
        <TabButton t="chats" cur={tab} set={setTab} label="Chats" icon="💬" />
        <TabButton t="me" cur={tab} set={setTab} label="Profile" icon="👤" />
      </nav>

      {composing && <NewRequestForm uid={user.uid} profile={profile} onClose={() => setComposing(false)} />}
      {toast && (
        <div className="toast" role="status" onClick={() => { setTab("requests"); setToast(""); }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function TabButton({ t, cur, set, label, icon, badge }: { t: Tab; cur: Tab; set: (t: Tab) => void; label: string; icon?: string; badge?: number }) {
  return (
    <button className={`tab ${cur === t ? "active" : ""}`} onClick={() => set(t)} aria-current={cur === t ? "page" : undefined}>
      {icon && <span className="tab-icon" aria-hidden>{icon}</span>}
      <span>{label}</span>
      {!!badge && <span className="badge">{badge}</span>}
    </button>
  );
}
