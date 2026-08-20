# TripNest Deployment Guide (Render + PostgreSQL + Cloudinary)

This guide provides step-by-step instructions to deploy the complete **TripNest** application to Render with a **Docker Spring Boot backend**, **Render PostgreSQL database**, **Cloudinary media storage**, and **React SPA static frontend**.

---

## 🏗️ Deployment Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   React Frontend (Render)   │
                          │   (Static Site SPA Hosting) │
                          └──────────────┬──────────────┘
                                         │
                                         │ HTTPS / REST API
                                         ▼
                          ┌─────────────────────────────┐
                          │   Spring Boot Backend       │
                          │   (Render Docker Web Service)│
                          └──────┬───────────────┬──────┘
                                 │               │
            PostgreSQL Queries   │               │ File Uploads / Downloads
                                 ▼               ▼
                   ┌───────────────────┐   ┌──────────────────────┐
                   │ Render PostgreSQL │   │ Cloudinary Cloud     │
                   │ Database          │   │ Storage (Photos/PDFs)│
                   └───────────────────┘   └──────────────────────┘
```

- **Localhost Development**: Uses MySQL, local filesystem storage (`uploads/`), and `localhost:8081` backend.
- **Production Deployment**: Uses Render PostgreSQL, Cloudinary cloud storage, and Render Docker Web Service.

---

## 🛠️ Step 1: Set Up Cloudinary Account

1. Register or sign in at [Cloudinary.com](https://cloudinary.com).
2. Open your **Cloudinary Dashboard**.
3. Copy the following credentials:
   - **Cloud Name** (e.g., `dxy123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `aBcDeFgHiJkLmNoPqRsTuVwXyZ`)

> [!IMPORTANT]
> Keep the **API Secret** confidential. Do NOT commit it to Git or put it into frontend code.

---

## 🐘 Step 2: Create Render PostgreSQL Database

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **PostgreSQL**.
3. Fill in the database details:
   - **Name**: `tripnest-db`
   - **Database**: `tripnest_db`
   - **User**: `tripnest_user`
   - **Region**: Choose the region closest to your users.
   - **Plan**: Free / Starter.
4. Click **Create Database**.
5. Once created, copy:
   - **Internal Database URL** (e.g., `postgres://tripnest_user:password@dpg-xxxx-a:5432/tripnest_db`)
   - Host, Database Name, User, and Password details.

---

## 🐳 Step 3: Deploy Backend Docker Web Service on Render

1. On Render Dashboard, click **New +** ➔ **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name**: `tripnest-backend`
   - **Root Directory**: `backend` (or root repository)
   - **Environment / Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile` (or `backend/Dockerfile`)
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add the following required variables:

| Environment Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates production configuration profile |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<render-db-host>:5432/tripnest_db` | JDBC URL for Render PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `tripnest_user` | Render PostgreSQL database username |
| `SPRING_DATASOURCE_PASSWORD` | `<your-db-password>` | Render PostgreSQL database password |
| `JWT_SECRET` | `<32+ character random secret>` | Secret key for signing JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | `<your-cloudinary-cloud-name>` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | `<your-cloudinary-api-key>` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `<your-cloudinary-api-secret>` | Cloudinary API Secret |
| `CORS_ALLOWED_ORIGINS` | `https://tripnest-frontend.onrender.com,http://localhost:5173` | Allowed origins for backend CORS |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP Server Host |
| `MAIL_PORT` | `587` | SMTP Server Port |
| `MAIL_USERNAME` | `<your-email@gmail.com>` | Sender Email Address |
| `MAIL_PASSWORD` | `<your-app-password>` | Sender Email App Password |
| `MAIL_FROM` | `<your-email@gmail.com>` | Sender Display Email |

5. Click **Create Web Service**.
6. Wait for the build and deployment to complete. Copy your backend URL (e.g., `https://tripnest-backend.onrender.com`).

---

## ⚡ Step 4: Deploy Frontend Static Site on Render

1. On Render Dashboard, click **New +** ➔ **Static Site**.
2. Connect your Git repository.
3. Configure settings:
   - **Name**: `tripnest-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, add:

| Environment Variable | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://tripnest-backend.onrender.com` |

5. Click **Create Static Site**.

---

## 🧪 Step 5: Post-Deployment Verification Checklist

Verify all features on your deployed production site (`https://tripnest-frontend.onrender.com`):

- [ ] **Sign Up / Register**: Create a new traveler account.
- [ ] **Login**: Confirm JWT token creation and navigation.
- [ ] **Health Check**: Open `https://tripnest-backend.onrender.com/api/health` ➔ returns `{"status": "UP"}`.
- [ ] **Profile Photo Upload**: Upload a profile photo and verify it loads from Cloudinary.
- [ ] **Create Trip & Itinerary**: Create a trip and itinerary; verify PostgreSQL record creation.
- [ ] **Document Upload**: Upload PDF and image documents.
- [ ] **Document Preview & Download**: Verify document viewing and download.
- [ ] **Group Chat & Expenses**: Add group expenses and send chat messages.
- [ ] **Password Reset Email**: Trigger forgot password OTP email.
- [ ] **Redeploy Persistence**: Redeploy backend service and confirm user data persists in PostgreSQL.

---

## 💻 Local Development Commands

### Run MySQL + Spring Boot + React Locally:
```bash
# 1. Start local MySQL database (port 3306)

# 2. Run Backend (Spring Boot with local profile)
cd backend
.\mvnw.cmd spring-boot:run

# 3. Run Frontend (React Vite)
cd frontend
npm run dev
```

---

## 🐳 Optional Local Docker Testing Commands

Test production PostgreSQL compatibility locally using Docker Compose:

```bash
# Build and run Postgres & Spring Boot locally
docker-compose up --build

# Verify backend health endpoint
curl http://localhost:8081/api/health
```
