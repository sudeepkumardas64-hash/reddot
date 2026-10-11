import { useMemo, useState } from "react";
import { compatibleDonorTypes, daysUntilEligible, distanceKm, formatDistance } from "../lib/blood";
import { openThread, useDonors } from "../lib/data";
import { BLOOD_TYPES, type BloodType, type UserProfile } from "../lib/types";

export default function DonorFinder({ me, profile, onChat }: { me: string; profile: UserProfile; onChat: (id: string) => void }) {
  const [patientType, setPatientType] = useState<BloodType>(profile.bloodType);
  const [radius, setRadius] = useState(25);
  const donors = useDonors(true);
  const list = useMemo(() => {
    const ok = compatibleDonorTypes(patientType);
    return donors
      .filter((d) => d.id !== me && ok.includes(d.bloodType) && daysUntilEligible(d.lastDonationDate) === 0)
      .map((d) => ({ d, km: distanceKm(profile.lat, profile.lng, d.approxLat, d.approxLng) }))
      .filter((x) => x.km <= radius)
      .sort((a, b) => a.km - b.km);
  }, [donors, patientType, radius, me, profile]);

  return (
    <section>
      <div className="section-head"><h1>Find donors</h1></div>
      <p className="muted">Shows available donors who are eligible today and whose blood is compatible. Distances are approximate.</p>
      <div className="row gap wrap filters">
        <label className="inline">Patient needs
          <select value={patientType} onChange={(e) => setPatientType(e.target.value as BloodType)}>{BLOOD_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="inline">within
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>{[5, 10, 25, 50, 100].map((k) => <option key={k} value={k}>{k} km</option>)}</select>
        </label>
        <span className="muted small">{list.length} donor{list.length === 1 ? "" : "s"}</span>
      </div>
      {list.length === 0 && <div className="empty"><p>No matching donors in this radius yet. Post a request so donors are alerted, and share Red.Dot to grow the network.</p></div>}
      <ul className="grid">
        {list.map(({ d, km }) => (
          <li key={d.id} className="card donor">
            <span className="blood sm">{d.bloodType}</span>
            <div className="grow">
              <b>{d.displayName}</b>
              <p className="muted small">{d.city} · ~{formatDistance(km)}</p>
            </div>
            <button className="btn sm" onClick={async () => onChat(await openThread(me, profile.name.split(" ")[0], d.id, d.displayName, ""))}>💬 Message</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
