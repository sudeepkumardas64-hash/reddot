import { useState } from "react";
import Logo from "./Logo";
import { emailSignIn, friendlyAuthError, resetPassword, signInWithGoogle, startPhoneSignIn } from "../lib/auth";

type Mode = "choose" | "email" | "phone";

export default function Login() {
  const [mode, setMode] = useState<Mode>("choose");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setErr(""); setInfo(""); setBusy(true);
    try { await fn(); } catch (e) { setErr(friendlyAuthError(e)); } finally { setBusy(false); }
  };

  return (
    <div className="center-page login">
      <div className="hero">
        <Logo size={64} />
        <h1>Red.Dot</h1>
        <p>Blood needed urgently? Reach compatible donors near the hospital in minutes.</p>
        <ul className="hero-points">
          <li>Matches by blood group compatibility and distance</li>
          <li>Your home location is never shown, only an area about 1 km wide</li>
          <li>Chat privately before sharing a phone number</li>
        </ul>
      </div>
      <div className="card narrow">
        {mode === "choose" && (
          <>
            <h2>Sign in or create an account</h2>
            <button className="btn google block" disabled={busy} onClick={() => run(signInWithGoogle)}>
              <GoogleG /> Continue with Google
            </button>
            <button className="btn block" disabled={busy} onClick={() => setMode("phone")}>📱 Continue with phone (OTP)</button>
            <button className="btn block" disabled={busy} onClick={() => setMode("email")}>✉️ Continue with email</button>
          </>
        )}
        {mode === "email" && <EmailForm busy={busy} run={run} setInfo={setInfo} back={() => setMode("choose")} />}
        {mode === "phone" && <PhoneForm busy={busy} run={run} back={() => setMode("choose")} />}
        {err && <p className="error" role="alert">{err}</p>}
        {info && <p className="ok">{info}</p>}
        <p className="fine">
          By continuing you agree that Red.Dot only connects people. It is not a blood bank and does not check
          medical fitness. The hospital or blood bank screens every donor.
        </p>
      </div>
    </div>
  );
}

function EmailForm({ busy, run, back, setInfo }: { busy: boolean; run: (f: () => Promise<unknown>) => void; back: () => void; setInfo: (s: string) => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [create, setCreate] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => emailSignIn(email.trim(), pw, create)); }}>
      <h2>{create ? "Create account" : "Sign in with email"}</h2>
      <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" required minLength={6} autoComplete={create ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <button className="btn primary block" disabled={busy}>{create ? "Create account" : "Sign in"}</button>
      <div className="row between">
        <button type="button" className="link" onClick={() => setCreate(!create)}>{create ? "Have an account? Sign in" : "New here? Create account"}</button>
        {!create && (
          <button type="button" className="link" onClick={() => email && run(async () => { await resetPassword(email.trim()); setInfo("Password reset email sent."); })}>Forgot password?</button>
        )}
      </div>
      <button type="button" className="link" onClick={back}>← Other options</button>
    </form>
  );
}

function PhoneForm({ busy, run, back }: { busy: boolean; run: (f: () => Promise<unknown>) => void; back: () => void }) {
  const [phone, setPhone] = useState("+91 ");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState<((c: string) => Promise<unknown>) | null>(null);
  const e164 = "+" + phone.replace(/[^\d]/g, "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm) run(async () => { const c = await startPhoneSignIn(e164, "recaptcha"); setConfirm(() => c); });
        else run(() => confirm(code.trim()));
      }}
    >
      <h2>Sign in with phone</h2>
      {!confirm ? (
        <label>Mobile number<input type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></label>
      ) : (
        <label>6-digit code sent to {phone}<input inputMode="numeric" pattern="\d{6}" required autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} /></label>
      )}
      <button className="btn primary block" disabled={busy}>{confirm ? "Verify & continue" : "Send code"}</button>
      <div id="recaptcha" />
      <button type="button" className="link" onClick={back}>← Other options</button>
    </form>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
