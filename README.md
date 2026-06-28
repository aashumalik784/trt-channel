# 📺 TRT CHANNEL

**TRT CHANNEL** - Ek powerful website jo kisi bhi YouTube channel ki videos ko ek jagah dikhata hai.

## 🚀 Features

- ✅ Kisi bhi YouTube channel ka URL ya @handle support karta hai
- ✅ Latest 24 videos automatically load hote hain
- ✅ Beautiful aur responsive UI design
- ✅ Secure API integration via Cloudflare Worker
- ✅ Fast loading with Cloudflare CDN
- ✅ Mobile-friendly design

## 🛠️ Setup Instructions

### 1. YouTube API Key Banayein
1. [Google Cloud Console](https://console.cloud.google.com/) par jayein
2. Ek naya project banayein
3. **YouTube Data API v3** enable karein
4. **Credentials** → **Create Credentials** → **API Key**
5. API key copy karein

### 2. Cloudflare Worker Deploy Karein

```bash
cd worker
npm install
wrangler login
wrangler secret put YOUTUBE_API_KEY
# Apni API key paste karein
wrangler deploy
```

Worker deploy hone ke baad, aapko ek URL milega jaise:
`https://trt-channel-api.your-subdomain.workers.dev`

### 3. Frontend Setup

1. `public/js/app.js` file open karein
2. `WORKER_URL` variable me apne Worker ka URL dalein:
```javascript
   const WORKER_URL = 'https://trt-channel-api.your-subdomain.workers.dev';
```
3. GitHub par push karein

### 4. Cloudflare Pages par Deploy Karein

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) par jayein
2. **Workers & Pages** → **Create** → **Pages**
3. **Connect to Git** → Apni repository select karein
4. Build settings:
   - **Root directory:** `public`
   - **Build command:** *(khali chhod dein)*
   - **Build output directory:** `/`
5. **Save and Deploy**

## 📁 Project Structure
