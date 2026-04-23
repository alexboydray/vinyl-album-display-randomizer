# Vinyl Album Display Randomizer

Upload a photo of your shelf, draw album slots on it, sign in with Discogs, and fill the slots with randomly picked covers from your collection. Lock individual slots so they stay put when you re-randomize.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Konva / react-konva for the canvas
- Zustand for state (with localStorage persistence)
- Discogs OAuth 1.0a via `oauth-1.0a` + `iron-session`
- `node-vibrant` for client-side dominant-color extraction

## One-time setup

1. **Register a Discogs app** at https://www.discogs.com/settings/developers → _Create an Application_.
   - Name: anything (e.g. `Vinyl Album Display Randomizer`)
   - Callback URL: `http://localhost:3000/api/auth/callback`
   - Copy the Consumer Key and Consumer Secret.

2. **Create `.env.local`** at the repo root (see `.env.example`):

   ```
   DISCOGS_CONSUMER_KEY=...
   DISCOGS_CONSUMER_SECRET=...
   DISCOGS_CALLBACK_URL=http://localhost:3000/api/auth/callback
   DISCOGS_USER_AGENT=VinylAlbumDisplayRandomizer/0.1 +your-email@example.com
   SESSION_PASSWORD=at-least-32-chars-random-string-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

   `SESSION_PASSWORD` is used by iron-session to encrypt the cookie — any 32+ char random string works.

3. **Install deps** (already done if you just scaffolded):

   ```
   npm install
   ```

## Run

```
npm run dev
```

Visit http://localhost:3000.

## How to use

1. Click **Upload Background Image** and pick a photo of your shelf / wall.
2. Drag on the canvas to draw album slots, or click **Add Album Template** for a default-sized slot in the center. Drag to move, use corner handles to resize, and click the **L/U** badge in the corner of each slot to lock/unlock it.
3. Click **Sign in with Discogs**. Approve the OAuth prompt. You land back on the page signed in as `@yourusername`.
4. Click **Load Collection**. The right sidebar fills with your collection thumbnails. Color extraction runs in the background.
5. Pick filters (Colour / Decade / Price / Genre) — the list shrinks to matching releases. (Price filter fetches marketplace data lazily, one release per second to stay under the Discogs rate limit.)
6. Click **Randomize!** — every unlocked slot gets a random cover from the filtered pool. Locked slots keep their current cover.
7. Click **Save Display as .jpg** to download a JPG of the composed view.

Layouts (background + slots + locks) persist in `localStorage`; reloading the page restores your setup.

## Verification checklist

- [ ] Page loads at http://localhost:3000 with the three-pane layout (header, canvas, right sidebar, bottom toolbar).
- [ ] Upload a background image → it appears behind the canvas.
- [ ] Drag on the canvas → a red dashed rectangle is drawn.
- [ ] Select a rectangle → it gets handles; drag to move, corners to resize.
- [ ] Click the L/U badge → the rectangle becomes locked (badge turns dark).
- [ ] Reload the page → background + rectangles + lock state are restored.
- [ ] Click **Save Display as .jpg** → a JPG downloads (do this after a Randomize to verify covers export too).
- [ ] Click **Sign in with Discogs** → redirected to Discogs → approve → back on `/` with `@username` in header.
- [ ] Click **Load Collection** → sidebar populates.
- [ ] Pick a Genre → list shrinks.
- [ ] Click **Randomize!** with a locked rectangle → unlocked rectangles update, the locked one doesn't.

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Home (renders <AppShell/>)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── auth/
│       │   ├── request/route.ts    # OAuth step 1
│       │   ├── callback/route.ts   # OAuth step 2 + identity lookup
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       └── discogs/
│           ├── collection/route.ts # paginated collection fetch
│           ├── release/[id]/route.ts
│           └── image/route.ts      # CORS-safe image proxy
├── components/
│   ├── AppShell.tsx                # three-pane layout wrapper
│   ├── Header.tsx                  # sign in, load collection
│   ├── DisplayCanvas.tsx           # Konva stage + rectangle drawing
│   ├── Toolbar.tsx                 # bottom buttons
│   ├── FilterPanel.tsx             # Colour / Decade / Price / Genre
│   ├── CollectionList.tsx
│   └── RandomizeButton.tsx
├── lib/
│   ├── oauth.ts
│   ├── discogs.ts                  # signed fetch + collection walker
│   ├── session.ts                  # iron-session config
│   ├── colors.ts                   # node-vibrant → color bucket
│   └── filter.ts
├── store/
│   └── useAppStore.ts              # zustand store + persist
└── types/
    └── index.ts
```

## Notes

- Cover images from `i.discogs.com` are proxied via `/api/discogs/image?url=...` so they don't taint the canvas (Konva requires same-origin or CORS-enabled images for `toDataURL`).
- Only collection folder `0` (All) is loaded. Supporting other folders would go in `src/lib/discogs.ts`.
- The Price filter hits the per-release endpoint lazily (one request per second) — for large collections, expect a wait before Price results populate.
