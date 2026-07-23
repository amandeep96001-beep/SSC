# ExamPrep — Complete App Documentation

**Version:** 2.1  
**Audience:** Students (non-tech) + Developers / Admins (tech)  
**Language:** Simple English (easy for everyone)

This document explains **what ExamPrep is**, **every feature**, and **how each flow works** — from first login to admin tools.

---

## 1. App kya hai? (What is ExamPrep?)

**ExamPrep** ek online study app hai Indian competitive exams ke liye:

- SSC  
- Banking  
- Railways  
- UPSC  
- CAT  
- State PSC  
- Custom exam

**Students** daily practice, syllabus notes, topic tests, full mocks, performance tracking, aur MCQ battles kar sakte hain.  
**Admins** question bank, exam subjects, aur institute progress manage karte hain.

> Payment / subscription is app mein **nahi** hai — free use model.

---

## 2. Kaun use karega? (User roles)

| Role | Simple meaning | Kya kar sakte ho |
|------|----------------|------------------|
| **Student (`user`)** | Normal aspirant | Practice, notes, mocks, battle, reminders, analytics |
| **Admin (`admin`)** | Institute / content manager | Subjects map, question upload, progress export, official syllabus |

Admin email server env `ADMIN_EMAIL` se set hota hai — us email se login = admin role.

---

## 3. Tech overview (developers ke liye)

| Layer | Stack |
|-------|--------|
| Frontend | React 19 + Vite, GSAP, Lucide, Recharts |
| Backend | Express 5 + JWT + bcrypt |
| Database | MongoDB (Mongoose) |
| Auth | Email/password, OTP, Google Sign-In |
| AI | `POST /api/ai/explain` (wrong answers explain) |
| Hosting | Frontend (Vercel), Backend (Render) |

**Important:** Ye SPA hai — browser URL routes nahi. Navigation `Dashboard` ke andar `activeView` se hoti hai (jaise `home`, `drill`, `mock`).

---

## 4. Poora app map (sidebar se)

Login ke baad left sidebar se ye screens milte hain:

| Sidebar label | Screen ID | Short meaning |
|---------------|-----------|---------------|
| What to Study | `home` | Aaj kya padhein / weak & strong topics |
| Reminders | `reminders` | Study alarms |
| Exam subjects | `admin` | **Sirf admin** |
| Daily Drills | `drill` | Short practice + wrong log + AI |
| Syllabus & Notes | `subjects` → `topics` → `notes` | Padhai + topic test |
| Revision Deck | `revision` | Tables, fractions, vocab |
| Full Mocks | `mock` | Full-length papers |
| Performance | `performance` | Attempt history |
| Analytics | `analytics` | Charts & trends |
| MCQ Battle | `competition` | Timed quiz + leaderboard |

Extra overlays (fullscreen):

- Topic test → `test` → results → `results`  
- Full mock → `mock_exam_active`  
- Sticky notes → floating button (har screen pe)

---

## 5. Feature-by-feature flows

Har feature ke neeche:

1. **Simple flow** — student kya kare  
2. **Tech notes** — code / API (optional)

---

### 5.1 Account banana & login (Auth)

#### Simple flow

1. App kholo → Auth screen.  
2. **Create account:** email + password (≥ 8 characters) → email pe 6-digit OTP aayega → code dalo → account verify.  
3. **Sign in:** email + password → Dashboard.  
4. **Google:** “Continue with Google” → seedha login.  
5. **Password bhool gaye:** Forgot → email → OTP → naya password → wapas Sign in.  
6. **Logout:** Sidebar → Log Out.

Theme (light/dark) auth screen pe bhi toggle ho sakta hai.

#### Tech notes

- UI: `frontend/src/features/auth/components/AuthPanel.jsx`  
- APIs: `POST /api/auth/register`, `/login`, `/otp/request`, `/otp/verify`, `/password/forgot`, `/password/reset`, `/google`  
- Token localStorage: `ssc_token`, `ssc_user`

---

### 5.2 Exam choose karna (Onboarding)

#### Simple flow

1. Pehli baar login → popup: exam choose karo (SSC / Banking / …).  
2. Optional: exam date set karo (countdown ke liye).  
3. “Start preparing” → Home.  
4. Baad mein Home pe exam chip se exam / date change kar sakte ho.

