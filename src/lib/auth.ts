import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as fbSignOut,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";

const native = Capacitor.isNativePlatform();

export async function signInWithGoogle() {
  if (native) {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const cred = GoogleAuthProvider.credential(result.credential?.idToken);
    return signInWithCredential(auth, cred);
  }
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function emailSignIn(email: string, password: string, create: boolean) {
  return create
    ? createUserWithEmailAndPassword(auth, email, password)
    : signInWithEmailAndPassword(auth, email, password);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

/** Starts phone sign-in. Returns a function that confirms the 6-digit code. */
export async function startPhoneSignIn(phoneE164: string, recaptchaContainerId: string): Promise<(code: string) => Promise<unknown>> {
  if (native) {
    const verificationId = await new Promise<string>(async (resolve, reject) => {
      const handle = await FirebaseAuthentication.addListener("phoneCodeSent", (e) => {
        handle.remove();
        resolve(e.verificationId);
      });
      FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: phoneE164 }).catch((err) => {
        handle.remove();
        reject(err);
      });
    });
    return (code: string) => signInWithCredential(auth, PhoneAuthProvider.credential(verificationId, code));
  }
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" });
  let confirmation: ConfirmationResult;
  try {
    confirmation = await signInWithPhoneNumber(auth, phoneE164, verifier);
  } catch (e) {
    verifier.clear();
    throw e;
  }
  return (code: string) => confirmation.confirm(code);
}

export async function signOut() {
  if (native) await FirebaseAuthentication.signOut().catch(() => {});
  await fbSignOut(auth);
}

export function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-login-credentials": "Wrong email or password.",
    "auth/email-already-in-use": "An account with this email already exists — sign in instead.",
    "auth/weak-password": "Use at least 6 characters for the password.",
    "auth/invalid-phone-number": "Enter the number with country code, e.g. +91 98765 43210.",
    "auth/invalid-verification-code": "That code is not correct.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
    "auth/popup-closed-by-user": "Sign-in window was closed.",
    "auth/billing-not-enabled": "Phone sign-in needs the Firebase Blaze plan. Use Google or email for now.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in the Firebase console.",
    "auth/unauthorized-domain": "This website's domain is not authorised in Firebase → Authentication → Settings.",
  };
  return map[code] ?? (e as Error)?.message ?? "Something went wrong.";
}
