# Harvest

A Frankenstein body-building Pokemon roguelike game played in a web browser.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Auth, Firestore)
- **Deployment**: Vercel (production) / GitHub Pages (preview)

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Firebase configuration to `.env.local`:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing
   - Go to Project Settings > General > Your apps
   - Copy the config values to `.env.local`

### Development

```bash
npm run dev
```

This starts the Vite development server at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Honeydew | `#dff8eb` | Success, health, positive accents |
| Dusty Taupe | `#96897b` | Secondary text, borders, neutral |
| Cherry Rose | `#9e1946` | Danger, warnings, primary actions |
| Shadow Grey | `#1d1e2c` | Card backgrounds, elevated surfaces |
| Prussian Blue | `#020122` | Page background, deepest layer |

## Typography

- **Display**: Love Ya Like A Sister (Google Fonts)
- **UI/Body**: Inter (Google Fonts)

## Security

This project follows security best practices:

- ✅ Environment variables for all secrets
- ✅ `.gitignore` configured to prevent secret commits
- ✅ GitHub Actions with vulnerability auditing
- ✅ Secret scanning in CI pipeline

**Never commit `.env.local` or any files containing API keys.**

## License

Private
