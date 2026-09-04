# Deployment — Hostinger VPS + mobile APK

The **mobile app is never "uploaded to the server"**. What you do is:

1. push the **backend** (and web client) updates to the VPS,
2. expose the API over **HTTPS** on a real domain,
3. **build an APK** that points at that HTTPS URL,
4. hand the APK to users (or upload to Play Store).

Android release builds **block plain `http://`**, so step 2 (real TLS) is mandatory — the app cannot talk to `http://<ip>:4000` once it's a standalone APK.

Assumed layout on the VPS (matches the current install):

| | |
|---|---|
| App directory | `/var/www/Hostel-Complaints` |
| Process manager | `pm2`, process name `hostel-complaints` |
| Git remote | `https://github.com/itcellgit/Hostel-Complaints.git` |
| DB | PostgreSQL (Docker via `docker-compose.yml`, or system Postgres) |
| Node | 18+ (20 LTS recommended) |

---

## 0. From your dev machine — push the code

```bash
cd f:/hostel_complaints
git add -A
git commit -m "Mobile app + push notifications + admin flows"
git push origin main
```

---

## 1. Backend deploy on the VPS

SSH in (`ssh root@<vps-ip>`), then:

```bash
cd /var/www/Hostel-Complaints
git pull origin main

# --- database must be up first ---
# Option A: Docker (uses docker-compose.yml at the repo root)
docker compose up -d
# Option B: system Postgres — make sure it's running and DATABASE_URL points to it

# --- server ---
cd server
npm ci                       # clean install from package-lock
npx prisma migrate deploy    # applies the Device table + any pending migrations
npx prisma generate          # regenerate the client for the new schema

# --- restart ---
pm2 restart hostel-complaints --update-env
pm2 save
pm2 logs hostel-complaints --lines 40   # confirm it booted clean
```

### 1a. First-time pm2 setup (skip if already running)

```bash
cd /var/www/Hostel-Complaints/server
pm2 start src/index.js --name hostel-complaints
pm2 startup systemd            # run the command it prints
pm2 save
```

---

## 2. Environment file — `/var/www/Hostel-Complaints/server/.env`

```ini
DATABASE_URL="postgresql://hostel_admin:STRONG_PASSWORD@localhost:5432/hostel_complaints?schema=public"

NODE_ENV=production
HOST=127.0.0.1          # bind to localhost only; Nginx is the public face
PORT=4000

# Comma-separated. Add every browser origin that will call the API.
# The mobile app sends no Origin header and is unaffected by this.
CLIENT_ORIGIN="https://hostel.git.edu"

JWT_ACCESS_SECRET="<64+ random chars>"
JWT_REFRESH_SECRET="<different 64+ random chars>"
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="30d"
```

Generate secrets: `openssl rand -hex 48`.
After editing: `pm2 restart hostel-complaints --update-env`.

> `HOST=127.0.0.1` + a firewall rule (step 5) means port 4000 is **not**
> reachable from the internet directly — only through Nginx/HTTPS.

---

## 3. DNS

