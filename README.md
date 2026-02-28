# PDFPro — Deployment Guide 🚀

A complete PDF toolkit with glassmorphism UI, built on Next.js + Vercel (frontend) and Hugging Face Spaces + Gotenberg (server-side conversions).

---

## 📁 Project Structure

```
pdfpro/
├── app/                    # Next.js App Router pages
│   ├── api/
│   │   ├── convert/        # Proxies to Gotenberg (secret URL hidden here)
│   │   └── keepalive/      # Pings HF server to prevent sleep
│   ├── merge/              # Merge PDF (client-side)
│   ├── split/              # Split PDF (client-side)
│   ├── compress/           # Compress PDF (client-side)
│   ├── rotate/             # Rotate PDF (client-side)
│   ├── pdf-to-jpg/         # PDF → JPG (client-side)
│   ├── jpg-to-pdf/         # JPG → PDF (client-side)
│   ├── watermark/          # Watermark PDF (client-side)
│   ├── page-numbers/       # Add page numbers (client-side)
│   ├── protect/            # Protect PDF (client-side)
│   ├── unlock/             # Unlock PDF (client-side)
│   ├── sign/               # Sign PDF (client-side)
│   ├── ocr/                # OCR PDF (client-side)
│   ├── docx-to-pdf/        # Word → PDF (server-side)
│   ├── pptx-to-pdf/        # PPT → PDF (server-side)
│   ├── xlsx-to-pdf/        # Excel → PDF (server-side)
│   ├── pdf-to-docx/        # PDF → Word (server-side)
│   └── html-to-pdf/        # HTML → PDF (server-side)
├── components/             # Shared React components
├── lib/                    # Utilities
├── huggingface/            # HF Space files (deploy separately)
│   ├── Dockerfile
│   └── README.md
├── .env.example            # Template for environment variables
├── .gitignore
└── next.config.mjs
```

---

## 🚀 Step-by-Step Deployment

### Step 1 — Deploy Gotenberg to Hugging Face Spaces

**1a. Create a new Space:**
- Go to https://huggingface.co/spaces
- Click **"Create new Space"**
- Name it: `pdfpro-server` (or any name)
- Select **SDK: Docker**
- Set visibility: **Private** (important for security!)
- Click Create Space

**1b. Upload the Hugging Face files:**
- In your new Space, go to **Files** tab
- Upload the `huggingface/Dockerfile` as `Dockerfile`
- Upload the `huggingface/README.md` as `README.md`
- The Space will automatically build and deploy Gotenberg

**1c. Get your Space URL:**
- Once deployed, your URL will be:
  ```
  https://YOUR-USERNAME-pdfpro-server.hf.space
  ```
- Test it by visiting: `https://YOUR-USERNAME-pdfpro-server.hf.space/health`
- You should see: `{"status": "ok"}`

---

### Step 2 — Deploy the Frontend to Vercel

**2a. Push to GitHub:**
```bash
cd pdfpro
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pdfpro.git
git push -u origin main
```

**2b. Deploy on Vercel:**
- Go to https://vercel.com
- Click **"Add New Project"**
- Import your GitHub repository
- Vercel auto-detects Next.js

**2c. Add Environment Variables in Vercel:**
- In your project settings → **Environment Variables**
- Add:
  ```
  GOTENBERG_URL = https://YOUR-USERNAME-pdfpro-server.hf.space
  ```
- Click Deploy

**2d. Done!** Your app is live at `https://your-project.vercel.app`

---

### Step 3 — Set Up Keep-Alive (Prevent HF Sleep)

To prevent your HF Space from going to sleep, set up a free cron job:

1. Go to https://cron-job.org (free account)
2. Create a new cron job:
   - URL: `https://your-project.vercel.app/api/keepalive`
   - Schedule: Every 10 minutes
3. Save — your server stays awake forever!

---

## 🔒 Security Features

| Feature | Implementation |
|---|---|
| **Gotenberg URL hidden** | Only in Vercel environment variables, never in client code |
| **Source maps disabled** | `productionBrowserSourceMaps: false` in next.config.mjs |
| **Security headers** | X-Frame-Options, XSS protection, etc. |
| **Private HF Space** | Set to Private so URL isn't public |
| **No file storage** | Files deleted immediately after conversion |
| **Client-side tools** | Files never leave browser for 12 of 17 tools |

---

## 🌐 Custom Domain (Optional)

1. Buy a domain (Namecheap, Cloudflare, etc.)
2. In Vercel project settings → **Domains**
3. Add your domain and follow the DNS instructions
4. Free SSL certificate is auto-configured

---

## 💡 Development

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local with your HF Space URL

# Run locally
npm run dev
```

Open http://localhost:3000

---

## 📊 Cost Breakdown

| Service | Cost |
|---|---|
| Vercel (frontend hosting) | **Free** |
| Hugging Face Spaces (Gotenberg) | **Free** |
| cron-job.org (keep-alive) | **Free** |
| **Total** | **$0/month** |

---

## ⚠️ Important Notes

1. **HF Space wake-up time**: First conversion after inactivity takes ~30 seconds. The UI shows a friendly message during this time. Use the keep-alive cron job to eliminate this.

2. **File size limits**: Vercel has a 4.5MB body size limit on API routes. For larger files, consider upgrading to Vercel Pro or implementing chunked uploads.

3. **HF Space visibility**: Keep your Space set to **Private** so the Gotenberg URL isn't publicly accessible.

4. **Secrets**: Never commit `.env.local` to git. It's in `.gitignore` already.
