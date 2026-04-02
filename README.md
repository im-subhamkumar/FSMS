# ✈️ FSMS (Flight School Management System)

Welcome to the **Flight School Management System (FSMS)** repository! 

FSMS is a comprehensive, monolithic application designed to manage every aspect of a modern flight school. From tracking student progress and instructor schedules to handling aircraft maintenance, billing, and flight logging, FSMS centralizes all operations into one platform. 

This environment is designed as a SaaS-ready setup where multiple teams contribute to distinct modules within a shared App Shell and backend API.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Zustand (Global State Management)
- **Backend**: Node.js, Express.js
- **Database**: MySQL, Prisma ORM
- **DevOps**: Docker & Docker Compose

---

## 📂 Project Structure

The repository is divided into two primary directories, configured to run together using Docker:

```text
FSMS/
├── frontend/             # React application (Vite)
│   └── src/
│       ├── layout/       # Core App Shell (Sidebar, Header, Layout)
│       ├── components/   # Shared global components
│       ├── modules/      # 📦 TEAM MODULES LIVE HERE
│       └── routes.jsx    # Global routing setup
├── backend/              # Express backend
│   ├── prisma/           # Database schema (schema.prisma)
│   ├── routes/           # 📦 TEAM API ROUTES LIVE HERE
│   └── index.js          # Express server entry point
└── docker-compose.yml    # Orchestrates Frontend, Backend, and MySQL
```

---

## 🚀 Getting Started

We use Docker to make sure everyone is running the exact same environment. You don't need to install Node or MySQL locally on your machine—just Docker!

### 1. Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and ensure it is running.
- Install [Git](https://git-scm.com/).

### 2. Setup the Project

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FSMS
   ```
   *(Be sure to replace `<repository-url>` with the actual Git URL)*

2. **Start the environment:**
   ```bash
   docker-compose up --build
   ```
   *Note: The first time you run this, it will take a few minutes to download the node images and build the containers.*

3. **Access the application:**
   - **Frontend (Web App):** [http://localhost:5173](http://localhost:5173)
   - **Backend (API):** [http://localhost:5000](http://localhost:5000)
   - **Database (MySQL):** Runs on port `3306`

---

## 🏗️ How to Work on Modules (VERY IMPORTANT)

To prevent code conflicts, the application architecture relies on modular development. You should only work inside your assigned module.

### Frontend
1. All your module code goes into `frontend/src/modules/YourModuleName/`.
2. Inside your module folder, you should have your own `pages`, `components`, and `hooks` if necessary.
3. Your module will have a local `pages/index.jsx` which exports all the sub-routes for your specific module.

### Backend
1. Your backend API routes go inside `backend/routes/yourModuleRoutes.js`.
2. **API Naming Convention:** All APIs for your module must be prefixed with `/api/{module-name}`. 
   - *Example:* `/api/students/profile` or `/api/aircraft/status`.

---

## 🗄️ Database Guidelines

We are using **Prisma ORM** coupled with a MySQL database.

1. **Schema File:** All database tables are defined in `backend/prisma/schema.prisma`.
2. **Global Relationship Rule:** Whenever you create a new table/model for your module, it **must** have a relational tie-back to the primary `User` model, if applicable (e.g., establishing who created or updated the record).
3. **Database Migrations:** When you update `schema.prisma`, you need to push the changes to the database. Run this command while the Docker container is running:
   ```bash
   docker exec -it fsms_backend npx prisma db push
   ```

---

## ⚠️ Rules for Contributors

To ensure the master branch stays stable:
1. **DO NOT** modify anything inside the `frontend/src/layout/` folder (App Shell, Sidebar, Navigation).
2. **DO NOT** modify the global `frontend/src/routes.jsx` file. The T10 team leads will map your module into the global system.
3. **DO NOT** modify raw Dockerfiles or `docker-compose.yml`.
4. Follow basic clean code conventions, consistent `kebab-case` for URLs, and `PascalCase` for React components.

---

## 🔄 Integration Workflow

1. Create a branch for your module: `git checkout -b feature/your-module-name`.
2. Build and test everything inside your dedicated `modules/` folder.
3. Commit your changes and push to GitHub.
4. **Create a Pull Request (PR).** 
5. The **T10 Integration Team** will review the PR, connect your module to the main global router, add it to the Sidebar navigation, and merge it.

---

## 💻 Common Commands

Use these commands while inside the root `FSMS/` folder.

- **Start the app:**
  ```bash
  docker-compose up
  ```
- **Stop the app:**
  ```bash
  docker-compose down
  ```
- **Apply database changes (Prisma):**
  ```bash
  docker exec -it fsms_backend npx prisma db push
  ```
- **View Backend logs:**
  ```bash
  docker logs -f fsms_backend
  ```

---

## 🔧 Troubleshooting

- **"Docker says ports are already in use"**
  Ensure you do not have another local MySQL (port 3306) or Node process running. Stop them, then run `docker-compose down` and `docker-compose up` again.
- **"Database Connection Refused"**
  Sometimes the backend starts before MySQL is fully ready. Wait 5-10 seconds for MySQL to initialize.
- **"My frontend changes aren't showing up"**
  Vite's live reload via Docker is handled automatically. If it stalls, simply refresh your browser, or stop Docker (`Ctrl+C`) and start it again with `docker-compose up`.

---

**Maintained by T10 – Integration & DevOps Team**
