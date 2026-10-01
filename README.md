# BOLT — UPSC CSE AI Preparation Platform

> **BOLT** is an AI-powered UPSC Civil Services Examination preparation platform for structured learning, current affairs, Prelims practice, Mains evaluation, personalized progress intelligence, adaptive revision, and grounded document-based assistance.

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](./package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF)](https://vite.dev/)

## Overview

BOLT combines an AI mentor, UPSC-focused practice systems, a persistent student-progress layer, and a grounded Knowledge/RAG system.

**Learning loop:**

`Study → Practice → Evaluate → Diagnose → Revise → Practice Again`

Progress signals are intentionally separated: syllabus coverage, diagnostic knowledge, Prelims accuracy, Mains performance, and revision state are not collapsed into one opaque score.

## Features

### AI Mentor
- UPSC-focused conversational assistance
- Tool execution with structured traces
- Weak-area and topic-progress analysis
- Revision-queue lookup
- Study-plan generation
- Grounded responses from the Knowledge Base

### Knowledge & RAG
- Document upload and validation
- Semantic chunking and keyword extraction
- Search and retrieval
- Evidence-grounded responses with citations and excerpts
- Chunk inspection
- Archive/unarchive and deletion lifecycle
- User-scoped document isolation
- Firestore-backed production metadata

### Prelims
- Daily current-affairs MCQs
- UPSC-style four-option validation
- Syllabus/topic mapping
- PYQ-oriented practice
- Accuracy and progress tracking

### Mains
- Answer submission and evaluation
- 7-dimension evaluation rubric
- Structured feedback
- Repeated weakness detection across answers
- Improvement tracking

### Student Intelligence
- Syllabus progress
- Topic-level diagnostics
- Weak/strong-area detection
- Performance trends
- Adaptive spaced-repetition queue
- Study planning and timetable support

### Current Affairs
- RSS/source ingestion and classification
- UPSC syllabus mapping
- AI-grounded Daily MCQ generation
- Firestore-authoritative persistence
- External scheduling for production cloud deployments

### Platform / AI Infrastructure
- Central AI gateway
- Remote and local model support
- Benchmarking and validation
- Training-job controls
- Admin authorization
- Health and telemetry endpoints
- Rate limiting
- Backup and rollback tooling

## Architecture

```text
                         BOLT
                           │
             ┌─────────────┴─────────────┐
             │                           │
        React / Vite               Windows Desktop
             │                           │
             └─────────────┬─────────────┘
                           │ HTTPS
                    ┌──────▼──────┐
                    │ BOLT API    │
                    │ Node/Express│
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Firebase         AI Gateway      Cloud Storage
   Auth + Firestore   Gemini / local    docs / backups
          │                │
          └──────────┬─────┘
                     ▼
                  RAG / Data
```

### Production storage model

- **Firestore:** authoritative application and user data
- **Cloud Storage:** persistent documents, backups, and artifacts
- **Local filesystem:** cache/staging only where explicitly supported
- **Cloud Run/serverless API:** backend execution
- **External scheduler:** recurring current-affairs jobs in cloud production

## Security

BOLT is designed around authenticated, user-scoped access.

- Firebase authentication and backend token verification
- `requireAuth` and `requireAdmin` authorization
- Default-deny Firestore rules
- Per-user ownership checks
- Protected admin/training operations
- API rate limiting
- Server-side AI credentials
- No service-account credentials in the client
- AI provider secrets kept out of browser builds
- Controlled document access
- Account/data deletion workflows

**Never commit `.env`, service-account keys, private keys, or other production secrets.**

## Tech stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Motion, Recharts, React Markdown, jsPDF, Lucide React

**Backend:** Node.js, Express, TypeScript, Firebase Admin SDK, Firestore, Firebase Storage, Google GenAI SDK, Express Rate Limit

**AI / Knowledge:** AI Gateway, RAG, semantic/keyword retrieval, grounding, citation validation, UPSC-specific evaluation

**Desktop:** Electron/electron-builder when building the Windows distribution

## Repository structure

```text
.
├── src/                    # React application
├── server.ts               # Backend entry point
├── server/                 # Backend services/domain modules
├── scripts/                # Security, acceptance, benchmark and build tooling
├── public/                 # Static assets
├── python/                 # Optional Python tooling
├── datasets/               # Training/evaluation datasets
├── models/                 # Model/adaptor artifacts where applicable
├── data/                   # Local development/cache/staging data
├── firestore.rules         # Firestore security rules
├── firebase-*              # Firebase descriptors/configuration
├── vercel.json             # Vercel deployment configuration
├── package.json            # Scripts/dependencies
└── package-lock.json       # Locked npm dependency tree
```

## Requirements

- Node.js **24.x**
- npm
- Firebase project with Authentication and Firestore
- Server-side AI credentials for the selected provider

Optional:
- Python 3.x for Python-assisted tooling
- Electron build tooling for Windows packaging

## Quick start

### 1. Clone

```bash
git clone https://github.com/mohamedunaiz001-create/bolt.git
cd bolt
```

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and provide the variables required by your environment.

```bash
# macOS/Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Keep secrets server-side and never commit `.env`.

### 4. Run locally

```bash
npm run dev
```

### 5. Production build

```bash
npm run lint
npm run build
npm start
```

## Verification

Run the available production verification suites before releasing:

```bash
npm run lint
npm run build
npm run test:security
npm run test:acceptance
npm run benchmark
```

These cover TypeScript validation, production compilation, authentication/data isolation, end-to-end journeys, and AI/RAG/UPSC benchmark behavior.

## Deployment

### Vercel

The repository includes `vercel.json` with the production build configuration.

```bash
npm install
npm run build
vercel deploy
vercel deploy --prod
```

Set production environment variables in the Vercel project settings. Do not expose server-only secrets through `VITE_*` variables.

**Important:** a long-running Express server, durable worker, or in-process scheduler should not be assumed to behave like a permanently running serverless process. Use the intended production backend/runtime and an external scheduler for recurring jobs.

### Cloud Run

The production architecture can run the backend as a containerized service with managed HTTPS. For cloud deployments, recurring current-affairs execution should use the protected scheduler endpoint rather than an in-process timer.

## Current Affairs Scheduler

Production cloud deployments use an external scheduler to call the protected current-affairs synchronization endpoint. The endpoint must be protected by its scheduler secret and must never be exposed as an unauthenticated public mutation endpoint.

## Windows desktop

BOLT can be packaged as a Windows desktop application using Electron/electron-builder. The desktop client should communicate with the production BOLT API over HTTPS rather than embedding server-side credentials in the installer.

A release build should produce a signed/verified Windows installer and must keep backend secrets outside the client bundle.

## Environment variables

See [`.env.example`](./.env.example) for the current configuration surface. Variables cover AI providers, Firebase, scheduler/security settings, local AI endpoints, and development/test controls.

Only configure the providers/features you actually use.

## Operations

Before a production release:

1. Run all verification suites.
2. Verify Firebase Authentication and Firestore rules.
3. Verify two-user isolation.
4. Confirm Firestore and Cloud Storage are authoritative in production.
5. Test current-affairs scheduler execution.
6. Verify backup/restore procedures.
7. Check `/api/health` and telemetry.
8. Keep a known-good deployment available for rollback.

See [`ROLLBACK.md`](./ROLLBACK.md) for the repository rollback procedure.

## Release

**BOLT v1.1.0**

The repository contains the production-oriented web application, backend services, security rules, RAG/knowledge tooling, current-affairs pipeline, test suites, and deployment configuration.

Treat the actual CI results and deployed environment configuration as the source of truth for each release.

## Contributing

When changing production paths:

- Preserve authentication and authorization boundaries.
- Preserve user data isolation.
- Never add hardcoded credentials or fake production metrics.
- Add tests for behavior changes.
- Run the verification suite before merging.

## License

See the repository license file for the applicable terms.

---

Built for serious UPSC preparation with grounded AI, structured practice, and measurable learning progress.
