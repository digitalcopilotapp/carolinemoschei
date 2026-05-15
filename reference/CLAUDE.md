# Caroline Moschei — Project Guide

## Quick Start

```bash
# 1. Start frontend (from project root)
python -m http.server 8000

# 2. Start backend (requires Docker)
cd docker && docker-compose up -d

# 3. Open in browser
# Main link-in-bio: http://localhost:8000/index.html
# Lives page:      http://localhost:8000/site/lives.html
# Admin panel:     http://localhost:8000/site/admin-lives.html
```

## Admin Credentials
- **Email**: admin@carolinemoschei.com
- **Password**: admin123
- Works on both lives.html login (redirects to admin) and admin-lives.html directly

## Architecture

### Frontend (Static HTML/CSS/JS)
- `index.html` — Main link-in-bio page (CSS inline in `<style>` tag, NOT external file)
- `site/` — All product/course pages:
  - `site/lives.html` — Lives player with YouTube embed, custom controls, lead capture, Verso & Reverso ad overlay
  - `site/admin-lives.html` — Admin panel for managing lives and viewing leads
  - `site/verso-e-reverso.html` + `site/verso.css` — Course landing page
  - `site/combo-tratamento.html` — Combo workshop page
  - `site/presets.html` — Presets sales page with pack carousels
  - `site/collab-guia-viagem/index.html` — Travel guide collab page
  - `site/guia-*.html` — Individual guide pages (use `site/guia.css`)
- `fotos-optimized/` — WebP images for index.html (converted from original PNGs)
- `site/portfolio/` — Portfolio images (WebP only)

### Backend (Docker — Node/Express + SQLite)
- `docker/backend/server.js` — API server
- `docker/backend/package.json` — Dependencies
- `docker/backend/Dockerfile` — Container definition
- `docker/docker-compose.yml` — Docker orchestration
- Database auto-creates on first run at `data/lives.db` inside container
- Seeds 3 initial lives and admin account automatically

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/register | - | Create user (name, email, phone?, password) |
| POST | /api/login | - | Login (checks admins first, then users) |
| GET | /api/me | Bearer token | Get profile |
| PUT | /api/me | Bearer token | Update profile (name, email, phone, password) |
| POST | /api/me/avatar | Bearer token | Upload avatar (base64 image) |
| POST | /api/logout | Bearer token | Logout |
| GET | /api/lives | - | List active lives (public) |
| GET | /api/admin/lives | admin token | List all lives |
| POST | /api/admin/lives | admin token | Create live |
| PUT | /api/admin/lives/:id | admin token | Update live |
| DELETE | /api/admin/lives/:id | admin token | Delete live |
| GET | /api/admin/users | admin token | List all registered users/leads |

## Design System

### Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Ink | #080808 | --ink | Dark backgrounds |
| Bone | #F0EBE3 | --bone | Text on dark |
| Cream | #FAF4ED | --cream | Light backgrounds |
| Caramel | #C8956C | --caramel | CTAs, accents, borders |
| Gold | #D4A574 | --gold | Highlighted text |
| Warm Gray | #7A756F | --warm-gray | Secondary text |

### Typography
- **Display**: Cormorant Garamond (serif, weights 300-600)
- **Body**: Inter (sans-serif, weights 300-500)

### Photos
- 100% portrait orientation (~2:3 ratio)
- Always use WebP when available
- `object-position: center top` for people photos

## Critical Rules

### Carousel overflow constraint
Never put `overflow: hidden` on the element that receives `translateX`. Use a viewport wrapper pattern:
```
.carousel (position: relative, NO overflow)
  .carousel__viewport (overflow: hidden)
    .track (translateX animation)
  .arrows (outside viewport, visible)
```

### File editing
- `index.html` has CSS INLINE in a `<style>` tag — do NOT look for external CSS files
- The `fotos-optimized/` directory contains WebP versions of photos originally from `fotos carol/`
- If original PNGs are needed, they are NOT in this package (were 11GB)

### Lives system
- Frontend at `site/lives.html` connects to API at `http://localhost:3001/api/`
- Falls back to hardcoded lives if API is offline
- User auth tokens stored in localStorage as `carol_user_token`
- Admin tokens stored as `carol_admin_token`
- Ad overlay triggers at configurable seconds (per-live `data-ad` attribute)
