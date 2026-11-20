# SkillSwap – Learn, Teach & Grow Together

SkillSwap is a skill-exchange platform where people trade what they know for what they want to learn, instead of paying for courses.

> **Don't pay to learn everything. Exchange what you know for what you want to learn.**

Sarah teaches photography and wants to learn English. John teaches English and wants to learn photography. SkillSwap matches them, they book sessions, and both of them learn.

This repository is a front-end React app. It ships with realistic sample members and data, and every interaction works in the browser. Your changes are saved in `localStorage`, so the demo keeps its state between visits.

---

## Features

| Area | What you can do |
| --- | --- |
| **Landing page** | Hero, quick "I can teach / I want to learn" matcher, how-it-works steps, live match showcase, popular skill categories, community stories, call to action |
| **Create / edit profile** | Name, location, bio, profile picture upload with preview, skills you can teach and want to learn (each with a Beginner / Intermediate / Advanced level), preferred method (Online / In person / Both), available days and times, live "how others see you" card, form validation |
| **Smart matching** | Matches on complementary skills. A **"Match Found!"** badge marks two-way matches, and results are ranked by shared free time, learning method and location |
| **Find partners** | Search by skill, name or city, filter by category, method, favorites and "perfect matches only", compare up to 3 profiles side by side, favorite people, send or withdraw connection requests |
| **Partner profile** | Side-by-side comparison of "can teach" and "wants to learn", weekly availability overlap grid, reviews, a suggested first session, favorite, message, request, report and block |
| **Dashboard** | Notifications, my skills, learning goals with progress, suggested partners, pending requests (accept / decline / withdraw), active exchanges, upcoming sessions, weekly learning chart, favorites, blocked members |
| **Messages** | Conversation list with unread counts and search, chat with quick replies, file sharing, session proposals you can accept or decline, a simulated partner reply, learning goals and shared-resources panel |
| **Sessions** | Schedule sessions (partner, focus, date over the next 14 days with shared-free days marked, time, 30–90 minute duration, online or in person with a meeting place, note), mark sessions complete, cancel, rate (1–5 stars, tags, written review), session history |
| **Community** | Post tips, success stories and questions, filter by type, like, reply, report posts, join the monthly challenge, trending skills, top teachers, guidelines and safety tips |
| **Platform** | Notification bell with mark-as-read, account menu (edit profile, favorites, reset demo data), toasts, 404 page, responsive layout from phone to desktop, keyboard and screen-reader friendly controls |

"Skills I Can Teach" always appear as **solid purple** chips. "Skills I Want to Learn" always appear as **dashed blue outlines**, so the two never look alike.

---

## Tech stack

- **[React 18](https://react.dev/)** with function components and hooks (`useState`, `useEffect`, `useMemo`, `useRef`, `useCallback`, `useContext`)
- **[React Router 6](https://reactrouter.com/)** for multi-page navigation
- **[Vite 5](https://vitejs.dev/)** for the dev server and production build
- **Plain CSS**: design tokens (CSS variables), shared UI primitives and one stylesheet per page. No CSS framework.
- **React Context** for app-wide state, persisted to `localStorage`
- **Plus Jakarta Sans**, loaded from Google Fonts
- Inline SVG icon set, so there are no image or icon dependencies

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) **18 or newer** (includes npm)

### Install and run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev
```

### Other scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create an optimised production build in `dist/` |
| `npm run preview` | Serve the production build locally (http://localhost:4173) |

---

## Project structure

```
skillswap/
├── index.html                # HTML entry (fonts, meta tags)
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── public/
│   └── favicon.svg           # App icon
└── src/
    ├── main.jsx              # React root, router and state provider
    ├── App.jsx               # Route table
    ├── styles/
    │   └── global.css        # Design tokens, base styles, buttons, chips, forms, toasts…
    ├── context/
    │   └── AppContext.jsx    # Global state and actions (persisted to localStorage)
    ├── hooks/
    │   ├── useMatches.js     # Ranked matches for the current profile
    │   └── useDocumentTitle.js
    ├── data/
    │   ├── users.js          # Sample community members
    │   ├── seed.js           # Initial demo state (sessions, messages, posts…)
    │   └── skills.js         # Categories, levels, days, times, avatar colors
    ├── utils/
    │   ├── matching.js       # Complementary-skill matching algorithm
    │   ├── progress.js       # Learning stats derived from sessions
    │   └── dates.js          # Date helpers
    ├── components/
    │   ├── layout/           # MarketingNav, AppNav, Footer, layouts
    │   ├── PartnerCard.jsx   # Interactive match card
    │   ├── Avatar.jsx, Icon.jsx, Logo.jsx, MatchBadge.jsx, SkillChip.jsx
    │   ├── ToggleGroup.jsx, StarRating.jsx, ProgressBar.jsx
    │   ├── Modal.jsx, ReportDialog.jsx, Toasts.jsx, ScrollToTop.jsx
    └── pages/
        ├── Home.jsx          # /
        ├── Signup.jsx        # /signup
        ├── Match.jsx         # /match
        ├── Profile.jsx       # /profile/:userId
        ├── Dashboard.jsx     # /dashboard
        ├── Messages.jsx      # /messages and /messages/:userId
        ├── Sessions.jsx      # /sessions
        ├── Community.jsx     # /community
        └── NotFound.jsx      # any other URL
```

Each page has a matching `.css` file next to it.

---

## How matching works

`src/utils/matching.js` compares your profile with each member:

1. **Perfect match**: they teach something you want **and** want something you teach. These are shown with the "Match Found!" badge.
2. **Wants your skill** or **Teaches what you want**: a one-way fit.
3. **Study buddy**: you're both learning the same thing.

The score then adds points for overlapping free time slots, compatible learning methods (Online / In person / Both) and living in the same city. Edit your profile and the matches update immediately.

---

## Demo data

- The app starts logged in as **Sarah Malik**, who teaches Photography and wants to learn English.
- All changes (profile, requests, messages, sessions, reviews, posts) are saved in your browser's `localStorage`.
- To start over, open the **account menu** (your avatar, top right) and choose **Reset demo data**.
- There is no backend. "Log in" and "Log out" are navigation only, and partner replies in Messages are simulated.

---

## Upload to GitHub

```bash
git init
git add .
git commit -m "Initial commit: SkillSwap React app"
git branch -M main
git remote add origin https://github.com/<your-username>/skillswap.git
git push -u origin main
```

`node_modules/` and `dist/` are already listed in `.gitignore`.

### Deploying

The app uses client-side routing (`BrowserRouter`). When you host the `dist/` folder, tell your host to serve `index.html` for every route:

- **Netlify:** add a `public/_redirects` file containing `/*  /index.html  200`
- **Vercel:** works out of the box for Vite projects
- **GitHub Pages:** set `base: '/<repo-name>/'` in `vite.config.js` and add a `404.html` copy of `index.html`, or switch to `HashRouter` in `src/main.jsx`

---

## License

Use it, change it and learn from it. Add the license of your choice before you publish.
