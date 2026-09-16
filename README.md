# Apex Smart Hostel Management System (ERP & Living Portal)

> **Institutional Grade Residential Management Platform**  
> Built for University Residential Campuses, B.Tech CSE Final Year Projects, and Viva Demonstrations.

---

## 🏛️ Project Overview

The **Apex Smart Hostel Management System** is a modern, responsive, full-stack campus living platform designed to mirror real-world college residential operations. Rather than a basic student CRUD project, this platform implements institutional workflows:
- **Role-Based Workflows**: Independent, restricted dashboards for **Students**, **Wardens**, and **System Administrators**.
- **1-Click Viva Demo Switcher**: A dedicated switcher in the top navigation allowing examiners and students to flip seamlessly between Student, Warden, and Admin views without repeatedly typing passwords.
- **Architectural Room & Bed Visualizer**: Interactive 2D floor maps showing room numbers, sharing types, and individual beds with color-coded live states (Vacant, Occupied with resident hover cards, and Maintenance).
- **Gemini-Powered AI Complaint Triage**: Automatic classification of natural-language maintenance descriptions into category, severity/SLA, and assigned technical departments (e.g. Electrical, Plumbing, Carpentry) with full student editing control before submission.
- **HostelGenie (Grounded AI Resident Assistant)**: A resident chatbot grounded in real-time database context (knows today's actual mess menu, student's assigned room and roommates, pending tickets, and campus curfew hours).
- **Smart Mess & Nutrition Hub**: Revolving 7-day breakfast, lunch, evening snacks, and dinner schedules with dietary tags, chef specials, and multi-factor student quality ratings (Taste, Hygiene, Quantity, Cleanliness).
- **Digital Gate Pass & Outing Clearance**: Curfew compliance system with online outing applications, parental contact logging, warden review, and cryptographically signed QR clearance tokens.
- **Itemized Fee Billing & Digital Receipt Generator**: Complete semester fee breakdown (Room rent, Mess fee, Wi-Fi surcharge, Resident welfare), simulated UPI/Card checkout modal, and printable official receipts with the institutional seal and verification watermark.
- **Dual-Engine Relational Database Strategy**: Full MySQL 8.0 DDL schema and realistic seed scripts (`schema.sql`, `seeds.sql`), backed by an automatic embedded SQLite engine fallback so the project runs immediately on any machine with zero configuration friction.

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 (Vite) | High-performance SPA with client-side routing |
| **Styling** | Tailwind CSS + Plus Jakarta Sans | Modern campus ERP aesthetic, responsive across mobile, tablet & desktop |
| **Icons & Visuals** | Lucide React | Clean, consistent icons across all navigation bars, stat cards & badges |
| **Charts & Analytics**| Recharts | Interactive SVG bar charts, pie charts & capacity comparisons |
| **Backend** | Node.js + Express.js (ES Modules) | Clean RESTful API architecture with middleware-driven security |
| **Authentication** | JWT (JSON Web Tokens) + Bcrypt.js | Cryptographic password hashing and role authorization guards |
| **Database** | MySQL 8.0+ / SQLite3 Dual Adapter | Standard relational tables, foreign keys, cascade deletes, and indexing |
| **AI Services** | Google Gemini API (1.5 Flash) | Natural language complaint triage and context-grounded resident assistant |

---

## 👥 Demo Login Credentials

For quick evaluation and examiner testing, the login screen includes **1-Click Demo Buttons** that automatically fill in credentials:

| Role | Email Address | Password | Demo Persona Details |
|---|---|---|---|
| **Student** | `student@hostel.com` | `student123` | **Aarav Sharma**, B.Tech CSE 3rd Year, Roll: `21BCSE104`, Room: `B-204 (Bed 1)` |
| **Warden** | `warden@hostel.com` | `warden123` | **Dr. Rajesh Verma**, Chief Warden, Himalaya Boys Hostel, Office: `Block A Admin` |
| **Admin** | `admin@hostel.com` | `admin123` | **Chief Administrator**, Full System Oversight & Infrastructure Management |

> 💡 **Viva Tip**: Once logged in, use the **Viva Switch** pills in the top navbar (`Student` \| `Warden` \| `Admin`) to instantly demonstrate any role to your examiner without logging out!

---

## 📁 Project Structure

