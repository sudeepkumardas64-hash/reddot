import { useState } from "react";
import { CITIES } from "../lib/cities";
import { currentPosition } from "../lib/geo";

export interface Loc { city: string; lat: number; lng: number }

export default function LocationPicker({ value, onChange, gpsLabel = "Use my current location" }: { value: Loc; onChange: (l: Loc) => void; gpsLabel?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const knownCity = CITIES.find((c) => c.name === value.city);
  return (
    <div className="loc">
      <label>
        City
        <input
          list="cities"
          value={value.city}
          onChange={(e) => {
            const name = e.target.value;
            const c = CITIES.find((x) => x.name.toLowerCase() === name.toLowerCase());
            onChange(c ? { city: c.name, lat: c.lat, lng: c.lng } : { ...value, city: name });
          }}
          placeholder="Start typing, e.g. Mumbai"
          required
        />
        <datalist id="cities">{CITIES.map((c) => <option key={c.name} value={c.name} />)}</datalist>
      </label>
      <button
        type="button"
        className="btn sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true); setMsg("");
          try {
            const p = await currentPosition();
            onChange({ ...value, lat: p.lat, lng: p.lng });
            setMsg("📍 Location captured");
          } catch {
            setMsg("Could not get location. Choose a city from the list instead.");
          } finally { setBusy(false); }
        }}
      >
        {busy ? "Locating…" : `📍 ${gpsLabel}`}
      </button>
      {msg && <span className="muted small">{msg}</span>}
      {!msg && value.city && !knownCity && !value.lat && <span className="error small">Pick a city from the list or use your location.</span>}
    </div>
  );
}
