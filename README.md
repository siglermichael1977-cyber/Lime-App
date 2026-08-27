# LIME — De Whole Caribbean, One Yard 🌴

A social platform for Caribbean people worldwide: on-island and across the diaspora.

This repository is a **production starter codebase**: a real React Native (Expo) mobile app
with a real cloud backend (Supabase: PostgreSQL + auth + file storage), including the
moderation features Apple and Google require. It is the foundation you build v1 on —
not yet a finished, submitted app.

## What's included (working, real functionality)

- **Accounts** — email/password sign-up and sign-in, sessions stored securely on device
- **Onboarding** — island of origin + current location, saved to the user's profile
- **Feed** — real posts with photos (uploaded to cloud storage), island/diaspora/tag filters, likes
- **Share out ("Pass it on")** — native share sheet: one tap to WhatsApp, Instagram, SMS, anywhere.
  This is the compliant, realistic version of "WhatsApp sync" — platforms do not allow apps
  to post into personal WhatsApp automatically.
- **Linkup** — real events with RSVP counts and a host-a-linkup form
- **Roots** — private family tree (add/remove relatives with relation + place), protected by
  row-level security so only the owner can ever read their tree
- **Wuk & Hustle** — jobs board with filters (on-island / remote / diaspora / Caribbean-owned)
- **Moderation (required for store approval)** — report any post, block any user (blocked
  users' content disappears from your feed via database policy), in-app account deletion
- **Security** — every table protected by PostgreSQL Row Level Security policies

## Setup (about 30–45 minutes)

1. **Backend**
   - Create a free project at supabase.com
   - Open the SQL Editor, paste in `supabase/schema.sql`, run it
   - Storage → New bucket → name it `post-images`, set it to public
   - Settings → API → copy your Project URL and anon key into `src/lib/supabase.ts`

2. **App**
   ```bash
   npm install
   npx expo start
   ```
   Scan the QR code with the Expo Go app (free on both stores) to run it on your phone.

3. **Account deletion function** (needed before store submission)
   Create a Supabase Edge Function named `delete-account` that calls
   `supabase.auth.admin.deleteUser(userId)` with the service role key.
   Docs: supabase.com/docs/guides/functions

## Roadmap to the App Store & Google Play

**Phase 1 — make it yours (1–2 weeks)**
- [ ] Replace `com.yourcompany.lime` bundle IDs in `app.json`
- [ ] App icon + splash screen (1024×1024 icon)
- [ ] Write and host a privacy policy and terms of service (required links are already
      wired in the Profile screen — point them at your URLs)
- [ ] Deploy the `delete-account` edge function

**Phase 2 — store accounts & builds (1 week, mostly waiting)**
- [ ] Apple Developer Program: developer.apple.com ($99/year)
- [ ] Google Play Console: play.google.com/console ($25 once)
- [ ] Build with EAS: `npx eas build` (Expo's cloud build service creates the
      .ipa and .aab files the stores accept)
- [ ] TestFlight (iOS) and Internal Testing (Android) with your team

**Phase 3 — review readiness**
- [ ] UGC rules are already covered in-code: report ✓ block ✓ delete account ✓ —
      but you must also state a moderation response process (review reports within 24h)
- [ ] App Store screenshots (6.7" and 5.5" iPhone sizes) and descriptions
- [ ] Data-safety questionnaires on both stores (you collect: email, name, island,
      location label, photos, user content)
- [ ] Age rating questionnaires

**Phase 4 — later versions**
- Video (Vibes): use a service like Mux or Cloudflare Stream — do not store raw video
  in the database
- Cross-posting to Instagram/TikTok/Facebook/X: apply for each platform's API access
  (Meta and TikTok both require app review; budget 2–6 weeks per platform)
- Push notifications: Expo Notifications
- Tradition pages, recipes, places: add `content` tables — the pattern in this codebase
  (table + RLS + screen) repeats for every feature
- Surname matching for Roots: a nightly job comparing family_members across users who
  opt in to matching

## Architecture

```
Mobile app (React Native / Expo, TypeScript)
        │
        ▼
Supabase (managed cloud)
├── Auth (email/password, JWT sessions)
├── PostgreSQL + Row Level Security  ← all data rules live here
├── Storage (post-images bucket)
└── Edge Functions (delete-account, future: surname matching)
```

One codebase ships to both iOS and Android. Supabase's free tier comfortably handles
early launch; costs begin around $25/month as the community grows.