```
smart-hostel-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js        # Authentication & Profile
│   │   │   ├── studentController.js     # Student Dashboard Aggregator
│   │   │   ├── roomController.js        # Bed Visualizer & Allocation
│   │   │   ├── complaintController.js   # Maintenance Lifecycle & Triage
│   │   │   ├── messController.js        # Dining Menus & Ratings
│   │   │   ├── noticeController.js      # Circulars & Alerts
│   │   │   ├── feeController.js         # Invoices, Mock Pay & Receipts
│   │   │   ├── gatePassController.js    # Night Outing & QR Passes
│   │   │   ├── analyticsController.js   # Operational Intelligence
│   │   │   ├── aiController.js          # Gemini Triage & Assistant
│   │   │   └── adminController.js       # Global Infrastructure
│   │   ├── routes/                      # Modular Express Route Handlers
│   │   ├── middleware/
│   │   │   └── auth.js                  # JWT Token & Role Authorization
│   │   ├── services/
│   │   │   └── aiService.js             # Gemini SDK + Heuristic NLP Fallback
│   │   ├── database/
│   │   │   ├── schema.sql               # Production MySQL 8.0 DDL Schema
│   │   │   ├── seeds.sql                # Realistic Institutional Seed Data
│   │   │   └── db.js                    # Dual-Engine Database Adapter
│   │   ├── config.js                    # Port, Secrets & DB Config
│   │   └── server.js                    # Express Application Entrypoint
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx           # Topbar with 1-Click Viva Switcher
│   │   │   │   ├── Sidebar.jsx          # Collapsible Role Navigation
│   │   │   │   └── Footer.jsx
│   │   │   └── ui/
│   │   │       ├── BedVisualizer.jsx    # Interactive Architectural Bed Matrix
│   │   │       ├── Modal.jsx            # Reusable Accessible Dialog
│   │   │       └── StatCard.jsx         # KPI Card with Trends & Icons
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Role-based Session Management
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx          # Public Portal & Facility Showcase
│   │   │   ├── LoginPage.jsx            # Sign In with Demo Fillers
│   │   │   ├── RegisterPage.jsx         # Student Self-Registration
│   │   │   ├── student/                 # 8 Dedicated Student Modules
│   │   │   ├── warden/                  # 8 Dedicated Warden Modules
│   │   │   └── admin/                   # 5 Dedicated Admin Modules
│   │   ├── services/
│   │   │   └── api.js                   # Unified REST API Client
│   │   ├── App.jsx                      # Protected Route Guard Layout
│   │   ├── main.jsx                     # Vite React Root
│   │   └── index.css                    # Tailwind Directives
│   ├── index.html
│   ├── vite.config.js                   # Vite Proxy Configuration
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🗄️ Database Architecture & Relational Schema

The database design contains **17 normalized tables** adhering to 3rd Normal Form (3NF) with referential integrity constraints:

1. **`users`**: Central authentication table with hashed passwords and role flags (`student`, `warden`, `admin`).
2. **`hostels`**: Campus buildings (e.g., Himalaya Boys Hostel, Nilgiri Girls Hostel).
3. **`blocks`**: Wings inside each hostel (e.g., Block A Aryabhata, Block B Bhaskara).
4. **`rooms`**: Specific rooms across floor levels, air-conditioning type, and semester fees.
5. **`beds`**: Individual beds inside each room (`vacant`, `occupied`, `maintenance`).
6. **`students`**: Academic profile, roll numbers, branches, parent phone, blood group.
7. **`wardens`**: Staff roster, employee ID, assigned hostel, and cabin location.
8. **`room_allocations`**: Many-to-many relationship linking students to beds with timestamps and status (`active`, `vacated`, `transferred`).
9. **`complaints`**: Maintenance tickets with category, location, priority, department, and assigned technician.
10. **`complaint_updates`**: Audit log tracking status lifecycle (`Pending` → `Assigned` → `In Progress` → `Resolved`).
11. **`mess_menu`**: 7-day revolving menu items across Breakfast, Lunch, Snacks, Dinner, and Chef Specials.
12. **`mess_feedback`**: Resident multi-point ratings (Overall, Taste, Quality, Cleanliness) and remarks.
13. **`notices`**: University circulars with priority tags (`Urgent`, `High`, `Normal`, `Low`).
14. **`fees`**: Semester ledger balances, payment status (`Paid`, `Partial`, `Pending`), and receipt numbers.
15. **`room_change_requests`**: Resident transfer applications with reason and warden review notes.
16. **`gate_passes`**: Digital leave applications with departure/return times, QR tokens, and warden authorization.
17. **`attendance`**: Daily biometric roll-call records and curfew check-in timestamps.

---

## 🚀 Step-by-Step Run Instructions

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **MySQL**: (Optional) MySQL 8.0+ if running with MySQL server. The system automatically runs with zero-config SQLite out-of-the-box if MySQL is offline.

---

### 2. Backend Setup & Startup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5001
   JWT_SECRET=apex-hostel-jwt-secret-key-2026-btech-cse
   DB_TYPE=sqlite
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the backend server:
   ```bash
   npm start
   # or with auto-restart:
   npm run dev
   ```
   *The server will boot on `http://localhost:5001`.*