App us exam ke subjects, mocks, aur progress ke hisaab se content dikhati hai.

#### Tech notes

- UI: `ExamPicker.jsx`, context: `ExamContext.jsx`  
- Profiles: `frontend/src/shared/examProfiles.js`  
- Subjects: `GET /api/exam-config` (admin mapping; warna defaults)  
- Local keys: `examprep_target_exam`, `examprep_exam_date`, `examprep_exam_onboarded`

---

### 5.3 What to Study (Home)

#### Simple flow

1. Sidebar → **What to Study**.  
2. Dekho: exam name, last studied, days left (agar date set hai).  
3. Weak vocabulary list (agar drills mein galat hue) → Drills mein practice / clear.  
4. **Strong topics** (green) vs **Needs attention** (red/yellow) — topic tests se.  
5. Subject chips → us subject ka Syllabus kholo.  
6. Personal goals add / tick / delete (sirf tumhare device pe, per exam).

#### Tech notes

- UI: `TodayFocusWorkspace.jsx`  
- Progress status topic-test attempts se aata hai (`red` / `yellow` / `green`)

---

### 5.4 Daily Drills

#### Simple flow

1. Sidebar → **Daily Drills**.  
2. Type choose karo:
   - **Speed:** Tables, Squares, Cubes, Fractions, Percentages  
   - **MCQ:** Vocab, GK, English, Maths, Reasoning  
3. Sawal aayega → answer do → check → score / streak → next ya skip.  
4. **Wrong log** tab: pehle galat sawal → dubara try, related PYQs, ya **Explain with AI**.  
5. AI explanation concept + exam-style facts deta hai.

#### Tech notes

- UI: `DrillWorkspace.jsx`, hook: `useDrills.js`  
- APIs: `GET /api/drill/next`, `POST /api/drill/verify`, `GET /api/drill/related`  
- AI: `POST /api/ai/explain`  
- Wrong questions localStorage (`wrongQuestions`) — server sync nahi

---

### 5.5 Syllabus & Notes

#### Simple flow

Do sources:

| Source | Matlab |
|--------|--------|
| **Official Syllabus** | Shared notes (sabko); admin edit/publish kar sakta hai |
| **My Notes** | Sirf tumhari subjects / topics |

**Padhne ka flow:**

1. Subjects list → Topic choose → Notes padho.  
2. Reading tools: font size, comfort, spacing, focus mode, TOC, search, bookmarks, progress.  
3. Highlight / edit (official pe student ke liye local; owner/admin server pe save).  
4. Subject/topic create: naam, syllabus meta, notes, optional bulk MCQs.  
5. Own content edit/delete (admin official pe bhi).

**Topic test flow:**

1. Notes se **Start Test** → fullscreen exam portal.  
2. Timer, question palette, Save & Next, Mark for Review, Clear.  
3. Submit / Cancel confirm.  
4. Results: score, time, error log, per-question review → Retest ya back.

#### Tech notes

- UI: `SyllabusWorkspace.jsx`, exam: `ExamPortal.jsx`, results: `ResultsPortal.jsx`  
- APIs: `/api/study/subjects`, `/topics`, `/notes`, `/test`  
- Progress save: `POST /api/auth/progress`

---

### 5.6 Sticky Notes (floating dock)

#### Simple flow

1. Har logged-in screen pe chhota floating button (drag kar sakte ho).  
2. Tap → sticky notes panel: colour, pin, labels.  
3. Badge pe aaj ke notes ka count.  
4. Syllabus se bhi dock open ho sakta hai.  
5. Escape / phone back se panel band.

**Note:** Ye notes **sirf browser mein** rehte hain — dusre device pe nahi milenge.

#### Tech notes

- UI: `NotesFloatingDock.jsx`, `StickyNotesPanel.jsx`  
- Storage: `stickyNotesStorage.js`, FAB position: `notesFloatingStorage.js`

---

### 5.7 Revision Deck

#### Simple flow

1. Sidebar → **Revision Deck**.  
2. Tabs:
   - **Tables & Fractions:** Tables, Squares, Cubes, Fractions, Percentages — reference sheets.  
   - **Vocabulary:** search / filter by category → cards → Add / Edit / Bulk JSON import.  
