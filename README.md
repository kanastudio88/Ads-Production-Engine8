# Studio8 Production Engine
https://ai.studio/apps/8bf8bc34-4207-47da-a438-db3325261201 untuk review
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![InDesign CS5.5 ExtendScript](https://img.shields.io/badge/Adobe_InDesign-CS5.5_%2F_CC_JSX-FF3366?style=for-the-badge&logo=adobeindesign&logoColor=white)](https://www.adobe.com/products/indesign.html)
[![PDF/X-1a Compliant](https://img.shields.io/badge/PDF%2FX--1a-300_DPI_Print_Ready-DC2626?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://www.iso.org/standard/29043.html)
[![Firebase Firestore](https://img.shields.io/badge/Firebase_Firestore-Cloud_Synced-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

**Studio8 Production Engine** is an editorial and artwork automation platform purpose-built for newspaper prepress, legal notice formatting, classified advertisement layout, and high-throughput production floors (specifically optimized for **New Straits Times Press (NSTP)** publications: **New Straits Times (NST)**, **Berita Harian (BH)**, and **Harian Metro (HM)**).

The application pairs a browser-based **Adobe InDesign CS5.5-style WYSIWYG canvas** with a multi-column **Auto-Fit Engine**, Malaysian legal notice text classification, native **InDesign ExtendScript (`.jsx`)** export, **Print-Ready PDF/X-1a (300 DPI)** generation, an **8-seat live production floor presence tracker**, a **daily job summary sheet**, and a centralized **traffic controller**.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Newspaper Publication Formats & Presets](#-newspaper-publication-formats--presets)
- [System Architecture](#-system-architecture)
- [Workspace & InDesign Canvas Engine](#-workspace--indesign-canvas-engine)
- [Auto-Fit & Legal Text Classifier](#-auto-fit--legal-text-classifier)
- [8-Seat Production Floor & Daily Summary](#-8-seat-production-floor--daily-summary)
- [Traffic Dispatcher & Master Sheet Integration](#-traffic-dispatcher--master-sheet-integration)
- [Export Pipeline (InDesign `.jsx` & PDF/X-1a)](#-export-pipeline)
- [Keyboard Shortcuts Cheat Sheet](#-keyboard-shortcuts-cheat-sheet)
- [Getting Started & Local Installation](#-getting-started--local-installation)
- [Available Scripts](#-available-scripts)
- [Environment Variables](#-environment-variables)
- [License & Contributing](#-license--contributing)

---

## 🚀 Key Features

### 1. InDesign CS5.5-Style Layout Workspace
- **True WYSIWYG Canvas**: Real-time rendering with typographic millimeter (`mm`) positioning and point (`pt`) font scaling.
- **Precision Bounding Box**: 8-point interactive resize handles and frame drag mechanics matching desktop InDesign CS5.5.
- **Multi-Column Flow**: 1 to 4 newspaper columns with micro-gutter calibration (0.05 mm to 4.0 mm).
- **Rule & Border Styles**: Solid, dashed, dotted, double, and classic Oxford border rules (0.25 pt up to 3.0 pt).
- **Measurement Overlays**: Interactive horizontal and vertical rulers, snap guides, baseline grids, and margin bounds.
- **Viewport Modes**:
  - `Normal`: Standard layout with frame borders, column guides, and bounding handles.
  - `Preview` (`W`): Clean presentation mode hiding frame guides.
  - `Newsprint Simulation`: High-fidelity warm 45 gsm newsprint paper stock simulation with subtle ink spread.
  - `Print Preview`: Live crop marks, registration marks, density bars, and color calibration patches.
- **N-Up Imposition Modes**: 1-Up single page, 2-Up spread, and 4-Up gang-run preview.

### 2. Auto-Fit Engine & Text Classification
- **Zero-Overset Solver**: Automatically balances text length against frame area (`width × height`), calculating optimum font size (4.0 pt – 14.0 pt) and line leading (5.0 pt – 18.0 pt).
- **Optical Density Meter**: Live calculation of character density percentage (70% – 100%) to prevent excessive whitespace or illegible over-packing.
- **Malaysian Legal Notice AI / Regex Classifier**:
  - **Mahkamah (Court Notice)**: Automatically detects High Court / Sessions Court notices (`Dalam Mahkamah Majistret / Tinggi`, `Guaman Sivil`, `Saman Pemula`, `Plaintif`, `Defendan`), separating the official Kicker, Title, Case Number, Subheader, and Body.
  - **Penggulungan (Winding-Up)**: Companies Act 2016 corporate liquidation and creditor notices.
  - **Tender (Kenyataan Tender)**: Government and statutory board procurement bids.
  - **Lelongan (Public Auction)**: Proclamation of sale / Perisytiharan Jualan.
  - **Editorial / Am**: General public announcements and classified advertisements.

### 3. Native Adobe InDesign CS5.5 / CC ExtendScript (`.jsx`) Export
- Generates standard Adobe ExtendScript that can be executed directly inside **Adobe InDesign CS5.5, CS6, or Adobe InDesign 2020–2026**.
- Automatically creates:
  - Exact millimeter page bounds (`[y1, x1, y2, x2]`).
  - Text frames with target column count and column gutters.
  - Formatted paragraphs with applied fonts, exact point size, leading, full justification (`Justification.JUSTIFY_FULL`), and frame stroke weight.

### 4. Print-Ready PDF/X-1a (300 DPI) Generator
- Built with `jspdf` to generate print-compliant A4/newspaper artwork:
  - 4-corner crop marks (5 mm length, 0.15 pt stroke).
  - Registration crosshairs and bleed safety boundaries (3 mm bleed default).
  - CMYK density calibration strip (Cyan, Magenta, Yellow, Black, 50% K, 25% K).
  - Production slug line with date, timestamp, operator seat, publication code, and document checksum.

### 5. 8-Seat Production Floor Presence
- Designed for an 8-operator editorial prepress desk:
  - **DESK 01**: Team Lead (Alex Chen)
  - **DESK 02**: Senior Designer (Sarah Jenkins)
  - **DESK 03**: Typesetter (Marcus Vance)
  - **DESK 04**: Production Artist (Elena Rostova)
  - **DESK 05**: Production Artist (David Kim)
  - **DESK 06**: QC Specialist (Priya Patel)
  - **DESK 07**: Editorial Artist (Lucas Meyer)
  - **DESK 08**: Junior Typesetter (Amina Yusuf)
- Live online/offline toggle, active desk switching, and frame lock ownership to prevent simultaneous collisions.

### 6. Daily Job Summary & Shift Archiving
- Daily audit dashboard tracking jobs processed per operator across 3 core NSTP publications:
  - **New Straits Times (NST)**: Current Edition & Advanced Edition tallies.
  - **Berita Harian (BH)**: Current Edition & Advanced Edition tallies.
  - **Harian Metro (HM)**: Current Edition & Advanced Edition tallies.
- Real-time cell edits, quick increment (`+1` / `-1`), automated total recalculation, and end-of-shift archive records stored in browser storage for audit history.

### 7. Central Traffic Controller & Master Sheet Integration
- Production queue dispatcher with priority filters (`CRITICAL`, `HIGH`, `NORMAL`).
- Status lifecycle: `PENDING` ➔ `IN_PROGRESS` ➔ `PROOFING` ➔ `APPROVED` ➔ `RELEASED`.
- Direct link and one-click sync to the **Google Sheets Master Job Traffic Controller**.
- Quick job push: Automatically assigns jobs and increments the corresponding operator's Daily Summary tally.

### 8. Production Floor Team Chat
- Real-time inter-desk communication channels:
  - `#production-floor` (General production workflow)
  - `#urgent-proofs` (Fast turnaround legal ads)
  - `#shift-handover` (Morning / Night shift baton pass)
- Direct tagging of job codes (e.g. `WA-A72NCvC`, `10x2 · 0.5pt Border`).

### 9. Multi-User Authentication & Account Creation (Firebase Auth)
- Full **Sign Up (Daftar Akaun)** and **Log In (Log Masuk)** system powered by Firebase Authentication.
- Each operator can create their own account with:
  - Full Name, Email, and secure Password.
  - Dedicated prepress workstation/desk selection (DESK 01 to DESK 09 / Night Shift).
  - Production role (Lead Prepress, Senior Typesetter, Production Artist, Quality Controller, etc.).
  - Profile avatar badge color.
- Automatic creation and real-time syncing of user profiles in Firestore (`/users/{uid}` and `/team_members/{uid}`).
- Quick Floor Seat Switcher for rapid terminal swaps during shift handovers.

### 10. Firebase Cloud Saved Links Manager (Pautan Tersimpan)
- Centralized cloud repository for all editorial and prepress URLs stored in Firebase Firestore (`/saved_links` and `/app_settings/traffic_config`):
  - **NSTP Master Traffic Control Spreadsheet** (real-time cross-client syncing).
  - **e-Kehakiman Malaysian Court Notice Portal**.
  - **SSM e-Info & Winding-Up / Liquidation Register**.
  - **MyPROCUREMENT Government Tender Gazette**.
  - **High-Res Prepress Google Drive Folders**.
- Add, edit, pin, copy, and launch links with one click.
- Real-time live synchronization across all connected operators.

---

## 📐 Newspaper Publication Formats & Presets

Studio8 comes pre-configured with standardized Malaysian newspaper column formats:

| Format Code | Format Name | Dimensions ($W \times H$) | Columns | Standard Font / Leading | Typical Usage |
|:---|:---|:---|:---:|:---:|:---|
| **10x1** | Single Column Notice | $30\,\text{mm} \times 100\,\text{mm}$ | 1 | 5.0 pt / 6.8 pt | Simple court mentions, general public notices |
| **10x2** | Standard Quarter Column | $63\,\text{mm} \times 100\,\text{mm}$ | 2 | 5.0 pt / 6.8 pt | Standard Malaysian court citations, bankruptcy notices |
| **15x2** | Standard Half-Page V | $63\,\text{mm} \times 150\,\text{mm}$ | 1–2 | 5.0 pt / 6.8 pt | Writ of Summons, detailed court affidavits |
| **20x2** | Tall Double Column | $63\,\text{mm} \times 200\,\text{mm}$ | 2 | 5.0 pt / 6.8 pt | Corporate winding-up notices, creditor meetings |
| **12x3** | Wide Banner Notice | $96\,\text{mm} \times 120\,\text{mm}$ | 3 | 5.5 pt / 7.2 pt | Government and institutional tender notices |
| **18x3** | Large Display Notice | $96\,\text{mm} \times 180\,\text{mm}$ | 3 | 5.5 pt / 7.2 pt | High Court proclamations of sale, multi-defendants |
| **Full Pg** | Broadsheet Full Notice | $210\,\text{mm} \times 297\,\text{mm}$ | 4 | 6.0 pt / 8.0 pt | Full-page government gazettes, statutory accounts |

---

## 🏗 System Architecture

```
studio8-production-engine/
├── index.html                   # HTML entry point with Newsreader/Cinzel/Inter webfonts
├── metadata.json                # Project capabilities & permissions manifest
├── package.json                 # Dependencies & build scripts
├── tsconfig.json                # TypeScript strict bundler configuration
├── vite.config.ts               # Vite 8 + Tailwind CSS v4 + React configuration
├── .env.example                 # Environment configuration template
│
└── src/
    ├── main.tsx                 # React DOM mount point
    ├── App.tsx                  # Root controller, seat session state, persistence & modals
    ├── index.css                # Tailwind CSS v4 imports
    ├── types.ts                 # Full TypeScript definitions (LayoutDocument, TrafficJob, etc.)
    │
    ├── components/
    │   ├── Header.tsx           # Top navigation bar, active seat switcher, preflight button
    │   ├── Sidebar.tsx          # Floor navigation (Workspace, Summary, Traffic, Chat)
    │   ├── Logo.tsx             # Studio8 brand vector badge
    │   ├── LoginModalOrPage.tsx # 8-Seat operator PIN / desk login screen
    │   │
    │   ├── Workspace/
    │   │   ├── WorkspaceView.tsx        # Main layout orchestration & undo/redo stack
    │   │   ├── InDesignCanvas.tsx       # WYSIWYG canvas, rulers, handles & viewport rendering
    │   │   ├── ControlStrip.tsx         # Top InDesign CS5.5 contextual typography & frame strip
    │   │   ├── AutoFitInspector.tsx     # Right inspector panel (Presets, border, auto-fit)
    │   │   ├── PasteAutoFitModal.tsx    # Raw copy paste with instant Malaysian notice parser
    │   │   ├── PreflightModal.tsx       # Automated pre-press sanity and overset diagnostics
    │   │   ├── HistorySnapshotsModal.tsx# Version snapshots & rollbacks
    │   │   └── ShortcutsModal.tsx       # InDesign CS5.5 hotkey guide
    │   │
    │   ├── DailySummary/
    │   │   └── DailySummaryPage.tsx     # NSTP Daily Job Tracker & Shift Archive Manager
    │   │
    │   ├── TrafficController/
    │   │   └── TrafficControllerModal.tsx # Traffic dispatch queue & Google Sheets sync
    │   │
    │   └── TeamChat/
    │       └── TeamChatView.tsx         # Production floor messaging with job tag attachments
    │
    ├── data/
    │   ├── adPresets.ts         # Standard newspaper ad format geometries
    │   ├── sampleCopies.ts      # Malaysian court notices, tender samples & mock jobs
    │   ├── teamMembers.ts       # 8-seat team members and baseline metrics
    │   └── teamChatData.ts      # Initial production channel messages
    │
    └── utils/
        ├── idmlExport.ts        # Adobe InDesign CS5.5 ExtendScript (.jsx) generator
        ├── pdfExport.ts         # High-resolution PDF/X-1a & PNG proof exporter
        └── textClassifier.ts    # Malaysian legal notice AI / regex pattern classifier
```

---

## 🖥 Workspace & InDesign Canvas Engine

The workspace faithfully mirrors desktop InDesign CS5.5 ergonomics:
1. **Interactive Geometry**:
   - `posX` & `posY`: Millimeter coordinate placement on the A4 / broadsheet canvas.
   - `frameWidth` & `frameHeight`: Precise bounding box dimensions.
   - Real-time drag & resize using 8 standard handles (top, bottom, left, right, and corners).
2. **Typography Controls**:
   - Font family switching (`Helvetica`, `Newsreader / Times`, `Cinzel / Garamond`, `JetBrains Mono`).
   - Micro font size adjustment in 0.1 pt increments.
   - Leading / line height adjustment in 0.1 pt increments.
   - Tracking adjustment in 1/1000 em.
   - Paragraph alignment: Left, Center, Right, Justify with last line left, Full Justify (`justify-all`).
   - First-line indent (`firstLineIndentMm`) and paragraph spacing (`paragraphSpacingMm`).
3. **Preflight Diagnostics**:
   - Automated detection of text overset (text overflowing frame boundary).
   - Warning if body text falls below legal minimum size (< 4.5 pt).
   - Verification of stroke width and registration safety margins.

---

## ⚡ Auto-Fit & Legal Text Classifier

To expedite the turnaround of late-breaking court notices and emergency tenders:

1. Click **"Paste & Auto-Fit"** or press `Ctrl + Alt + C`.
2. Paste raw unformatted text received from solicitors, government agencies, or classifieds booking desks.
3. The engine will:
   - Run `classifyAndAutoParseText()`.
   - Identify whether the notice belongs to High Court / Subordinate Court / Liquidator / Tender.
   - Automatically split the copy into:
     - **Kicker / Court Header**: e.g., `DALAM MAHKAMAH MAJISTRET DI KUALA LUMPUR... GUAMAN SIVIL NO: WA-A72NCvC-3158-07/2026`
     - **Title**: e.g., `NOTIS IKLAN` or `KENYATAAN TENDER`
     - **Subheader**: e.g., `(Dalam perkara mengenai Writ Saman bertarikh...)`
     - **Body Text**: Cleaned legal copy with proper line wrapping.
   - Compute the exact character-to-area ratio.
   - Calculate and apply the optimal font size and leading so the copy fits cleanly with zero overset.

---

## 👥 8-Seat Production Floor & Daily Summary

Editorial production requires tight tracking across shifts:
- Each workstation corresponds to one of the **8 authorized seats**.
- Operators can log in with their assigned desk, locking artwork frames during active editing.
- **Daily Summary Table**:
  - Live counts for **NST Current**, **NST Advanced**, **BH Current**, **BH Advanced**, **HM Current**, and **HM Advanced**.
  - Total jobs processed automatically aggregated.
  - End-of-shift **"Archive & Reset Daily Jobs"** captures a permanent historical record with date, total count, active desks, and auditor signature.

---

## 🚦 Traffic Dispatcher & Master Sheet Integration

- Incoming jobs can be queued with target publication, category, assigned operator, deadline, and priority.
- One-click launch connects operators directly to the **Google Sheets Master Traffic Control** document.
- Once an operator marks a job as `APPROVED` or `RELEASED`, the engine can auto-increment their daily quota on the summary sheet.

---

## 📤 Export Pipeline

### 1. Adobe InDesign CS5.5 / CC ExtendScript (`.jsx`)
Click **Export ➔ InDesign (.jsx)**. The resulting script can be loaded via:
- InDesign: `Window` ➔ `Utilities` ➔ `Scripts` ➔ Double-click the generated `.jsx` file.
- It will instantly construct the native document, set units to millimeters, build the text frame, assign stroke colors, populate formatted paragraphs, and set typography.

### 2. Print-Ready PDF/X-1a (300 DPI)
Click **Export ➔ PDF/X-1a** (or press `Ctrl + E`):
- Generates a vector PDF with full CMYK crop marks, registration crosses, and production slug metadata.
- Suitable for direct digital plate exposure (CTP - Computer to Plate) or remote editorial proofing.

### 3. Image Proof (`.png`)
- Generates a 300 DPI raster proof for immediate review in team chat or email confirmation with clients and solicitors.

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Shortcut | Action |
|:---|:---|
| <kbd>V</kbd> | **Selection Tool** (Move frame & 8-point resize handles) |
| <kbd>T</kbd> | **Type Tool** (Edit raw text & content fields) |
| <kbd>F</kbd> | **Rectangle Frame Tool** (Quick frame re-dimensioning) |
| <kbd>H</kbd> / <kbd>Space</kbd>+Drag | **Hand Tool** (Pan viewport canvas) |
| <kbd>W</kbd> | **Toggle Preview Mode** (Hide/show rulers and guidelines) |
| <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>C</kbd> | **Auto-Fit Frame to Text** (Instant zero-overset fit) |
| <kbd>Ctrl</kbd> + <kbd>E</kbd> | **Export Print-Ready PDF/X-1a** |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | **Undo** last layout adjustment |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>⇧</kbd><kbd>⌘</kbd><kbd>Z</kbd> | **Redo** layout adjustment |
| <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>Ctrl</kbd> + <kbd>-</kbd> | **Zoom In / Zoom Out** (50% to 200%) |
| <kbd>Ctrl</kbd> + <kbd>0</kbd> | **Fit Spread to Window** (Reset to 100%) |
| <kbd>?</kbd> | Open **Shortcuts Reference Dialog** |

---

## 💻 Getting Started & Local Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20.x or higher recommended)
- [npm](https://www.npmjs.com/) (version 10.x or higher) or [bun](https://bun.sh/)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/studio8-production-engine.git
cd studio8-production-engine
```

### 2. Install Dependencies
```bash
npm install
# or if using bun:
bun install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Provide `GEMINI_API_KEY` if utilizing server-side AI parsing capabilities).*

### 4. Run Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

---

## 🛠 Available Scripts

In the project root, you can run:

- `npm run dev` — Starts the local Vite development server on port 3000 (`0.0.0.0:3000`).
- `npm run build` — Compiles TypeScript and creates an optimized production bundle in `dist/`.
- `npm run preview` — Locally previews the production build.
- `npm run lint` — Runs TypeScript compiler diagnostics (`tsc --noEmit`) without emitting build files.
- `npm run clean` — Removes `dist/` and build artifacts.

---

## 🔐 Environment Variables

The project uses standard Vite environment configuration:

| Variable | Description |
|:---|:---|
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for advanced language parsing and automation. |
| `APP_URL` | Public URL where the application is hosted (configured in Cloud Run / hosting environments). |

---

## 📦 Tech Stack

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/) with `@vitejs/plugin-react`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **PDF Engine**: [jsPDF 4.x](https://github.com/parallax/jsPDF)
- **Icons**: [Lucide React](https://lucide.dev/) & [Google Material Symbols](https://fonts.google.com/icons)
- **Motion & FX**: [Motion](https://motion.dev/) & [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Automation Targets**: Adobe InDesign CS5.5, CS6, CC 2026 ExtendScript (`.jsx`)

---

## 📄 License & Credits

Built for editorial automation, newspaper classifieds composition, and prepress production engineering at **New Straits Times Press (NSTP)**.

All rights reserved © 2026 Studio8 Prepress & Automation Hub.