In your DNS provider (or Hostinger's DNS panel) add an **A record**:

| Type | Name | Value |
|---|---|---|
| A | `hostel` (→ `hostel.git.edu`) | `<your VPS IPv4>` |

Use one hostname for both the web app and the API (the API lives under `/api`).
Wait for it to resolve: `dig +short hostel.git.edu`.

---

## 4. Nginx reverse proxy + HTTPS

Install if needed: `apt update && apt install -y nginx`.

Create `/etc/nginx/sites-available/hostel`:

```nginx
server {
    listen 80;
    server_name hostel.git.edu;

    # Uploaded complaint / resolution photos — served straight off disk.
    location /uploads/ {
        alias /var/www/Hostel-Complaints/server/uploads/;
        expires 7d;
        access_log off;
    }

    # API
    location /api/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Web client (static build). If you don't deploy the web app, delete this block.
    location / {
        root  /var/www/Hostel-Complaints/client/dist;
        try_files $uri /index.html;
    }

    # Room for the 5 MB image uploads (default is 1 MB).
    client_max_body_size 12m;
}
```

Enable + reload:

```bash
ln -s /etc/nginx/sites-available/hostel /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### TLS with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d hostel.git.edu --redirect --agree-tos -m it@git.edu --no-eff-email
```

Certbot rewrites the `listen 80` block to add `listen 443 ssl` + a redirect,
and installs a renewal timer. Verify: `curl -I https://hostel.git.edu/api/health`
→ should return `200` and `{"status":"ok"}`.

---

## 5. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'      # 80 + 443
ufw enable
# port 4000 is NOT opened — only Nginx reaches it via localhost
```

If Postgres runs in Docker, make sure it isn't published to `0.0.0.0`.
For a VPS, bind it to localhost in `docker-compose.yml`:
`ports: ["127.0.0.1:5432:5432"]`.

---

## 6. Web client build (optional — only if you serve the web app too)

On the VPS:

```bash
cd /var/www/Hostel-Complaints/client
npm ci
# The web client calls /api on its own origin, so no API URL to configure.
npm run build          # outputs client/dist/ which Nginx serves
```

Re-run `npm run build` after every `git pull` that touches `client/`.

---

## 7. Build the mobile APK (on your dev machine)

### 7a. Point the app at production

Edit **`mobile/app.json`** → `expo.extra.apiUrl`:

```json
"extra": { "apiUrl": "https://hostel.git.edu" }
```

and **`mobile/eas.json`** → `build.preview.env`:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": { "EXPO_PUBLIC_API_URL": "https://hostel.git.edu" }
}
```

`src/config.js` derives `https://hostel.git.edu/api` and loads photos from
`https://hostel.git.edu/uploads/...` automatically.

### 7b. First-time EAS setup

```bash
cd f:/hostel_complaints/mobile
npm install -g eas-cli
eas login                 # free expo.dev account
eas init                  # creates the project on expo.dev, writes
                          # expo.extra.eas.projectId into app.json
                          # (this id is what makes push notifications work)
```

Commit the `projectId` change:
```bash
git add app.json && git commit -m "Add EAS projectId" && git push
```

### 7c. Build

```bash
eas build --platform android --profile preview
```

- ~10–20 min on Expo's servers.
- First run offers to **generate an Android keystore** — say yes; EAS stores
  it. **Keep using the same keystore** for every future build or users can't
  update in place.
- When done it prints a download URL (also under expo.dev → Builds).

### 7d. Rebuild when…

- the API URL changes → edit `app.json` + `eas.json`, rebuild
- you ship new native capabilities (rare) → rebuild
- JS-only changes → rebuild, or set up EAS Update for OTA later

---

## 8. Distribute the APK

- **Direct**: host the `.apk` somewhere (even `https://hostel.git.edu/app/hostel.apk`
  — drop it in `client/dist/app/`), users enable "Install unknown apps" and tap it.
- **Play Store**: switch `eas.json` to the `production` profile
  (`buildType: "app-bundle"`), `eas build -p android --profile production`,
  then `eas submit -p android` with a Play Console account.

---

## 9. Push notifications — checklist

Nothing extra server-side (the API calls `https://exp.host/...` outbound).
For pushes to actually arrive:

- [ ] `expo.extra.eas.projectId` present in `app.json` (from `eas init`)
- [ ] APK is a real build (push never works in Expo Go on Android)
- [ ] user granted the notification permission on first launch
- [ ] VPS has outbound internet (default — no rule needed)

Test: as a student file a complaint, then as the Dean forward it — the cell
user's device should get "Complaint … forwarded".

---

## 10. Post-deploy verification

```bash
# on the VPS
curl -s https://hostel.git.edu/api/health          # {"status":"ok"}
pm2 status                                          # hostel-complaints = online
npx prisma migrate status --schema server/prisma/schema.prisma   # up to date
```

On the phone (with the production APK):

- [ ] login works
- [ ] a complaint photo displays (confirms `/uploads` over HTTPS)
- [ ] Dean sees "Forward to facility cell" on an OPEN complaint
- [ ] cell user can set an ETA via the date picker and resolve with a photo
- [ ] push notification received after a status change

---

## 11. Routine redeploy (after the first time)

```bash
ssh root@<vps-ip>
cd /var/www/Hostel-Complaints
git pull origin main
cd server && npm ci && npx prisma migrate deploy && npx prisma generate
pm2 restart hostel-complaints --update-env
cd ../client && npm ci && npm run build      # only if client/ changed
```

Mobile: rebuild the APK only if `mobile/` changed **and** it's a native
change or an API-URL change.
