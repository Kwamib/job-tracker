# Job Pipeline Tracker

A personal job application tracker built for the active DevOps/Cloud job search. Track applications, interviews, rejections, and ghostings — with confetti, sound effects, a kanban board, and a motivational mode for when the pipeline gets rough.

Built with React + Vite. All data stays in your browser via localStorage — no backend, no accounts, no data leaving your machine.

---

## Features

**Core**
- Add, edit, and delete job applications
- Track company, role, salary, location, date applied, source, and notes
- Inline status updates per row
- Full notes modal with live editing
- CSV export for backups
- localStorage persistence — survives page refresh

**Views**
- List view — sortable table with search and status filters
- Kanban board — drag cards between columns to update status

**Personality**
- Scrolling motivational ticker that escalates as rejections pile up
- ✦ Motivate button — context-aware motivations that hit different
- 🔥 Roast button — reads your pipeline stats back to you
- Confetti bursts per status change (Offer goes wild, Ghosted fades quietly)
- Sound effects per status (fanfare for Offer, sad trombone for Rejected)
- Toast notifications on every status change
- Dark / light mode toggle

---

## Stack

- React 18
- Vite
- Web Audio API (sounds, no library)
- Canvas API (confetti, no library)
- localStorage (persistence, no backend)

Zero external UI dependencies.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/job-tracker.git
cd job-tracker

# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
job_tracker/
├── public/
├── src/
│   ├── App.jsx           # Entry point — imports JobTracker
│   ├── job-tracker.jsx   # Full app — single component
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## Deploy to Vercel

**Option A — CLI**
```bash
npm i -g vercel
vercel
```

**Option B — Dashboard**
1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import repo → Framework: Vite (auto-detected)
4. Deploy

You'll get a shareable URL. Each visitor has their own private localStorage — no data is shared between users.

---

## Data & Privacy

All data is stored in `localStorage` under the key `job-tracker-v1`. Nothing is sent to any server. Clearing your browser storage will wipe your data — export to CSV regularly as a backup.

---

## Roadmap

- [ ] Supabase integration for multi-device sync
- [ ] Interview date tracker with countdown
- [ ] Weekly application streak counter
- [ ] Pipeline conversion chart

---

## License

MIT