3. Vocab categories: Word Power, Idioms & Phrases, One Word Substitution, Spelling Rules.  
4. Ye vocab Daily Drills ke vocab practice mein help karta hai.

#### Tech notes

- UI: `RevisionWorkspace.jsx`  
- APIs: `GET/POST/PUT /api/study/vocab`, `POST /api/study/vocab/bulk`

---

### 5.8 Full Mocks

#### Simple flow

1. Sidebar → **Full Mocks**.  
2. Current exam ke mocks dikhenge.  
3. **Add mock** (allowed users): title, year/date/shift, section pattern, bulk MCQs paste.  
4. **Start** → fullscreen mock: sections, timer, palette, section-wise time.  
5. Submit → score (exam marking scheme se) → Results → attempt save.  
6. Delete (agar permission ho) confirm ke saath.

Section pattern (kitne Q per section) per exam save ho sakta hai; admin pattern edit kar sakta hai.

#### Tech notes

- UI: `MockWorkspace.jsx`, `FullMockPortal.jsx`  
- APIs: `GET/POST /api/mock`, `GET/DELETE /api/mock/:id`, `POST /api/auth/mock-progress`  
- Timer: exam profile `mockMinutes`

---

### 5.9 Performance

#### Simple flow

1. Sidebar → **Performance**.  
2. Current exam ke syllabus tests + mock attempts ke stats.  
3. History cards: score rings, status badges.  
4. CSV export se progress download.

#### Tech notes

- UI: `PerformanceWorkspace.jsx`  
- Export: client-side aur/ya `GET /api/auth/progress/export`, `/api/auth/mock-progress/export`

---

### 5.10 Analytics

#### Simple flow

1. Sidebar → **Analytics**.  
2. Charts dekho: study time, mock score trend, topic attempts pie, last 7 days activity.  
3. Sab selected exam ke hisaab se filter.

#### Tech notes

- UI: `AnalyticsWorkspace.jsx` (Recharts)

---

### 5.11 MCQ Battle (Competition)

#### Simple flow

1. Sidebar → **MCQ Battle**.  
2. Subject choose: Mixed / GK / English / Maths / Reasoning.  
3. Leaderboard pehle se dekh sakte ho.  
4. Start → **20 questions**, har ek pe **45 seconds**.  
5. Turant sahi/galat feedback.  
6. End → score + rank.  
7. Beech mein chhodne pe confirm (back trap).

#### Tech notes

- UI: `CompetitionWorkspace.jsx`  
- APIs: `GET /api/competition/questions`, `POST /api/competition/submit`, `GET /api/competition/leaderboard`

---

### 5.12 Reminders

#### Simple flow

1. Sidebar → **Reminders**.  
2. Create: title, message, time, repeat (daily / weekdays / once + date).  
3. List se enable/disable / delete.  
4. Notification: browser desktop notification + in-app toast.  
5. Agar SMTP configure hai → email bhi aa sakti hai.  
6. Browser permission pehli baar maang sakta hai.

#### Tech notes

- UI: `RemindersWorkspace.jsx`  
- APIs: `/api/reminders/*`, notifications list/read/test  
- Server cron: `reminder.cron.js` (`REMINDER_CRON=1`)  
- Dashboard unread notifications ~20s pe poll karta hai

---

### 5.13 Admin — Exam subjects

**Sirf admin** sidebar mein ye option dekhta hai.

#### Simple flow

1. **Institute health:** total users, attempts; sab users ka CSV export.  
2. **Question bank:** single / bulk upload; stats dekho.  
3. **Exam subject map:** exam choose → official subjects add/remove.  
4. **Mock pattern:** us exam ke sections + question counts.  
5. Official syllabus subjects Syllabus screen (Official mode) se bhi create.

Alag “teacher” role nahi hai.

#### Tech notes

- UI: `AdminWorkspace.jsx`  
- APIs: `GET /api/auth/admin/summary`, `POST /api/questions/tcs/bulk`, `GET /api/questions/tcs/stats`, `PUT /api/exam-config/:examId`

---

### 5.14 Profile / Settings (alag page nahi)

Dedicated Profile page nahi. Available controls:

