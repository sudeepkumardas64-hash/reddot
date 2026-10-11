import { useState } from "react";
import { createRequest } from "../lib/data";
import { BLOOD_TYPES, type BloodType, type UserProfile } from "../lib/types";
import { compatibleDonorTypes } from "../lib/blood";
import LocationPicker, { type Loc } from "./LocationPicker";

export default function NewRequestForm({ uid, profile, onClose }: { uid: string; profile: UserProfile; onClose: () => void }) {
  const [bloodType, setBloodType] = useState<BloodType | "">("");
  const [units, setUnits] = useState(1);
  const [patientLabel, setPatientLabel] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [loc, setLoc] = useState<Loc>({ city: profile.city, lat: profile.lat, lng: profile.lng });
  const [urgency, setUrgency] = useState<"critical" | "standard">("standard");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodType) return setErr("Choose the patient's blood group.");
    setBusy(true); setErr("");
    try {
      await createRequest(uid, {
        requesterName: profile.name.split(" ")[0],
        patientLabel: patientLabel.trim() || "a patient",
        bloodType, units, hospitalName: hospitalName.trim(), hospitalAddress: hospitalAddress.trim(),
        city: loc.city.trim(), lat: loc.lat, lng: loc.lng, urgency, notes: notes.trim(),
      });
      setDone(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="nr-title" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        {done ? (
          <div className="done">
            <h2 id="nr-title">Request posted ✅</h2>
            <p>Compatible donors nearby can see it now ({bloodType && compatibleDonorTypes(bloodType).join(", ")}). Responses arrive in <b>Chats</b>.</p>
            <p className="muted small">Also call your nearest blood bank and check live blood stock on e-RaktKosh (eraktkosh.mohfw.gov.in). Red.Dot works alongside them, not instead of them.</p>
            <button className="btn primary" onClick={onClose}>OK</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 id="nr-title">Request blood</h2>
            <fieldset>
              <legend>Patient's blood group</legend>
              <div className="chips">{BLOOD_TYPES.map((t) => <button type="button" key={t} className={`chip ${bloodType === t ? "on" : ""}`} onClick={() => setBloodType(t)}>{t}</button>)}</div>
              {bloodType && <p className="muted small">Can receive from: {compatibleDonorTypes(bloodType).join(", ")}</p>}
            </fieldset>
            <label>Units needed<input type="number" min={1} max={20} required value={units} onChange={(e) => setUnits(Math.max(1, Math.round(Number(e.target.value) || 1)))} /></label>
            <fieldset><legend>Urgency</legend>
                <div className="seg">
                  <button type="button" className={urgency === "standard" ? "on" : ""} onClick={() => setUrgency("standard")}>Within days</button>
                  <button type="button" className={urgency === "critical" ? "on red" : ""} onClick={() => setUrgency("critical")}>Critical (today)</button>
                </div>
            </fieldset>
            <label>Hospital / blood bank name<input required maxLength={120} value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="e.g. KEM Hospital, Parel" /></label>
            <label>Address or area<input maxLength={200} value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)} placeholder="e.g. Acharya Donde Marg, Parel" /></label>
            <LocationPicker value={loc} onChange={setLoc} gpsLabel="I'm at the hospital — use my location" />
            <label>Patient <span className="muted small">(first name or initials only; avoid full names)</span><input maxLength={60} value={patientLabel} onChange={(e) => setPatientLabel(e.target.value)} placeholder="e.g. R.K., 54 yrs" /></label>
            <label>Notes for donors<textarea maxLength={300} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ward, timing, replacement donor needed, etc. Don't add medical records." /></label>
            {err && <p className="error">{err}</p>}
            <button className="btn primary block" disabled={busy}>{busy ? "Posting…" : "Post request"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
