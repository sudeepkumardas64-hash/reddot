import { useState } from "react";
import type { User } from "firebase/auth";
import { deleteUser } from "firebase/auth";
import { signOut } from "../lib/auth";
import { deleteMyData } from "../lib/data";
import { daysUntilEligible } from "../lib/blood";
import type { UserProfile } from "../lib/types";
import ProfileForm from "./ProfileForm";

export default function Me({ user, profile }: { user: User; profile: UserProfile }) {
  const [editing, setEditing] = useState(false);
  const [notif, setNotif] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
  const wait = daysUntilEligible(profile.lastDonationDate);
  if (editing) return <ProfileForm uid={user.uid} initial={profile} onDone={() => setEditing(false)} />;
  return (
    <section>
      <div className="section-head"><h1>Profile</h1></div>
      <div className="card">
        <div className="row gap">
          <span className="blood">{profile.bloodType}</span>
          <div className="grow">
            <h2>{profile.name}</h2>
            <p className="muted small">{profile.city} · {user.email || user.phoneNumber}</p>
          </div>
        </div>
        <ul className="facts">
          <li><b>Status:</b> {profile.available ? "Available to donate" : "Not available"}</li>
          <li><b>Last donation:</b> {profile.lastDonationDate || "Never / not recorded"}</li>
          <li><b>Eligible:</b> {wait === 0 ? "Yes, you can donate now" : `in about ${wait} days`}</li>
          <li><b>Phone:</b> {profile.phone || "Not added"} <span className="muted small">(private)</span></li>
        </ul>
        <div className="row gap wrap">
          <button className="btn primary sm" onClick={() => setEditing(true)}>Edit profile</button>
          {notif === "default" && <button className="btn sm" onClick={async () => setNotif(await Notification.requestPermission())}>🔔 Enable alerts</button>}
          <button className="btn sm" onClick={() => signOut()}>Sign out</button>
        </div>
      </div>
      <div className="card">
        <h3>Before you donate</h3>
        <ul className="small">
          <li>Age 18–65, weight 45 kg or more, and feeling well</li>
          <li>Wait at least 3 months between whole-blood donations (4 months for women)</li>
          <li>Eat a meal and drink water before you go</li>
          <li>The blood bank does the final health check and screening</li>
        </ul>
      </div>
      <div className="card danger-zone">
        <h3>Your data</h3>
        <p className="small muted">Red.Dot stores your profile only to match you with requests. Deleting removes your profile, donor card and sign-in account.</p>
        <button className="btn sm danger" onClick={async () => {
          if (!confirm("Delete your Red.Dot profile and account permanently?")) return;
          try { await deleteMyData(user.uid); await deleteUser(user); }
          catch (e) { alert((e as { code?: string }).code === "auth/requires-recent-login" ? "For security, sign out and sign in again, then delete." : (e as Error).message); }
        }}>Delete my account</button>
      </div>
      <p className="fine">Red.Dot only connects people. It is not a blood bank or a medical service. In an emergency call 108. To check blood bank stock, use e-RaktKosh (eraktkosh.mohfw.gov.in).</p>
    </section>
  );
}
