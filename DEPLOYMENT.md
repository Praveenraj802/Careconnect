# 🚀 CareConnect – Complete Production Deployment Guide

This guide provides step-by-step instructions for deploying CareConnect to production across all major hosting platforms.

---

## 🌟 Choose Your Deployment Target

| Method | Best For | Complexity | Free Tier? |
| :--- | :--- | :--- | :--- |
| **[Option 1: Render + MongoDB Atlas](#option-1-render--mongodb-atlas-recommended)** | Fastest free cloud deployment | ⭐ Beginner | ✅ Yes |
| **[Option 2: Railway](#option-2-railway)** | 1-click database + app hosting | ⭐ Beginner | ✅ Trial credits |
| **[Option 3: Docker Compose (Any VPS)](#option-3-docker--docker-compose-any-vps--vm)** | Full control, AWS EC2, DigitalOcean | ⭐⭐ Intermediate | 💵 Depends on VPS |
| **[Option 4: Ubuntu Linux (PM2 + Nginx)](#option-4-linux-vps-with-pm2--nginx--ssl)** | Bare metal or enterprise virtual machine | ⭐⭐⭐ Advanced | 💵 Depends on VPS |

---

## Pre-requisite: MongoDB Atlas Setup (Free Cloud Database)

Regardless of whether you deploy to Render, Railway, or Vercel, MongoDB Atlas is recommended for production:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for free.
2. Click **Create a Deployment** and select the **M0 Free Tier** (AWS or Google Cloud, closest region to your users).
3. Under **Security Quickstart**:
   - Create a database user (e.g., `careconnect_admin` with a strong password).
   - Under **IP Access List**, click **Add Current IP Address** and add `0.0.0.0/0` (Allow access from anywhere) so cloud providers like Render can connect.
4. Click **Connect** ➔ **Drivers (Node.js)** ➔ Copy the connection string:
   ```
   mongodb+srv://careconnect_admin:<password>@cluster0.abcde.mongodb.net/careconnect?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password)*.

---

## Option 1: Render + MongoDB Atlas (Recommended)

Render provides free hosting with full WebSocket (Socket.IO) support.

### Step 1: Push Project to GitHub
1. In your local terminal:
   ```bash
   cd c:\Users\Praveen\OneDrive\Documents\Projects\careconnect
   git init
   git add .
   git commit -m "Initial commit for CareConnect emergency platform"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Link and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/careconnect.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
2. Connect your GitHub repository `careconnect`.
3. Configure the settings:
   - **Name**: `careconnect-emergency`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run postinstall && npm run build
     ```
   - **Start Command**:
     ```bash
     node server/server.js
     ```
   - **Instance Type**: `Free`

4. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGO_URI` = *(Your MongoDB Atlas connection string from above)*
   - `JWT_SECRET` = *(Any secure random 32-character string)*
   - `JWT_EXPIRE` = `7d`
   - `DEFAULT_SEARCH_RADIUS_KM` = `15`

5. Click **Create Web Service**.
   Render will build the React frontend, install dependencies, and launch Express + Socket.IO.
   Your live application will be accessible at:
   👉 **`https://careconnect-emergency.onrender.com`**

---

## Option 2: Railway

Railway automatically detects Node projects and handles persistent WebSockets seamlessly.

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Select your `careconnect` repository.
4. Under **Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGO_URI` = *(Your MongoDB Atlas URI, or click **New Service** ➔ **Database** ➔ **MongoDB** within Railway)*
   - `JWT_SECRET` = `careconnect_super_secret_jwt_key_2026_dev_secure`
   - `JWT_EXPIRE` = `7d`
5. Under **Settings**:
   - Build Command: `npm run postinstall && npm run build`
   - Start Command: `node server/server.js`
6. Click **Generate Domain** to get your public URL.

---

## Option 3: Docker & Docker Compose (Any VPS / VM)

CareConnect includes a complete multi-stage `Dockerfile` and `docker-compose.yml` that runs both the full application and a MongoDB database container with persistent storage volumes.

### Run Locally or on any Cloud VM (AWS EC2, DigitalOcean, Hetzner, Linode):
1. Ensure Docker & Docker Compose are installed:
   ```bash
   docker --version
   docker compose version
   ```
2. Navigate to project root:
   ```bash
   cd c:\Users\Praveen\OneDrive\Documents\Projects\careconnect
   ```
3. Start the entire system in the background:
   ```bash
   docker compose up -d --build
   ```
4. Verify containers:
   ```bash
   docker compose ps
   ```
5. View live logs:
   ```bash
   docker compose logs -f app
   ```
6. Access your platform at:
   👉 **`http://localhost:5000`** *(or `http://<your-server-ip>:5000`)*

---

## Option 4: Linux VPS with PM2 + Nginx + SSL

For deploying to an Ubuntu 22.04 / 24.04 LTS server with your own domain name (e.g. `careconnect.yourdomain.com`).

### Step 1: Install Node.js 20 & Nginx on VPS
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### Step 2: Clone & Build Application
```bash
git clone https://github.com/<your-username>/careconnect.git /var/www/careconnect
cd /var/www/careconnect

# Install server and client dependencies
npm run postinstall

# Build client production bundle
npm run build
```

### Step 3: Configure Environment Variables
Create `/var/www/careconnect/server/.env`:
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/careconnect?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_random_jwt_secret_key_here
JWT_EXPIRE=7d
DEFAULT_SEARCH_RADIUS_KM=15
```

### Step 4: Run with PM2 Process Manager
```bash
cd /var/www/careconnect
pm2 start server/server.js --name "careconnect"
pm2 save
pm2 startup
```

### Step 5: Configure Nginx with WebSocket Proxy
Create `/etc/nginx/sites-available/careconnect`:
```nginx
server {
    server_name careconnect.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket support headers (Critical for Socket.IO real-time alerts)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site and test Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/careconnect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Install Free SSL Certificate (HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d careconnect.yourdomain.com
```

---

## 🔒 Post-Deployment Security Checklist

1. **Change JWT_SECRET**: Ensure your `JWT_SECRET` in production is a randomized secret string not shared in version control.
2. **MongoDB Network Whitelist**: In MongoDB Atlas, restrict the network access if your host provides static IP addresses, or use `0.0.0.0/0` with strong database user credentials.
3. **HTTPS / SSL**: Always serve over HTTPS so browser location permissions (`navigator.geolocation`) and HTML5 Notifications are permitted without security warnings.
4. **CORS Configuration**: By default `server/server.js` serves both the API and client from the same origin, eliminating CORS issues entirely. If hosting frontend and backend on separate domains, set `CLIENT_URL` in `.env` to your frontend domain.
