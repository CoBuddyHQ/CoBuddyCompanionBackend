# 🚀 CoBuddy Companion Backend

Production-grade NestJS backend for the **CoBuddy Companion** application platform.

Built with **NestJS 11**, **TypeScript**, **Prisma 7**, **PostgreSQL**, **Redis**, **Socket.IO**, **Firebase Admin (FCM)**, **Multer (Local Disk / AWS S3)**, **JWT Authentication**, and **Swagger**.

---

## 🛠️ Complete Feature & Integration Overview

### 1. 🔐 Dual-Mode Authentication & Security
- **Development Mode:** Fast zero-cost OTP verification backed by Redis with bypass key (`123456`).
- **Production Mode:** Firebase Phone Authentication ready via client & server integration.
- **Tokens:** Dual JWT Architecture (Access Token 15m + Refresh Token 7d in Redis with auto-rotation).
- **Security:** PIN management (`/auth/companion/pin/*`), Biometric public key enrollment, rate-limiting throttle guard.

### 2. 📡 Real-Time Socket.IO Infrastructure (3 Namespaces)
- `/` — **App Namespace:** Global booking alerts (`new_booking_request`), push notifications.
- `/sessions` — **Session Namespace:** Live in-session chat, location tracking (`update_location`), typing indicators (`typing`), and companion arrival events.
- `/support` — **Support Namespace:** Live support ticket chat with automatic welcome message dispatch.
- **Guards & Features:** `WsJwtGuard` on every socket namespace, client-side offline message queue flushing on reconnect.

### 3. ☁️ Dual File Upload System (Zero-Cost Dev → S3 Production)
- **Development (Zero Cost):** Serves local files from `/uploads/companions/{id}/{category}/` via `ServeStaticModule`.
- **Production (AWS S3):** Detects `AWS_ACCESS_KEY_ID` in `.env` and automatically switches upload target to Amazon S3.
- **Categories:** `profile_photo`, `gallery` (max 9 photos), `kyc_identity`, `kyc_selfie`, `kyc_address`, `kyc_police`, `evidence`.

### 4. 📲 Firebase Cloud Messaging (FCM Push Notifications)
- Integrated `@react-native-firebase/messaging` on mobile and `firebase-admin` on backend.
- Token registration via `POST /companion/notifications/push-token`.
- Automated push triggers: New booking requests, session reminders, payout credits.
- Development fallback: Graceful console logging if Firebase credentials are unconfigured.

### 5. 💰 Earnings, Withdrawals & Razorpay Integration
- Complete earnings tracking: Available balance, pending 48h clearance, all-time totals, weekly/daily breakdowns.
- Payout request pipeline: Validates minimum balance (₹100), derives masked bank info from KYC records.
- Razorpay Integration: Order creation, payment verification, status check, refund processing.

### 6. 📁 Backend Modules Summary (18 Modules)

| Module | Route Prefix | Primary Purpose |
|---|---|---|
| `Auth` | `/auth/companion` | OTP, JWT, Refresh Token, Logout, PIN, Biometric |
| `Profile` | `/companion/profile` | Avatar, Bio, Service Areas, Categories, Pricing, Trust Score |
| `KYC` | `/companion/kyc` | ID proof, Selfie, PAN, Bank account, UPI verification |
| `Availability` | `/companion/availability` | Weekly schedule, Live toggle, Overrides, Vacation mode |
| `Requests` | `/companion/requests` | List incoming requests, Accept, Decline, Counter-propose |
| `Sessions` | `/companion/sessions` | Upcoming/history, Check-in, Customer verification, Extensions, Early end, Cancellation |
| `Earnings` | `/companion/earnings` | Earnings summary, Transactions, Payout requests, Invoices |
| `Safety` | `/companion/safety` | SOS emergency trigger, Safety timer, Trusted contacts, Incident reporting |
| `Notifications` | `/companion/notifications` | List notifications, Unread count, Mark read, Push token |
| `Support` | `/companion/support` | Ticket management, Disputes, Dispute appeals, Help articles |
| `Reviews` | `/companion/reviews` | Reviews received, Report review, Public replies, Trust score |
| `Training` | `/companion/training` | Onboarding training modules, Lesson completion |
| `Uploads` | `/companion/uploads` | Multer file upload (Profile, KYC, Evidence) |
| `Settings` | `/companion/settings` | Bank settings, PIN change, Privacy, Onboarding sync |
| `Account` | `/companion/account` | Account preferences, Language, Deactivate, Delete account |
| `Dashboard` | `/companion/dashboard` | Home dashboard stats & quick actions |
| `Payments` | `/payments` | Razorpay order creation, Verification, Refunds |
| `Prisma` | Database layer | PostgreSQL connection adapter via `@prisma/adapter-pg` |

---

## ⚙️ Environment Setup

Create `.env` in the root directory:

```env
PORT=4001
NODE_ENV=development

# PostgreSQL & Redis (Docker local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cobuddy_companion?schema=public"
REDIS_URL="redis://localhost:6379"

# Auth Secrets
JWT_SECRET="cobuddy-super-secret-jwt-key-change-in-prod"
JWT_REFRESH_SECRET="cobuddy-super-secret-refresh-key-change-in-prod"
OTP_DEV_BYPASS="123456"

# Optional Production Credentials (Fill when ready to launch):
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=ap-south-1
# AWS_S3_BUCKET=cobuddy-uploads
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
# FIREBASE_PROJECT_ID=
# FIREBASE_CLIENT_EMAIL=
# FIREBASE_PRIVATE_KEY=
```

---

## 🚀 Running the Project

```bash
# 1. Start Postgres & Redis containers
docker-compose up -d

# 2. Database migrations & Prisma client generation
npx prisma generate
npx prisma db push

# 3. Start NestJS server in dev mode
npm run start:dev

# 4. Production Build Verification
npm run build
```

---

## 📑 Swagger Documentation

Interactive API documentation available at:
`http://localhost:4001/api/docs`

API Base URL:
`http://localhost:4001/api/v1`

---

## 📄 License

Private Repository — Copyright © **CoBuddyHQ**. All Rights Reserved.