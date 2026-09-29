# KabadiConnect - SIH prototype (frontend + backend)

## Run
    cd backend && npm install && npm start      # API :3001 (auto-seeds SQLite), recycler portal http://localhost:3001/recycler
    cd .. && npm install && npm run dev          # UI (proxies /api to :3001)

Recycler demo logins (portal): r1/1111, r2/2222, r3/3333.

## Backend (backend/server.js, SQLite via better-sqlite3)
- Price board + history + trend + spoken text: GET /api/prices, /api/prices/history, /api/prices/speak
- Lots with instant estimate: POST /api/estimate, /api/lots (idempotent by client_id)
- Classification (keyword/on-device-label placeholder, swap in TFLite model): POST /api/classify
- Recycler ranking (authorized only, service area, rate, distance, pickup, rating): GET /api/match
- Signed handover record (HMAC, GPS, timestamp, photo) + public verify: POST /api/handover, GET /api/verify/:ref
- Recycler side: GET /api/recycler/pending, POST /api/recycler/confirm, /api/recycler/rates (header auth)
- Anomaly flag on confirm (price z-score >3 and >20% off mean, or weight mismatch >30%)
- Offline batch sync: POST /api/sync; earnings ledger: GET /api/ledger; safety: GET /api/safety
- Datasets CSV: /api/datasets/{materials,prices,recyclers,transactions,traceability}.csv
- Unit economics: GET /api/economics?kg_month=200

## Honest limitations
- Price history is SYNTHETIC seed data (60 days, 3 cities); replace with field-collected rates.
- Classifier is a placeholder; no trained image model yet. Anomaly detection is statistical, not ML.
- Economics uses assumed figures (informal = 70% of fair price, 3% platform fee); validate in field research.
- PINs/secret are demo values; set HANDOVER_SECRET in production.

## Image classifier (on-device, offline)
- `python ml/train.py` -> `public/model.json` (~30 KB). Merges: real photos in `ml/dataset/<category_id>/*.jpg`, field lots from `backend/kabadi.db`, and synthetic bootstrap images (`--no-synth` to disable).
- Browser (`src/classifier.ts`) runs the model with no network; feature code is parity-tested against Python (max diff ~2e-7).
- Every lot saves the model's prediction; `GET /api/ml/stats` reports field accuracy (prediction vs collector's final choice) and the count of labelled images ready for retraining.
- LIMITATION: the shipped model is trained on SYNTHETIC images only (92% on synthetic hold-out, which says nothing about real photos). Collect real photos in field research, then retrain.

## Safety cards
`src/Safety.tsx`: 5 pictorial DON'T/DO cards (burning cables, opening batteries, breaking CRTs, acid on PCBs, children near scrap) in English/Hindi/Marathi, inline SVG (no image downloads, works offline), tap-to-hear audio per card + "play all". Sidebar "Start voice guide" opens it.
