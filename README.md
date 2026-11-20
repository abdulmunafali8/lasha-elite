# LASHA ELITE LEAGUE MANAGER

React + TypeScript + Firebase (Auth, Firestore, Storage). Hausa default, English switch.

## Setup
1. Firebase Console: create project, add a Web app.
2. Enable **Authentication → Email/Password**, **Firestore**, **Storage**.
3. Deploy `firestore.rules` and `storage.rules` (Console → Rules, or `firebase deploy --only firestore:rules,storage`).
4. `cp .env.example .env` and fill the 5 `VITE_FB_*` values.
5. `npm install` then `npm run dev` (use `npm run build` to type-check).
6. First Super Admin: sign up, then in Firestore set `users/{your uid}.role` to `superadmin`.

## Quick test path
Sign up as organizer → create competition → Settings: add teams, groups, players →
Games: GENERATE MATCHES → enter scores → check Table, Ranking, Dashboard "Recent activity".
Knockout: generate Knockout → enter semi-final scores → check Bracket and third-place match.
Group stage + knockout: Stage 1 groups (round robin) → Stage 2 "Knockout from standings".

## Known gaps
Referees, Places, Rating criterion, Edit registrations, Players ranking, Tournament result, Attachments (Settings) are placeholders.
Categories (several per competition) and CSV player import are not built yet.