---

### 3. (Optional) Connecting to MySQL Server

If you wish to demonstrate the system directly on a local MySQL server:

1. Open MySQL terminal or phpMyAdmin / MySQL Workbench:
   ```bash
   mysql -u root -p
   ```

2. Import the schema and seed scripts:
   ```sql
   source /absolute/path/to/backend/src/database/schema.sql;
   source /absolute/path/to/backend/src/database/seeds.sql;
   ```

3. Update `backend/.env`:
   ```env
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=smart_hostel_db
   ```

4. Restart backend:
   ```bash
   npm run dev
   ```

---

### 4. Frontend Setup & Startup

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🤖 Configuring Google Gemini AI

The AI layer (`backend/src/services/aiService.js`) is designed modularly:
1. **With Gemini API Key**:
   - Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
   - Add your key to `backend/.env`:
     ```env
     GEMINI_API_KEY=AIzaSy...
     GEMINI_MODEL=gemini-1.5-flash
     ```
   - Restart backend. Both the **AI Complaint Triage** and **HostelGenie Chatbot** will automatically utilize Gemini 1.5 Flash.
2. **Without Gemini API Key (Offline Viva Mode)**:
   - If the API key is not provided or if the network is disconnected, the system automatically activates its **Smart Heuristic & Grounding NLP Engine**.
   - It triages complaints accurately based on domain keywords and answers student queries using real-time database lookups.
   - **Result**: You will never experience a crashed demo or error screen during your viva presentation!

---

## 🎓 Viva & Project Demonstration Guide (CSE Q&A)

### Q1: What problem does this system solve compared to traditional hostel software?
> **Answer**: Traditional hostel software consists of basic CRUD forms where wardens manually enter room numbers and students register paper complaints. Apex Smart Hostel automates residential operations using:
> 1. An **architectural bed visualizer** that tracks individual bed states and prevents double-allocations.
> 2. **AI-driven complaint triage** that extracts category, urgency, and estimated SLA from natural language descriptions, dispatching tickets to technicians instantly.
> 3. **Grounded AI conversational assistance** so students can ask about dinner, curfew, and roommate details without navigating multiple tabs.
> 4. **Digital gate pass compliance** that prevents unauthorized departures after the 09:30 PM curfew.

### Q2: How is role-based access control (RBAC) enforced securely?
> **Answer**:
> - Passwords are cryptographically salted and hashed using **Bcrypt** with cost factor 10.
> - Upon login, an asymmetric/HMAC **JWT** token is generated containing the user's `id`, `email`, and `role`.
> - On the backend, an Express middleware (`authenticate`) verifies the token signature on every request, and `requireRole(['warden', 'admin'])` guards administrative endpoints.
> - On the frontend, React Router nested route layouts (`<AppLayout allowedRoles={[...]} />`) inspect the authenticated user role and redirect unauthorized users away from restricted screens.

### Q3: How does the AI Assistant avoid hallucinations?
> **Answer**:
> We implement **Retrieval-Augmented Grounding (RAG)**:
> Before prompting the model, the backend queries the student's current room allocation, roommate list, active complaint tickets, today's 4-meal mess schedule, and top circulars directly from the database. This verified context is injected into the system prompt. The model is constrained to answer only using facts present in the verified context.

### Q4: How is database integrity maintained during room allocation and vacancy?
> **Answer**:
> - We utilize foreign key constraints with `ON DELETE CASCADE` and unique constraints (`room_id, bed_number`).
> - When a bed is allocated, the backend deactivates any older active allocation for that student, updates `beds.status = 'occupied'`, and verifies if all beds in that room are full to update `rooms.status = 'full'`.
> - When vacating a bed, the allocation record is marked `vacated` with an `allocated_to` timestamp, and the bed is reset to `vacant`.

### Q5: How is payment processed in this system?
> **Answer**:
> To ensure viva repeatability without charging real credit cards, the system features an interactive **Mock Payment Gateway**. Students select their preferred method (UPI QR Code, Debit Card, or Net Banking) and specify an amount. The backend validates the amount, credits the ledger, generates a cryptographic transaction ID, marks the balance as `Paid` or `Partial`, and generates an **official digital receipt** with the university seal and watermark.

---

## 🏆 Summary
The **Apex Smart Hostel Management System** delivers a comprehensive, realistic, and viva-ready platform that blends enterprise architectural patterns, responsive UI design, and practical AI integration.
