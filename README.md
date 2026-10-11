# Red.Dot 🩸

Connects people who urgently need blood with nearby, compatible donors. Built as a website and an Android app from one codebase.

- **Web:** React + Vite + TypeScript
- **Backend:** Firebase Auth (Google, phone OTP, email) + Cloud Firestore with strict security rules
- **Android:** Capacitor 7 with native Google and phone sign-in

```bash
npm install
cp .env.example .env.local   # add your Firebase web config
npm run dev
```

The full launch steps (Firebase, hosting, APK, Play Store) are in **[SETUP.md](SETUP.md)**.

Scripts: `npm run build` · `npm test` · `npm run test:rules` (needs Java) · `npm run cap:sync`
