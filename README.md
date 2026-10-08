# BOLT — UPSC CSE AI Preparation Platform

> **An AI-powered UPSC preparation platform combining grounded knowledge, personalized study intelligence, Prelims practice, Mains evaluation and adaptive revision.**

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](./package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](#)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28)](#)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF)](#)

## Product Vision

BOLT is built around:

**Study → Practice → Evaluate → Diagnose → Revise → Practice Again**

The platform separates syllabus coverage, topic diagnostics, Prelims accuracy, Mains performance and revision state.

## Core Features

### AI Mentor
- UPSC-focused conversational assistance
- Structured tool execution
- Weak-area analysis
- Topic-progress lookup
- Revision-queue lookup
- Study-plan generation
- Knowledge-grounded responses

### Knowledge & RAG
- Document upload and validation
- Semantic chunking and keyword extraction
- Retrieval and search
- Evidence-grounded responses
- Citation/excerpt support
- User-scoped document isolation

### Prelims
- Current-affairs MCQs
- Four-option UPSC-style questions
- Topic/syllabus mapping
- Accuracy tracking

### Mains
- Answer submission
- 7-dimension evaluation rubric
- Structured feedback
- Repeated weakness detection
- Improvement tracking

### Student Intelligence
- Syllabus progress
- Topic diagnostics
- Weak/strong-area detection
- Adaptive spaced repetition
- Revision queue
- Study planning

### Current Affairs
- Feed ingestion and classification
- UPSC syllabus mapping
- AI-grounded Daily MCQ generation
- Persistent storage
- Production scheduler integration

## Architecture

**React/Vite → BOLT API → Firebase/Auth/Firestore + AI Gateway + Knowledge/RAG + Student Intelligence**

## Security

- Firebase Authentication
- Backend token verification
- Role-aware authorization
- Default-deny Firestore rules
- Per-user ownership checks
- Rate limiting
- Server-side AI credentials
- Protected admin/training operations
- Document access controls

Never commit .env files, service-account credentials, private keys or production secrets.

## Technology

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Motion, Recharts, React Markdown, jsPDF

**Backend:** Node.js, Express, TypeScript, Firebase Admin SDK, Firestore, Cloud Storage, Google GenAI SDK

**AI:** RAG, grounding, retrieval, citation validation and UPSC evaluation

**Desktop:** Electron / electron-builder

## Local Development

    git clone https://github.com/mohamedunaiz001-create/bolt.git
    cd bolt
    npm install
    npm run dev

Configure .env from .env.example before using production integrations.

## Verification

    npm run lint
    npm run build
    npm run test:security
    npm run test:acceptance
    npm run benchmark

Treat the actual verification output of the checked-out release as the source of truth.

## Deployment

For cloud deployment:

- keep server-only secrets out of browser variables
- use managed persistent storage
- use an external scheduler for recurring jobs
- verify Authentication and Firestore rules
- maintain a known-good rollback path

## Repository Structure

- src/
- server/
- server.ts
- scripts/
- public/
- python/
- datasets/
- models/
- firestore.rules
- .env.example
- package.json

## Release

**BOLT v1.1.0**

## Author

**Mohamed Unaiz** — AI Applications • Cybersecurity • UPSC EdTech • Full-Stack Development