- Username (sidebar)  
- Logout  
- Light / Dark theme  
- Exam picker + exam date  
- Notes reading prefs & bookmarks (local)  
- Notification permission (Reminders)

---

## 6. End-to-end journeys (common paths)

### Journey A — Naya student pehli baar

```
Open app → Register → OTP verify → Exam choose → What to Study
→ Daily Drills try → Syllabus notes padho → Topic test → Results
→ Sticky notes likho → Reminder set karo
```

### Journey B — Roz ka revision

```
Login → What to Study (weak topics) → Daily Drills / Revision Deck
→ Galat sawal → AI Explain → Wrong log clear
```

### Journey C — Full mock weekend

```
Login → Full Mocks → Start → Submit → Performance / Analytics check
```

### Journey D — Competition practice

```
MCQ Battle → subject → 20Q timed → score submit → leaderboard
```

### Journey E — Admin content setup

```
Admin login → Exam subjects map → Question bank upload
→ Official syllabus topics/notes → Mock pattern set
→ Institute CSV export (optional)
```

---

## 7. Data kahan rehti hai?

### Server (MongoDB) — account ke saath sync

Users, OTP, topic progress, mock progress, subjects/topics/questions, vocab, mocks, TCS question bank, competition scores, exam config, reminders & notifications.

### Sirf browser (local) — sync nahi

Sticky notes, wrong-question log, exam targets / onboarding flags, mock section limits (client), notes bookmarks & reading prefs, FAB position.

---

## 8. API cheatsheet (tech)

Base path: `/api` (+ root `/health`)

**Auth (public):** register, login, otp request/verify, password forgot/reset, google  
**Auth (logged in):** `/me`, progress, mock-progress, exports, admin summary  
**Study:** subjects, topics, notes, test, vocab (+ bulk)  
**Drill / AI:** `/drill/next`, `/drill/verify`, `/drill/related`, `/ai/explain`  
**Mock:** `GET/POST /mock`, `GET/DELETE /mock/:id`  
**Competition:** questions, submit, leaderboard  
**Exam config:** `GET /exam-config`, `PUT /exam-config/:examId` (admin)  
**Questions:** TCS stats + bulk (admin)  
**Reminders:** CRUD + notifications list/read/test  
**Legacy:** `/prep/*` (demo notes — primary UI nahi)

---

## 9. Code folder map (tech)

```
SSC/
  frontend/src/features/
    auth/          → login, register, OTP, Google
    home/          → What to Study, ExamPicker
    drills/        → Daily Drills + wrong log
    study/         → Syllabus, sticky notes, revision
    exam/          → Topic ExamPortal + Results
    mock-tests/    → Full mocks
    analytics/     → Performance + Analytics
    competition/   → MCQ Battle
    reminders/     → Reminders
    admin/         → Admin panel
    dashboard/     → Shell, Sidebar, activeView
  frontend/src/shared/   → brand, exam profiles, context, services
  backend/src/modules/   → auth, study, drill, mock, ai, competition,
                            exam-config, questions, reminders, prep
```

---

## 10. Quick FAQ

**Q: Mobile pe chalega?**  
Haan — responsive UI, hamburger menu, Android back handling (in-app history).

**Q: Notes dusre phone pe dikhenge?**  
Syllabus / My Notes (server) → haan (login ke baad). Sticky notes → nahi (local only).

**Q: AI har sawal pe?**  
Nahi — mainly Daily Drills ke **wrong log** pe “Explain with AI”.

**Q: Payment?**  
Nahi — koi billing module nahi.

**Q: URL change nahi hota kyun?**  
SPA view state se navigate hota hai; React Router paths nahi.

---

## 11. Summary

ExamPrep = multi-exam practice LMS:

1. Login / OTP / Google  
2. Exam choose  
3. Daily drills + AI on wrong  
4. Syllabus notes + topic tests  
5. Sticky notes (local)  
6. Revision deck (tables + vocab)  
7. Full mocks  
8. Performance + Analytics  
9. MCQ Battle + leaderboard  
10. Reminders (app + email)  
11. Admin: subjects, questions, exports  

Is document ko students onboarding aur developers onboarding dono ke liye base guide ki tarah use karo.
