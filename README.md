# CoBuddy Companion Backend — Enterprise NestJS Service

[![NestJS Version](https://img.shields.io/badge/NestJS-11.0.0-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg?style=flat-square)](LICENSE)

The **Companion Backend** is the core server application powering the **CoBuddy Companion Platform** (Mobile & Web). Built with **NestJS**, **Prisma ORM**, **PostgreSQL**, and **Redis**, this service orchestrates companion onboarding applications, availability scheduling, booking request approvals and counter-offers, session check-ins, financial earnings ledgers, atomic payout withdrawals, and emergency safety workflows.

---

## Table of Contents

- [1. System Architecture & Cross-Service Topology](#1-system-architecture--cross-service-topology)
- [2. Core Features & Business Domains](#2-core-features--business-domains)
- [3. Deep Technical System Design](#3-deep-technical-system-design)
  - [3.1 Booking Request & Counter-Offer State Machine](#31-booking-request--counter-offer-state-machine)
  - [3.2 Companion Onboarding & Admin Application Sync](#32-companion-onboarding--admin-application-sync)
  - [3.3 Financial Earnings & Atomic Payout Ledger](#33-financial-earnings--atomic-payout-ledger)
  - [3.4 Real-time Communication & Emergency Safety](#34-real-time-communication--emergency-safety)
- [4. Directory & Module Structure](#4-directory--module-structure)
- [5. Complete API Reference](#5-complete-api-reference)
- [6. Database Schema & Prisma Models](#6-database-schema--prisma-models)
- [7. Environment Configuration](#7-environment-configuration)
- [8. Local Development & Docker Setup](#8-local-development--docker-setup)
- [9. Testing & Code Quality](#9-testing--code-quality)

---

## 1. System Architecture & Cross-Service Topology

The Companion Backend acts as the supply-side engine of the CoBuddy ecosystem, coordinating with Customer and Admin services via secured S2S APIs:

```mermaid
flowchart TD
    subgraph Clients["Companion Clients"]
        CM["Companion Mobile App<br/>(React Native)"]
    end

    subgraph CompanionService["Companion Backend (Port 4001 / 4401)"]
        GW["NestJS API Gateway & Guards"]
        AuthM["Auth & Token Rotation"]
        AppM["Companion Application Module"]
        ReqM["Booking Request Manager"]
        SessM["Session Orchestrator"]
        EarnM["Earnings & Atomic Payouts"]
        SafeM["Safety & SOS Dispatcher"]
        PrismaC["Prisma ORM 7.x"]
    end

    subgraph Storage["Companion Data Layer"]
        CDB[("PostgreSQL 16<br/>cobuddy_companion")]
        CRedis[("Redis 7<br/>Session Cache & Queues")]
    end

    subgraph CustomerService["Customer Service (Port 4002 / 4402)"]
        CustAPI["Customer Backend S2S Endpoints"]
    end

    subgraph AdminService["Admin Operations (Port 4000 / 4400)"]
        AdminAPI["Admin Application & Verification Sync"]
    end

    CM -->|REST API / HTTPS| GW
    GW --> AuthM
    GW --> AppM
    GW --> ReqM
    GW --> SessM
    GW --> EarnM
    GW --> SafeM

    AuthM & AppM & ReqM & SessM & EarnM & SafeM --> PrismaC
    PrismaC --> CDB
    GW --> CRedis

    ReqM -->|S2S Status Sync /internal/bookings/sync-status| CustAPI
    AppM -->|S2S Application Sync /internal/companion-applications/sync| AdminAPI
    EarnM -->|S2S Payout Audit Record| AdminAPI
    SafeM -->|S2S Emergency Alert Sync| AdminAPI
```

---

## 2. Core Features & Business Domains

* **Authentication & Role-Based Access**: Passwordless phone OTP login with QA bypass, JWT access token generation (15m expiration) and cryptographic refresh token rotation.
* **Onboarding & Vetting**: Multi-tier companion onboarding workflow (KYC documents, identity verification, background declaration, video introduction, and Admin interview scheduling).
* **Profile & Portfolio Management**: Public companion profile configuration including hourly rates, activity pacing, communication styles, city and area coverage, bio, and gallery photos.
* **Request & Counter-Offer Engine**: Real-time receipt of customer booking requests with full client profiles, proposed venues, activities, and timings. Supports instant accept, decline, or counter-offering modified venues/durations.
* **Live In-Person Session Execution**: OTP-based start verification, active meeting duration timers, companion check-out, and immediate session sign-off.
* **Earnings & Double-Entry Payout Ledger**: Net earnings computation (85% companion cut, 15% platform fee), daily/weekly breakdown, wallet balance tracking, and atomic withdrawal requests with serializable transaction isolation.
* **Safety & Panic Escalation**: Dedicated emergency SOS triggering with GPS coordinates, trusted contact logging, and immediate Admin incident escalation.

---

## 3. Deep Technical System Design

### 3.1 Booking Request & Counter-Offer State Machine

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: Customer places booking request
    RECEIVED --> ACCEPTED: Companion clicks Accept
    RECEIVED --> DECLINED: Companion clicks Decline
    RECEIVED --> COUNTER_OFFERED: Companion proposes new time/venue
    RECEIVED --> EXPIRED: Timeout without response

    COUNTER_OFFERED --> ACCEPTED: Customer accepts counter-offer
    COUNTER_OFFERED --> DECLINED: Customer declines counter-offer

    ACCEPTED --> IN_PROGRESS: Both meet and verify Check-in OTP
    IN_PROGRESS --> COMPLETED: Companion clicks Finish Session
    IN_PROGRESS --> EMERGENCY_SOS: SOS triggered during meeting

    COMPLETED --> EARNINGS_CREDITED: 85% net earnings credited to wallet
    EARNINGS_CREDITED --> [*]
    DECLINED --> [*]
    EXPIRED --> [*]
```

### 3.2 Companion Onboarding & Admin Application Sync

1. **Submission**: Companion submits identity papers, proof of address, bio, spoken languages, and social links via `/api/v1/application/submit`.
2. **S2S Mirroring**: Companion Backend triggers an internal S2S POST request to `Admin Backend:4000/api/internal/companion-applications/sync`.
3. **Admin Review**: Operational staff review portfolio, conduct interview, and record decision in Admin Panel (`/companions/applications`).
4. **Status Webhook**: Admin Backend notifies Companion Backend at `POST /api/v1/internal/application-status` with `APPROVED` or `REJECTED`.
5. **Activation**: Upon approval, the companion's profile is activated in search discovery and eligible for booking requests.

### 3.3 Financial Earnings & Atomic Payout Ledger

To prevent race conditions, double-withdrawals, and negative balances, the payout withdrawal routine in `earnings.service.ts` uses strict `Prisma.TransactionIsolationLevel.Serializable`:

```mermaid
sequenceDiagram
    autonumber
    actor Companion as Companion Client
    participant Service as EarningsService
    participant DB as PostgreSQL (Prisma $transaction)

    Companion->>Service: POST /earnings/payouts/request (Amount)
    Service->>DB: Begin Serializable Transaction
    Service->>DB: SELECT wallet FOR UPDATE (Check active balance)
    alt Balance < Amount requested
        DB-->>Service: Insufficient Funds
        Service-->>Companion: 400 Bad Request
    else Balance >= Amount requested
        Service->>DB: INSERT INTO PayoutRequest (status: COMPLETED)
        Service->>DB: UPDATE Wallet SET balance = balance - Amount
        Service->>DB: INSERT INTO TransactionRecord (debit, UTR)
        Service->>DB: Commit Transaction
        Service-->>Companion: 200 OK (Payout Processed, UTR Generated)
    end
```

---

## 4. Directory & Module Structure

```text
cobuddy-companion-backend/
├── prisma/
│   ├── schema.prisma              # Relational models, enums & foreign keys
│   └── seed.ts                    # Test companion seeds
├── src/
│   ├── common/
│   │   ├── decorators/            # @CurrentCompanion(), @Public()
│   │   ├── filters/               # Global HttpExceptionFilter
│   │   ├── guards/                # JwtAuthGuard, InternalServiceGuard
│   │   └── utils/                 # Password hashing & file validators
│   ├── config/
│   │   └── env.config.ts          # Zod-validated environment configuration
│   ├── modules/
│   │   ├── application/           # Onboarding, verification, admin sync
│   │   ├── auth/                  # Phone OTP & JWT token rotation
│   │   ├── chat/                  # Socket.IO gateway & message records
│   │   ├── customer-client/       # S2S client communicating with Customer backend
│   │   ├── earnings/              # Net earnings calculation & atomic payouts
│   │   ├── profile/               # Companion profile details, rates, bio
│   │   ├── requests/              # Inbound booking requests & counter-offers
│   │   ├── safety/                # Trusted contacts & emergency SOS
│   │   ├── sessions/              # In-person meeting timer & check-in OTP
│   │   └── system/                # Master data & system health
│   ├── prisma/                    # PrismaService lifecycle manager
│   ├── app.module.ts              # Root NestJS module
│   └── main.ts                    # Bootstrap entry point
├── uploads/                       # Local directory for KYC and profile photos
├── test/                          # Unit and contract tests
├── Dockerfile                     # Multi-stage production container build
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 5. Complete API Reference

All routes are prefixed with `/api/v1`.

### 5.1 Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/request-otp` | Public | Dispatches 6-digit verification code |
| `POST` | `/auth/verify-otp` | Public | Validates OTP and returns JWT tokens |
| `POST` | `/auth/refresh` | Public | Exchanges refresh token for new access token |
| `POST` | `/auth/logout` | Authenticated | Revokes current session refresh token |

### 5.2 Application & KYC (`/application`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/application/submit` | Authenticated | Submits companion onboarding dossier |
| `GET` | `/application/status` | Authenticated | Fetches current review/interview status |
| `POST` | `/application/resubmit` | Authenticated | Resubmits updated KYC documents |

### 5.3 Requests & Bookings (`/requests`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/requests` | Authenticated | Lists inbound customer booking requests |
| `GET` | `/requests/:id` | Authenticated | Detailed view of a single request |
| `POST` | `/requests/:id/accept` | Authenticated | Accepts booking; notifies Customer backend |
| `POST` | `/requests/:id/decline`| Authenticated | Declines booking request |
| `POST` | `/requests/:id/counter`| Authenticated | Proposes counter-offer with revised parameters |

### 5.4 Live Sessions (`/sessions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/sessions/:id/check-in` | Authenticated | Verifies meeting start OTP |
| `POST` | `/sessions/:id/complete` | Authenticated | Concludes session and releases earnings |
| `POST` | `/sessions/:id/incident` | Authenticated | Files live session incident report |

### 5.5 Earnings & Payouts (`/earnings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/earnings/summary` | Authenticated | Aggregates daily, weekly, and total earnings |
| `GET` | `/earnings/payouts` | Authenticated | Lists historical withdrawal records |
| `POST` | `/earnings/payouts/request` | Authenticated | Requests atomic bank payout from wallet |

### 5.6 Internal S2S Endpoints (`/internal`)
*Protected by `X-Internal-Service-Key`.*
| Method | Endpoint | Source | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/internal/bookings/dispatch` | Customer | Receives new booking request from Customer |
| `POST` | `/internal/bookings/:id/payment-confirmed` | Customer | Notifies booking payment captured |
| `POST` | `/internal/application-status` | Admin | Receives Admin application approval/rejection |
| `POST` | `/internal/companions/:id/suspend` | Admin | Enforces companion account suspension |

---

## 6. Database Schema & Prisma Models

The database contains 24 relational tables managed via Prisma migrations:

* **`Companion`**: Primary companion account record (phone, name, bio, rates, `verificationStatus`, `accountStatus`).
* **`CompanionApplication`**: Onboarding submissions, ID documents, interview scores, rejection notes.
* **`CompanionBookingRequest`**: Inbound booking requests, counter-offer snapshots, state flags.
* **`CompanionSession`**: Active meeting sessions, check-in pins, completion timestamps.
* **`CompanionWallet` & `CompanionPayout`**: Double-entry ledger for session earnings and atomic bank withdrawals.
* **`CompanionReview`**: Customer reviews received with star ratings.
* **`CompanionSos`**: Emergency panic records with GPS telemetry.

---

## 7. Environment Configuration

Copy `.env.example` to `.env`:

```env
# Application
NODE_ENV=development
PORT=4001
API_PREFIX=/api/v1

# Database & Cache
DATABASE_URL=postgresql://companion_audit:local-audit-placeholder-not-a-secret-20261018@localhost:45431/cobuddy_companion_audit?schema=public
REDIS_HOST=localhost
REDIS_PORT=46371

# Security & Tokens
JWT_ACCESS_SECRET=local-companion-jwt-access-secret-32-chars
JWT_REFRESH_SECRET=local-companion-jwt-refresh-secret-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# S2S Cross-Service Secrets
INTERNAL_SERVICE_SECRET=local-audit-placeholder-not-a-secret-20261018
ADMIN_API_URL=http://localhost:4400
CUSTOMER_API_URL=http://localhost:4402
```

---

## 8. Local Development & Docker Setup

### Prerequisites
* Node.js 20.x or 22.x
* PostgreSQL 16
* Redis 7
* Docker & Docker Compose

### Local Native Run
```bash
# 1. Install dependencies
npm install

# 2. Run Prisma migrations
npx prisma migrate dev

# 3. Start development server
npm run start:dev
```
The server will start on `http://localhost:4001`. Swagger OpenAPI documentation is available at `http://localhost:4001/api/docs`.

### Docker Compose Run
```bash
docker compose up -d cobuddy-audit-performance-companion-backend-1
```

---

## 9. Testing & Code Quality

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run linter
npm run lint
```
* **Current Status**: **96 / 96 unit and contract tests passing (100%)**.
