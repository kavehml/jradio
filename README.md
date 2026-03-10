## Radiology RVU Workload App

This repository contains a TypeScript-based web application to manage radiology requisitions, calculate RVUs, and distribute workload fairly among radiologists.

- `backend/` – Node.js + Express + TypeScript API service (designed for Railway with PostgreSQL).
- `frontend/` – React + Vite TypeScript single-page application with three role-based portals (radiologist, clerical, admin).
- `docs/` – Architecture notes and supporting documentation.

### Getting started

Backend:
- `cd backend`
- `npm install`
- `npm run dev`

Frontend:
- `cd frontend`
- `npm install`
- `npm run dev`

Update environment variables and database connection details in the backend before deploying to Railway.
