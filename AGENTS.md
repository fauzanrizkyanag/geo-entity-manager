# AGENTS.md

## Project Overview

Geo Entity Manager is a full-stack web application for displaying and managing geographically located entities on an interactive map.

The repository contains two main applications:
- `frontend/`: React + TypeScript application built with Vite.
- `backend/`: Go REST API built with Gin and backed by SQLite.

Read `README.md` for the project overview, API reference, entity data model, and local setup instructions.

## General Working Rules

- Inspect the existing implementation before editing files.
- Follow the current project structure and established coding style.
- Prefer small, focused changes over broad rewrites.
- Avoid changing unrelated features or files.
- Do not assume a route, function, component, or configuration exists; verify it in the repository first.
- Preserve existing behavior unless the task explicitly requests a change.
- Explain important changes and identify the files modified.
- If requirements are ambiguous or a change could cause data loss, ask before proceeding.
- Do not claim that tests, builds, or commands passed unless they were actually run successfully.

## Repository Structure

- `README.md`: project documentation and setup instructions.
- `frontend/`: React, TypeScript, Vite, Leaflet, and React Leaflet.
- `backend/`: Go, Gin, and SQLite API.
- `AGENTS.md`: shared instructions for coding agents.

The actual repository may contain additional files. Inspect the current tree rather than assuming this list is exhaustive.

## Frontend Instructions (`frontend/`)

### Stack

- React
- TypeScript
- Vite
- Leaflet
- React Leaflet
- OpenStreetMap tiles

### Guidelines

- Use TypeScript and preserve useful type safety.
- Follow existing React component, hook, and state-management patterns.
- Reuse existing components and utilities when suitable.
- Avoid `any` unless there is a clear reason and no reasonable typed alternative.
- Keep map-related logic consistent with the existing Leaflet and React Leaflet setup.
- Preserve existing map interactions, markers, and selected-entity behavior unless the task requires a change.
- Keep API requests consistent with the backend endpoints and data model documented in `README.md`.
- Handle loading, empty, validation, and API-error states where relevant.
- Do not add dependencies without checking whether existing dependencies can solve the problem.
- Do not place secrets or private credentials in frontend code.

### Commands

Run commands from the `frontend/` directory:

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Type-check and build: `npm run build`
- Lint: `npm run lint`
- Preview a production build: `npm run preview`

Use the existing npm lockfile if present. The `build` script runs `tsc -b && vite build`; the `lint` script runs `eslint .`. Do not assume a test script exists: check `package.json` before attempting frontend tests.

## Backend Instructions (`backend/`)

### Stack

- Go
- Gin HTTP framework
- SQLite
- `modernc.org/sqlite` SQLite driver

### Guidelines

- Follow idiomatic Go conventions and the existing package structure.
- Preserve existing API routes, HTTP status codes, JSON response shapes, and error conventions unless a change is explicitly requested.
- Check existing handlers and database operations before adding or changing endpoints.
- Validate incoming data on the backend; frontend validation is not a substitute for backend validation.
- Use parameterized SQL queries for values supplied by requests.
- Handle errors explicitly and avoid leaking internal implementation details in HTTP responses.
- Close rows and other database resources appropriately.
- Use transactions when needed to maintain data consistency.
- Protect existing SQLite data. Do not delete, reset, or replace the database unless explicitly authorized.
- Inspect the actual schema and initialization code before modifying database structure.
- Avoid introducing dependencies unless necessary.

### Commands

Run commands from the `backend/` directory:

- Download modules: `go mod download`
- Run the API: `go run .`
- Run tests, if present: `go test ./...`
- Static analysis, when appropriate: `go vet ./...`

The module path is `geo-entity-manager/backend`. The `go.mod` file specifies Go `1.26.4`; use a compatible Go toolchain. Do not claim tests exist or pass without checking and running them.

### SQLite Working Directory

According to `README.md`, the SQLite database file is created relative to the backend process's working directory. Run `go run .` from `backend/` so the database is created in the expected location. Do not change this behavior unintentionally.

## API and Data Model

Consult `README.md` and the backend source before changing API behavior.

Documented endpoints:
- `GET /api/health`
- `GET /api/entities`
- `GET /api/entities/:id`
- `POST /api/entities`
- `PUT /api/entities/:id`
- `DELETE /api/entities/:id`

The documented entity fields are:
- `id`
- `name`
- `type`
- `status`
- `latitude`
- `longitude`
- `description`

Documented entity types:
- `vehicle`
- `iot_device`
- `facility`

Documented statuses:
- `active`
- `inactive`
- `maintenance`

Geographic coordinate ranges:
- Latitude: `-90` to `90`
- Longitude: `-180` to `180`

When changing the data model or API, update the relevant frontend and backend code together and update `README.md` if the documented behavior changes. Verify actual implementation details before assuming the documentation and code are identical.

## Frontend–Backend Integration

- During local development, the documented frontend URL is `http://localhost:5173` and backend URL is `http://localhost:8080`.
- The README states that Vite forwards requests beginning with `/api` to the backend. Inspect `frontend/vite.config.ts` to confirm the current proxy configuration before changing it.
- Keep request payloads, response types, and error handling aligned between frontend and backend.
- Preserve existing CORS and environment configuration unless a task requires changes.
- Do not hardcode environment-specific URLs if the project already has a configuration pattern.

## Testing and Verification

- Choose checks relevant to the files changed.
- For frontend changes, run `npm run lint` and/or `npm run build` from `frontend/` when appropriate.
- For backend changes, run `go test ./...` and/or `go vet ./...` from `backend/` when appropriate.
- For cross-stack changes, verify that API requests and response data remain compatible.
- The README reports that the application has been manually tested and that automated unit/integration test coverage has not been established. Check the repository for tests before relying on them.
- If a check cannot be run, state why. Report failures accurately rather than silently ignoring them.

## Git and Data Safety

- Do not discard the user's existing changes.
- Do not run destructive Git commands without explicit approval.
- Do not overwrite local configuration or user data.
- Avoid unnecessary changes to generated files and lockfiles.
- Never expose secrets, tokens, or credentials in logs, responses, or committed files.

## Completion Summary

When finishing a task, report:
1. What changed and why.
2. Which files were modified.
3. Which checks were run and their results.
4. Any remaining issues, assumptions, or manual steps.
