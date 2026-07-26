# 🚀 CoBuddy Companion Backend

Production-grade, enterprise-ready NestJS backend service powering the **CoBuddy Companion** platform.

Built with **NestJS 11**, **TypeScript**, **Prisma 7**, **PostgreSQL**, **Redis**, **Socket.IO**, **Firebase Admin (FCM)**, **Multer (Local Disk / AWS S3)**, **BullMQ**, **JWT Authentication**, and **Swagger API Documentation**.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Architecture & Real-Time Flow](#-architecture--real-time-flow)
- [📁 Backend Modules Inventory (18 Modules)](#-backend-modules-inventory-18-modules)
- [📡 Socket.IO Real-Time Engine (3 Namespaces)](#-socketio-real-time-engine-3-namespaces)
- [☁️ File Upload Strategy (Multer + Local / AWS S3)](#️-file-upload-strategy-multer--local--aws-s3)
- [🔔 Push Notifications (Firebase Cloud Messaging - FCM)](#-push-notifications-firebase-cloud-messaging---fcm)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [📂 Installation & Setup](#-installation--setup)
- [🚀 Database Management (Prisma)](#-database-management-prisma)
- [▶️ Running the Application](#️-running-the-application)
- [📚 Swagger API Documentation](#-swagger-api-documentation)
- [🐳 Docker Deployment](#-docker-deployment)
- [🚀 Cloud Deployment Paths](#-cloud-deployment-paths)
- [📄 License](#-license)

---

## ✨ Features

### 🔐 Authentication & Security
- **Dual-Mode OTP Auth:** Zero-cost local Redis OTP verification for development (`123456` bypass) with Firebase Phone Auth ready for production launch.
- **Dual JWT Token System:** 15-minute Access Tokens + 7-day Refresh Tokens stored in Redis with automatic rotation.
- **PIN & Biometric Support:** Endpoint suites for setting/verifying 4-digit PINs and enrolling biometric public keys.
- **Rate-Limiting:** Integrated `@nestjs/throttler` protecting sensitive auth endpoints against brute force attempts.

### 👤 Profile & KYC Verification
- **Companion Profile Management:** Personal info, bio, hourly rates, service areas, non-dating platonic category selection.
- **Gallery Uploads:** Supports up to 9 gallery photos per companion with sorting order.
- **Full KYC Pipeline:** Document uploads for Government ID, Selfie verification, Address proof, Police clearance, PAN, Bank Account, and UPI.
- **Trust Score Engine:** Dynamic trust scoring based on completed sessions, verification tasks, and client ratings.

### 📅 Availability & Scheduling
- **Weekly Schedule:** Day-by-day toggle with custom working time slots (e.g. 09:00 - 18:00).
- **Live Status Toggle:** Instantly toggle online/offline companion availability.
- **Vacation Mode:** Automatic scheduling for away dates with auto-reject during vacation.
- **Custom Overrides:** Date-specific availability overrides for holidays or custom events.

### 📖 Booking Requests & Session Lifecycle
- **Request Pipeline:** Pending, Accept, Decline, and Counter-propose start times or venues.
- **Live Session Tracking:** Check-in validation, digital session pass generation, customer PIN verification.
- **Session Extensions:** Request 30-180 minute session extensions with automated price adjustments.
- **Session Termination:** Early end, two-step cancellation with reason tracking, customer no-show reporting, and post-session notes.

### 💰 Earnings, Payouts & Razorpay Integration
- **Real-Time Earnings Accounting:** Available balance, pending 48-hour clearance pool, tips, and bonus tracking.
- **Automated Payout Requests:** Instant withdrawal processing with KYC bank verification (minimum ₹100 threshold).
- **Payment Processing:** Full Razorpay integration for order creation, signature verification, status checks, and refunds.

### 🚨 SOS & Companion Safety Framework
- **Emergency SOS Trigger:** One-touch SOS alerting safety team with live GPS coordinates.
- **Safety Check-in Timer:** Periodic check-in prompts during active sessions with automatic escalation on expiry.
- **Trusted Contacts:** Manage emergency contact lists with automated SMS/push alerts.
- **Block & Incident Reporting:** Customer blocking, incident filing, and dispute evidence uploads.

---

## 🛠 Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | NestJS 11 (Node.js) |
| **Language** | TypeScript 5+ |
| **Database** | PostgreSQL 16+ via Prisma 7 ORM (`@prisma/adapter-pg`) |
| **Caching & Queues** | Redis 7+ & BullMQ |
| **Real-Time Engine** | Socket.IO Client & Server |
| **Push Notifications** | Firebase Admin SDK (FCM) |
| **File Storage** | Multer (Local Disk in Dev / AWS S3 in Production) |
| **API Client & Docs** | Axios, Swagger / OpenAPI 3.0 |
| **Payments** | Razorpay SDK |
| **Containerization** | Docker & Docker Compose |

---

## 🏗 Architecture & Real-Time Flow

```mermaid
sequenceDiagram
    autonumber
    actor Companion as Mobile App (React Native)
    participant Nest as NestJS API Server
    participant Redis as Redis Cache
    participant DB as PostgreSQL (Prisma)
    participant FCM as Firebase FCM
    participant S3 as AWS S3 / Local Uploads

    Companion->>Nest: POST /api/v1/auth/companion/otp/send
    Nest->>Redis: Store OTP (123456 in dev)
    Nest-->>Companion: OTP Sent OK

    Companion->>Nest: POST /api/v1/auth/companion/otp/verify
    Nest->>DB: Upsert Companion Record
    Nest->>Redis: Store Refresh Token
    Nest-->>Companion: Return { accessToken, refreshToken }

    Companion->>Nest: WsConnect /sessions (Bearer Token)
    Nest-->>Companion: Socket Authenticated & Connected

    Companion->>Nest: POST /api/v1/companion/uploads/profile-photo
    Nest->>S3: Save image file
    Nest->>DB: Save UploadedFile record
    Nest-->>Companion: Return file URL
```

---

## 📁 Backend Modules Inventory (18 Modules)

| # | Module | Base Route | Key Operations |
|---|---|---|---|
| 1 | **Auth** | `/api/v1/auth/companion` | Send/Verify OTP, Token Refresh, Logout, PIN Set/Verify, Biometric Enroll |
| 2 | **Profile** | `/api/v1/companion/profile` | Get/Update Profile, Categories, Languages, Areas, Pricing, Photos, Trust Score |
| 3 | **KYC** | `/api/v1/companion/kyc` | Basic details, Government ID, Selfie, Address, PAN, Bank, UPI, Submit KYC |
| 4 | **Availability** | `/api/v1/companion/availability` | Weekly Schedule, Live Toggle, Vacation Mode, Slot Add/Edit/Delete, Overrides |
| 5 | **Requests** | `/api/v1/companion/requests` | List Requests, Detail, Accept, Decline, Counter-Propose |
| 6 | **Sessions** | `/api/v1/companion/sessions` | Upcoming/History, Check-in, Verify Customer, Extend, End Early, Cancel, Complete, Notes |
| 7 | **Earnings** | `/api/v1/companion/earnings` | Earnings Summary, Transactions, Payout History, Request Payout, Daily/Weekly Breakdowns |
| 8 | **Safety** | `/api/v1/companion/safety` | Trigger SOS, Resolve SOS, Safety Timer, Trusted Contacts CRUD, Block/Report Customer |
| 9 | **Notifications** | `/api/v1/companion/notifications` | Get List, Unread Count, Mark Read, Mark All Read, Push Token Register, Preferences |
| 10 | **Support** | `/api/v1/companion/support` | Support Tickets, Ticket Replies, Dispute Center, File Dispute, Appeals, Help Articles |
| 11 | **Reviews** | `/api/v1/companion/reviews` | List Reviews, Detail, Reply to Review, Report Review, Trust Score & Badges |
| 12 | **Training** | `/api/v1/companion/training` | Onboarding Training Modules, Lesson Details, Module Completion |
| 13 | **Uploads** | `/api/v1/companion/uploads` | Multer Uploads: Profile Photo, Gallery, KYC Identity, Selfie, Address, Evidence |
| 14 | **Settings** | `/api/v1/companion/settings` | Bank Details, PIN Change, Privacy Controls, Notification Prefs, Data Export |
| 15 | **Account** | `/api/v1/companion/account` | Account Settings, Language, Deactivate, Reactivate, Delete Account |
| 16 | **Dashboard** | `/api/v1/companion/dashboard` | Home Screen Summary Stats & Quick Actions |
| 17 | **Payments** | `/api/v1/payments` | Razorpay Order Creation, Payment Verification, Status, Refunds |
| 18 | **Prisma** | Core Database Layer | Connection pooling via `@prisma/adapter-pg` |

---

## 📡 Socket.IO Real-Time Engine (3 Namespaces)

The backend provides 3 distinct Socket.IO namespaces, each secured with `WsJwtGuard`:

### 1. `/` — Global App Namespace
- **Events Emitted by Server:** `new_booking_request`, `notification`
- **Purpose:** Instant alert notifications for incoming requests and system announcements.

### 2. `/sessions` — In-Session Namespace
- **Events Received by Server:** `join_session`, `send_message`, `update_location`, `typing`
- **Events Emitted by Server:** `companion_joined`, `receive_message`, `companion_location_updated`, `typing`
- **Purpose:** In-session chat, live GPS location sharing during active sessions, and typing indicators.

### 3. `/support` — Live Support Namespace
- **Events Received by Server:** `join_ticket`, `send_support_message`
- **Events Emitted by Server:** `receive_support_message` + automatic system welcome message dispatch.
- **Purpose:** Real-time communication with customer support agents.

---

## ☁️ File Upload Strategy (Multer + Local / AWS S3)

The upload system supports **Zero-Cost Local Storage** for development and auto-switches to **AWS S3** for production:

```
Development:  File → NestJS Uploads Controller → Saved to local /uploads/ directory → Served at http://localhost:4001/uploads/...
Production:   File → NestJS Uploads Controller → Uploaded to AWS S3 → CDN URL returned
```

- **Categories:** `profile_photo`, `gallery` (max 9), `kyc_identity`, `kyc_selfie`, `kyc_address`, `kyc_police`, `evidence`.
- **Validation:** Max 10MB file size, mimetype validation (JPEG, PNG, WebP, MP4, MOV, PDF).

---

## 🔔 Push Notifications (Firebase Cloud Messaging - FCM)

- **Client Registration:** `POST /companion/notifications/push-token` registers device token in PostgreSQL `PushToken` table.
- **Backend Push Sender:** `FcmService` using `firebase-admin` SDK.
- **Notification Triggers:**
  - `notifyNewBookingRequest()` — Sent when customer requests a session.
  - `notifySessionReminder()` — Sent 2 hours before session start.
  - `notifyPayoutProcessed()` — Sent when payout transfer completes.
- **Development Fallback:** Gracefully logs push payloads to console if Firebase credentials are not set.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Config
PORT=4001
NODE_ENV=development

# Database & Redis (Local Docker setup)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cobuddy_companion?schema=public"
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="cobuddy-super-secret-jwt-key-change-in-prod"
JWT_REFRESH_SECRET="cobuddy-super-secret-refresh-key-change-in-prod"

# Development Bypass
OTP_DEV_BYPASS="123456"

# Production Credentials (Optional for Dev, Fill for Launch):
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_REGION=ap-south-1
# AWS_S3_BUCKET=cobuddy-uploads
# RAZORPAY_KEY_ID=your_razorpay_key
# RAZORPAY_KEY_SECRET=your_razorpay_secret
# FIREBASE_PROJECT_ID=your_firebase_project_id
# FIREBASE_CLIENT_EMAIL=your_service_account_email
# FIREBASE_PRIVATE_KEY=your_private_key
```

---

## 📂 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CoBuddyHQ/CoBuddyCompanionBackend.git
   cd CoBuddyCompanionBackend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Docker Infrastructure (PostgreSQL & Redis):**
   ```bash
   docker-compose up -d
   ```

---

## 🚀 Database Management (Prisma)

- **Generate Prisma Client:**
  ```bash
  npx prisma generate
  ```

- **Push Schema to PostgreSQL Database:**
  ```bash
  npx prisma db push
  ```

- **Open Prisma Studio (Visual DB Explorer):**
  ```bash
  npx prisma studio
  ```

---

## ▶️ Running the Application

- **Development Mode (Auto-Reload):**
  ```bash
  npm run start:dev
  ```

- **Production Build:**
  ```bash
  npm run build
  ```

- **Production Run:**
  ```bash
  npm run start:prod
  ```

---

## 📚 Swagger API Documentation

Once the server is running, access full interactive OpenAPI / Swagger documentation at:

```
http://localhost:4001/api/docs
```

API Base Endpoint:
```
http://localhost:4001/api/v1
```

---

## 🐳 Docker Deployment

Run the complete backend stack (Postgres + Redis + NestJS Backend) in containers:

```bash
docker-compose up -d --build
```

---

## 🚀 Cloud Deployment Paths

Supported Production Deployment Environments:

- **AWS EC2 / ECS** (Docker Container Deployment)
- **Render.com / Railway.app** (PaaS One-Click Deploy)
- **DigitalOcean App Platform**
- **Google Cloud Run**

---

## 📄 License

**Private Repository** — Copyright © **CoBuddyHQ**. All Rights Reserved.