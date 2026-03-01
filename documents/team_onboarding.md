# Team Onboarding Guide

Last updated: 2026-03-01 (JST)

## 1. Who This Is For

This guide is for team members setting up the application on their local machine for development and testing.

Assumed environment:

- Windows 10/11
- Git available
- Node.js + npm available
- Python 3.10+ available
- `uv` recommended for Python environment/dependency management

## 2. First-Time Setup

### Step 1: Choose local workspace directory

Example:

```powershell
cd C:\Users\<your_user>\Documents
mkdir Yaqumo
cd Yaqumo
```

### Step 2: Clone the repository

Replace `<REMOTE_REPO_URL>` with your GitHub repository URL.

```powershell
git clone <REMOTE_REPO_URL>
cd materials_management
```

### Step 3: Install `uv` (recommended)

Install `uv` using the official instructions:

- https://docs.astral.sh/uv/getting-started/installation/

Verify installation:

```powershell
uv --version
```

### Step 4: Verify Node.js / npm

```powershell
node --version
npm --version
```

If missing, install Node.js LTS and re-open your terminal.

## 3. Project Dependency Setup

### Step 5: Install backend dependencies (with `uv`)

```powershell
cd backend
uv sync
cd ..
```

### Step 6: Install frontend dependencies (`npm`)

```powershell
cd frontend
npm install
cd ..
```

## 4. Initialize and Run

### Step 7: Initialize database and workspace folders

```powershell
cd backend
uv run main.py init-db
cd ..
```

This prepares:

- `backend/database/inventory.db`
- required quotation/export folder layout

### Step 8 (recommended): Start both backend and frontend with helper script

```powershell
.\start-dev.bat
```

Expected:

- Frontend: `http://127.0.0.1:5173`
- Backend API: first free port in `8000, 8001, 8010, 18000`

To stop:

```powershell
.\stop-dev.bat
```

### Step 8 (manual alternative)

Backend:

```powershell
cd backend
uv run main.py serve --host 127.0.0.1 --port 8000
```

Frontend (new terminal):

```powershell
cd frontend
$env:VITE_API_BASE = "http://127.0.0.1:8000/api"
npm run dev
```

## 5. Verify the Setup

### Step 9: Backend health check

Open in browser:

- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/docs`

### Step 10: Run backend tests

```powershell
cd backend
uv run python -m pytest
```

### Step 11: Run frontend production build check

```powershell
cd frontend
npm.cmd run build
```

Note: On some Windows PowerShell setups, `npm run ...` may be blocked by execution policy. Use `npm.cmd run ...` instead.

## 6. Daily Update Workflow

After you already cloned once:

```powershell
cd <your_local_path>\materials_management
git pull
cd backend
uv sync
cd ..\frontend
npm install
cd ..
```

Then run tests and start the app as usual.

## 7. Where To Read Before Making Changes

Before implementing code changes, read in this order:

1. `specification.md`
2. `documents/technical_documentation.md`
3. `documents/source_current_state.md`
4. `documents/change_log.md`

This order matches the precedence policy used in this repository.
