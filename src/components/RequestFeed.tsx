import { useMemo, useState } from "react";
import { canDonateTo, daysUntilEligible, distanceKm, formatDistance, timeAgo } from "../lib/blood";
import { closeRequest, openThread } from "../lib/data";
import type { BloodRequest, UserProfile } from "../lib/types";

type Filter = "match" | "all" | "mine";

export default function RequestFeed({ requests, error, me, profile, onChat }: {
  requests: BloodRequest[] | undefined; error: string; me: string; profile: UserProfile; onChat: (threadId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("match");
  const [radius, setRadius] = useState(50);
  const wait = daysUntilEligible(profile.lastDonationDate);

  const list = useMemo(() => {
    const withKm = (requests ?? []).map((r) => ({ r, km: distanceKm(profile.lat, profile.lng, r.lat, r.lng) }));
    const filtered = withKm.filter(({ r, km }) => {
      if (filter === "mine") return r.requesterId === me;
      if (filter === "match") return r.requesterId !== me && canDonateTo(profile.bloodType, r.bloodType) && km <= radius;
      return km <= radius || r.requesterId === me;
    });
    return filtered.sort((a, b) => (a.r.urgency === b.r.urgency ? a.km - b.km : a.r.urgency === "critical" ? -1 : 1));
  }, [requests, filter, radius, me, profile]);

  return (
    <section>
      <div className="section-head">
        <h1>Blood requests</h1>
        <div className="seg" role="tablist">
          <button className={filter === "match" ? "on" : ""} onClick={() => setFilter("match")}>I can donate</button>
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All nearby</button>
          <button className={filter === "mine" ? "on" : ""} onClick={() => setFilter("mine")}>My requests</button>
        </div>
      </div>
      {filter !== "mine" && (
        <div className="row gap wrap filters">
          <label className="inline">Within
            <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
              {[10, 25, 50, 100, 300, 5000].map((k) => <option key={k} value={k}>{k === 5000 ? "anywhere" : `${k} km`}</option>)}
            </select>
          </label>
          <span className="muted small">You are <b>{profile.bloodType}</b> · {profile.city}</span>
        </div>
      )}
      {filter === "match" && wait > 0 && (
        <p className="notice">You donated recently. Most blood banks need about {wait} more days before you can donate whole blood again. You can still share requests.</p>
      )}
      {error && <p className="error">Could not load requests: {error}</p>}
      {requests === undefined && !error && <div className="skeleton-list">{[1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</div>}
      {requests !== undefined && list.length === 0 && (
        <div className="empty">
          <p>{filter === "mine" ? "You haven't posted any requests." : "No matching requests near you right now. That's good news."}</p>
          {filter === "match" && <button className="link" onClick={() => setFilter("all")}>See all nearby requests</button>}
        </div>
      )}
      <ul className="cards">
        {list.map(({ r, km }) => <RequestCard key={r.id} r={r} km={km} me={me} profile={profile} onChat={onChat} />)}
      </ul>
    </section>
  );
}

function RequestCard({ r, km, me, profile, onChat }: { r: BloodRequest; km: number; me: string; profile: UserProfile; onChat: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const mine = r.requesterId === me;
  const compatible = canDonateTo(profile.bloodType, r.bloodType);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.hospitalName}, ${r.hospitalAddress}`)}`;
  const share = async () => {
    const text = `Urgent: ${r.units} unit(s) of ${r.bloodType} blood needed at ${r.hospitalName}, ${r.city}. Can you help? Open Red.Dot: ${location.origin}${import.meta.env.BASE_URL}`;
    if (navigator.share) await navigator.share({ title: "Blood needed", text }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  return (
    <li className={`card req ${r.urgency === "critical" ? "critical" : ""}`}>
      <div className="req-top">
        <span className="blood">{r.bloodType}</span>
        <div className="grow">
          <div className="row gap wrap">
            {r.urgency === "critical" && <span className="pill red">Critical</span>}
            <span className="pill">{r.units} unit{r.units > 1 ? "s" : ""}</span>
            {compatible && !mine && <span className="pill green">You can donate</span>}
            {mine && <span className="pill blue">Your request</span>}
          </div>
          <h3>{r.hospitalName}</h3>
          <p className="muted small">{r.hospitalAddress || r.city} · {formatDistance(km)} away · {timeAgo(r.createdAt?.toDate?.())}</p>
        </div>
      </div>
      <p className="small">For <b>{r.patientLabel}</b>{r.notes ? ` · ${r.notes}` : ""}</p>
      <div className="row gap wrap">
        {!mine && (
          <button className="btn primary sm" disabled={busy} onClick={async () => {
            setBusy(true);
            try { onChat(await openThread(me, profile.name.split(" ")[0], r.requesterId, r.requesterName, r.id)); } finally { setBusy(false); }
          }}>💬 I can help — message</button>
        )}
        <a className="btn sm" href={maps} target="_blank" rel="noreferrer">🗺️ Directions</a>
        <button className="btn sm" onClick={share}>↗ Share</button>
        {mine && (
          <>
            <button className="btn sm" disabled={busy} onClick={async () => { setBusy(true); await closeRequest(r.id, "fulfilled").finally(() => setBusy(false)); }}>✅ Mark fulfilled</button>
            <button className="btn sm ghost" disabled={busy} onClick={async () => { if (confirm("Cancel this request?")) { setBusy(true); await closeRequest(r.id, "cancelled").finally(() => setBusy(false)); } }}>Cancel</button>
          </>
        )}
      </div>
    </li>
  );
}
