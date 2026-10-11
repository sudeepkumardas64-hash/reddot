import { useState } from "react";
import { saveProfile } from "../lib/data";
import { BLOOD_TYPES, type BloodType, type UserProfile } from "../lib/types";
import LocationPicker, { type Loc } from "./LocationPicker";
import Logo from "./Logo";

export default function ProfileForm({ uid, initial, defaultName = "", defaultPhone = "", onDone }: {
  uid: string; initial: UserProfile | null; defaultName?: string; defaultPhone?: string; onDone?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? defaultName);
  const [phone, setPhone] = useState(initial?.phone ?? defaultPhone);
  const [bloodType, setBloodType] = useState<BloodType | "">(initial?.bloodType ?? "");
  const [loc, setLoc] = useState<Loc>({ city: initial?.city ?? "", lat: initial?.lat ?? 0, lng: initial?.lng ?? 0 });
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [last, setLast] = useState(initial?.lastDonationDate ?? "");
  const [consent, setConsent] = useState(!!initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isNew = !initial;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodType) return setErr("Choose your blood group.");
    if (!loc.lat && !loc.lng) return setErr("Choose a city from the list or use your location.");
    setBusy(true); setErr("");
    try {
      await saveProfile(uid, { name: name.trim(), phone: phone.trim(), bloodType, city: loc.city.trim(), lat: loc.lat, lng: loc.lng, available, lastDonationDate: last }, isNew);
      onDone?.();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  const form = (
    <form className="card" onSubmit={submit}>
      {isNew && (<><Logo size={40} /><h1>Set up your profile</h1><p className="muted">This takes 30 seconds. Other users only see your first name, blood group, city and an area about 1 km wide.</p></>)}
      {!isNew && <h2>Edit profile</h2>}
      <label>Full name<input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
      <label>Mobile number <span className="muted small">(private, never shown publicly)</span><input type="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+91 …" /></label>
      <fieldset>
        <legend>Blood group</legend>
        <div className="chips">
          {BLOOD_TYPES.map((t) => (
            <button type="button" key={t} className={`chip ${bloodType === t ? "on" : ""}`} onClick={() => setBloodType(t)} aria-pressed={bloodType === t}>{t}</button>
          ))}
        </div>
      </fieldset>
      <LocationPicker value={loc} onChange={setLoc} />
      <label>Last time you donated blood <span className="muted small">(leave empty if never)</span><input type="date" value={last} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setLast(e.target.value)} /></label>
      <label className="switch"><input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} /> I'm available to donate when someone nearby needs my blood group</label>
      {isNew && (
        <label className="switch"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to Red.Dot storing these details to match me with blood requests. I can delete them any time from my profile.</label>
      )}
      {err && <p className="error">{err}</p>}
      <div className="row gap">
        <button className="btn primary" disabled={busy}>{busy ? "Saving…" : isNew ? "Continue" : "Save"}</button>
        {onDone && !isNew && <button type="button" className="btn" onClick={onDone}>Cancel</button>}
      </div>
    </form>
  );
  return isNew ? <div className="center-page"><div className="narrow">{form}</div></div> : form;
}
