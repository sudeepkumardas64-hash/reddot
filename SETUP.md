# Red.Dot: how it's deployed

| What | Where |
|---|---|
| Website | https://sudeepkumardas64-hash.github.io/reddot/ |
| Android APK | https://github.com/sudeepkumardas64-hash/reddot/releases/latest |
| Source code | https://github.com/sudeepkumardas64-hash/reddot |
| Database & sign-in | Firebase project `reddot-3e3bd` (https://console.firebase.google.com/project/reddot-3e3bd) |

## How updates work

Every push to `main` triggers `.github/workflows/build.yml`. A copy of it lives in `ci/build.yml`. Each run:

1. Type-checks the code and runs the blood-logic and security-rules tests.
2. Builds the website and publishes it to GitHub Pages.
3. Builds the Android APK and attaches it to the **latest** release.

To change something, edit a file on GitHub, or locally and then push. The site and the APK update in about 5 minutes.

## Run it locally

```bash
npm install
npm run dev        # uses .env.development (same Firebase project)
```

## Firebase settings (already done)

- **Authentication:** Google and Email/Password are enabled. Phone OTP is not: enable it in Authentication → Sign-in method → Phone. That means accepting Google's Play Integrity terms, and sending SMS may need the Blaze plan.
- **Authorised domains:** `sudeepkumardas64-hash.github.io` is added.
- **Firestore:** asia-south1 (Mumbai), production mode, rules from `firestore.rules`, and 2 composite indexes (see `firestore.indexes.json`).
- **Android app:** `org.reddot.app`. Its SHA-1 matches the debug key in `android/app/reddot-debug.keystore`.

If you change `firestore.rules`, paste the new rules into Firestore → Rules → Publish. Or run `firebase deploy --only firestore` from a computer.

## Play Store (later)

The APK is signed with a **debug** key, so it's fine for testing and sharing directly. For the Play Store:

1. Create an upload key (keep it private, never commit it):
   `keytool -genkey -v -keystore release.keystore -alias reddot -keyalg RSA -keysize 2048 -validity 10000`
2. Add the key's SHA-1, plus Google's app-signing SHA-1 from Play Console, to the Firebase Android app.
3. Build a release bundle (`./gradlew bundleRelease`) with that key, and upload it in Play Console. There's a one-time US$25 fee.
4. Play Store also needs a privacy policy URL, the Data safety form (name, phone, approximate location, blood group) and the Health apps declaration.

## Data model

| Collection | Who can read | Contents |
|---|---|---|
| `users/{uid}` | owner only | name, phone, exact location, blood group, last donation |
| `donors/{uid}` | signed-in users | first name, blood group, city, location rounded to ~1 km |
| `requests/{id}` | signed-in users | hospital, blood group, units, urgency. Only the requester can close one |
| `threads/{a_b}/messages` | the 2 participants | private chat |

## Not built yet

- **Push alerts when the app is closed.** These need Cloud Functions and the Blaze plan. Alerts already work while the app is open.
- **Verified donor badges.** These need a human review flow. Users can't mark themselves verified; the rules block it.
