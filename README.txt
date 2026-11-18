NOVENAS NAVIDENAS 2026 — NETLIFY + NEON

1. In the NEW Neon project (novenas-2026), open SQL Editor and run schema.sql.
2. In the NEW Novenas Netlify site, set DATABASE_URL to that NEW Neon project's connection string, with secret value checked. Never put it in HTML or commit it to Git.
3. On your Mac, install Node.js (LTS) if not installed.
4. Unzip this project. Open Terminal and run:
   cd /path/to/Novenas2026_Neon
   npm install
   npx netlify login
   npx netlify link
   (Choose "Link this directory to an existing site" and select ONLY your Novenas site.)
   npx netlify deploy --prod --build
5. Open the existing Novenas .netlify.app address, reserve a test day, verify from another device, and delete the test reservation.

IMPORTANT: Dragging this ZIP into Netlify Drop is NOT the recommended way to deploy source-code functions. Netlify CLI builds and packages functions correctly. GitHub is not required.

SECURITY: Editing PINs are salted and hashed in the database, not visible in the browser. Short numeric PINs remain susceptible to guessing; do not use this app for sensitive information. Rate limiting is not implemented. The address is public to anyone with the URL; share the URL only with intended family members.
