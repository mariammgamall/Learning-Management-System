# 🎓 Full-Stack Learning Management System (LMS)

This is a premium, state-of-the-art monorepo containing a full-stack Learning Management System (LMS). It features a Next.js 15 App Router frontend paired with an Express + TypeScript + Prisma backend.

The system is styled with a gorgeous, high-end **Beige & Mint** color palette, custom micro-animations, glassmorphic visual indicators, dynamic light/dark contrast grids, and features specialized roles: **Admin, Doctor, TA, and Student**.

---

## 🚀 Live Cloud Deployment
*   **Single Unified Portal (Frontend):** [https://mariam-lms-portal-pink.vercel.app](https://mariam-lms-portal-pink.vercel.app)
*   **API Services Server (Backend):** [https://lms-backend-xi-blue.vercel.app](https://lms-backend-xi-blue.vercel.app)
*   **Database Cloud Instance:** Neon Serverless PostgreSQL Cloud Engine

---

## 🛠️ Tech Stack & Key Features

### Backend (`/backend`)
*   **Runtime & Framework:** Node.js, Express, and TypeScript.
*   **Database Engine:** Prisma ORM supporting both local zero-dependency SQLite databases and live **Neon Serverless PostgreSQL** cloud databases.
*   **Security & Auth:** Short-lived (15-min) JWT Access Tokens passed via `Bearer` headers + long-lived (7d) secure, `httpOnly` JWT Refresh Tokens set in cookies. Role guards protect private admin, doctor, and TA operations.
*   **Static Router Collision Bypass:** Route hierarchy is optimized to prevent parameter collision (e.g. `/profile` endpoints resolved ahead of parameter paths like `/:id`).
*   **File Storage & Avatars:** Local uploads fallback serving files from `/uploads`, fully ready to upload to Cloudinary SDK.
*   **SQLite Profile Photo Persistence:** Updated auth serializers to store and restore profile avatar changes upon relogin.

### Frontend (`/frontend`)

*   **🌐 Project-Wide Arabic & English Translation (RTL Support):**
    - A global language toggle button inside the header bar.
    - Changes layout direction on-the-fly between **LTR** and **RTL** (`dir="rtl"` transition triggers).
    - Custom translation store hook (`useTranslation.ts`) managing localization dictionaries, extended to Course Details workspaces and sidebars for Doctors and TAs.

*   **🎮 Duolingo-Style Gamification Hub:**
    - Integrated gamification metrics inside the Student Dashboard.
    - **Flame Streaks:** Shows active daily study streaks with a burning orange flame.
    - **Experience Points (XP):** XP leveling trackers and level metrics (e.g., Level 3).
    - **Achievements Locker:** Display of custom unlocked badges (e.g. *Perfect Attendance*, *Curriculum Graduate*, *Quiz Champion*, *Code Cadet*) styled with contrast colors in dark mode.

*   **⌨️ Ctrl+K Notion-Style Command Palette:**
    - Global keyboard overlay trigger via `Ctrl+K` or `Cmd+K`.
    - Fully keyboard-navigable (Arrow keys + Enter) dialog allowing users to jump pages, toggle languages, or log out instantly.

*   **🤖 AI Copilot Chatbot & Auto-Summarizer:**
    - **Floating AI Chatbot Sidebar:** Floating chat assistant responding with contextual insights about grades, attendance checks, and certifications.
    - **AI Lecture Summaries:** Expands key bullet-point takeaways and hover-to-reveal review flashcards dynamically under active lecture players.

*   **💻 Multi-Language Code Compiler Sandbox:**
    - Live in-browser coding playground supporting **JavaScript, Python 3, C++ (GCC), TypeScript, and Go (Golang)**.
    - Runs code compilers natively and securely in the browser to deliver instant console outputs.
    - **Tech-Course Exclusion Rule**: Coding Sandbox tab only mounts for tech courses containing programming keywords (like *Cyber Security*, *Advanced Java Programming*, *Computer Science*) and remains hidden for non-tech subjects.

*   **📜 Landscape Completion Certificates:**
    - Automated lock checks enforcing 100% lecture watch completion.
    - Dynamic details displaying the student's full name, **12-Week course duration**, and **60 effort hours**.
    - Styled with an **Orange Scalloped "LMS Certified" Seal** matching professional security stamps.
    - Custom print stylesheet overrides matching landscape sheets for PDF save or hardware printing.

*   **👁️ Fullscreen QR Check-In Lightboxes**:
    - Adds an overlay **Eye Button** directly on generated attendance QR code cards for Doctor and TA Course Portals.
    - Displays a gorgeous, fullscreen check-in lightbox showing the enlarged QR code along with instructions and the active session code for lecture hall projections.

*   **📹 Virtual Meetings & Live Classroom Upgrades**:
    - **Physical Attendees List**: Real-time attendees list using backend join/leave REST endpoints to track students physically inside the virtual room.
    - **Light Mode UI**: Refactored control footer buttons to use a clean mint-theme palette (`bg-mint-100 border-mint-200 text-mint-600`) when active, avoiding black overlays.
    - **Stateful Recording**: Pressing the recording button toggles a blinking red dot, and clicking it a second time downloads the mock compiled log.
    - Screen Sharing: Native browser screen sharing enabled via `navigator.mediaDevices.getDisplayMedia`.

*   **📣 Course Announcements & Rich Text Editing**:
    - **Publisher Metadata**: Publisher names are prominently stamped on every posted course announcement (indicating whether it was posted by a Doctor or a TA).
    - **Announcements Toolbar**: Features a full-fledged rich text editing toolbar (**Bold**, *Italic*, Underline, and Highlight) using an integrated `TiptapEditor`.
    - **HTML Rendering**: Secure HTML template injection formats the post sentences beautifully in both light and dark modes.
    - **Comments & Replies**: Students can leave public or private comments, and instructors (Doctors/TAs) can reply to student threads inline.

*   **📝 Flexible Quiz Builder & Student Attempt Workspace**:
    - **MCQ, True/False & Short Answer**: Supported three question types in the quiz constructor inside both Doctor and TA portals. Pick correct answers via True/False dropdowns or define grading criteria in textareas.
    - **Manual Grading**: Doctors and TAs can review and grade essay/short answer attempts manually using an overwrite score dialog.
    - **Submit Button Fix**: Integrated a floating quiz layout wrapped inside Next.js portal boundaries to guarantee the submit button is never hidden by the floating AI assistant widget.

*   **📊 Student Profile, Academic Transcript & PDF Report**:
    - **Yearly Transcript Filter**: Students can view all courses, grades, and marks filtered by enrollment year or all years combined.
    - **Downloadable Transcript Report**: Dynamic print generation that outputs a high-fidelity PDF transcript with registrar/dean signature seals.
    - **Personal Development Plan**: Suggests customized careers, technical roadmaps, and personal development steps based on the student's selected interests (e.g. Frontend, Cybersecurity, AI).

*   **📱 Dedicated Social Activity Feed**:
    - **Unified Feed**: Created a single tab for the social hub at `/dashboard/feed`, accessible to Admins, Doctors, TAs, and Students.
    - **Tab-filtered Feeds**: Reordered layout moving control selector tabs (**All Feed**, **My Posts**, **Bookmarks**, **My Reposts**) under the page header description.
    - **Conditional Post Creator**: Post creation card is visible exclusively on the **All Feed** tab to maintain an uncluttered page interface.
    - **Multiple Media Uploads**: Allows attaching multiple photos and videos simultaneously during creation with instant close previews.
    - **Bookmark & Saved Posts**: Users can save/unsave posts from the three-dot action menu, persisting them to their bookmarks collection.
    - **Reposting and Quote Reposts**: Supports instant reposting and reposting with custom comments/quotes. Includes options to delete/undo reposts.
    - **Self-Service Actions**: Users can edit or delete their own posts, comments, and replies directly in the feed interface.
    - **🌐 Context-Aware Translation**:
        - Features a translate button changing directions on-the-fly depending on post context (AR -> EN or EN -> AR).
        - Direct dictionary lookup mapping for the 20 seed posts ensuring 100% accurate, human-crafted translations.
        - Built-in machine translation corrector replacing error-prone translations (e.g. automatically correcting machine translation of "experience" from "سفر" to "تجارب").
    - **Seeded Data**: Seeded database with **20 high-quality discussions** by Doctors and TAs on subjects like consistency, UI/UX, mechanical engineering, and robotics, populated with realistic comments and likes from all users.

*   **🛡️ Custom Instructor LMS Portal Controls**:
    - Restructured the course control workspaces to prevent dashboard redundancies for teaching staff while preserving direct access inside course pages:
        - **Doctors' account**: Hides the Assignments Manager and Quizzes Builder options from their main control panel.
        - **TAs' account**: Hides the Lectures Auxiliary and Quizzes Builder options from their main control panel.

---

## 🔑 Ready-to-Use Demo Credentials
All seeded accounts use the password: **`Password@123`**

| Role | Email Address | Account Name |
| :--- | :--- | :--- |
| **ADMIN** | `admin@lms.com` | System Admin |
| **DOCTOR** | `ahmedhagag@lms.com` | Dr. Ahmed Hagag |
| **DOCTOR** | `hossamali@lms.com` | Dr. Hossam Ali |
| **TA** | `youssefmohamed@lms.com` | Youssef Mohamed |
| **TA** | `omaryasser@lms.com` | Omar Yasser |
| **STUDENT** | `mariamgamal@lms.com` | Mariam Gamal|
| **STUDENT** | `shehabebied@lms.com` | Shehab Ebied |
| **STUDENT** | `talineyoussef@lms.com` | Taline Youssef |

---

## 🖼️ Project Screenshots Gallery

| Screen ID & Description | Preview |
| :--- | :--- |
| **01** - Login Page (English Interface) | ![Login English](screenshots/01_lms_login_english.png) |
| **02** - Login Page (Arabic RTL Interface) | ![Login Arabic](screenshots/02_lms_login_arabic.png) |
| **03** - Sign Up Page (No placeholder names) | ![Sign Up](screenshots/03_lms_sign_up.png) |
| **04** - Forgot Password Page | ![Forgot Password](screenshots/04_lms_forgot_password.png) |
| **05a** - Student Dashboard Top (Streaks, XP, Badges) | ![Student Dashboard Top](screenshots/05a_lms_student_dashboard_en.png) |
| **05b** - Student Dashboard Bottom (Curriculum Progress) | ![Student Dashboard Bottom](screenshots/05b_lms_student_dashboard_en.png) |
| **06** - Student Dashboard (Arabic RTL Mode) | ![Student Dashboard Arabic](screenshots/06_lms_student_dashboard_ar.png) |
| **07** - Student Course Catalog (Egypt pricing in LE) | ![Course Catalog](screenshots/07_lms_student_course_catalog.png) |
| **08** - Paid Course Checkout modal | ![Course Checkout](screenshots/08_lms_student_course_checkout.png) |
| **08b** - Landscape Completion Certificate | ![Certificate](screenshots/08b_lms_student_certificate.png) |
| **09a** - Student Lectures Player & AI Summarizer | ![Lectures View](screenshots/09a_lms_student_course_lectures.png) |
| **09b** - Code Compiler Sandbox (JavaScript/Python/C++/TypeScript/Go) | ![Coding Sandbox](screenshots/09b_lms_student_course_lectures.png) |
| **10** - Student Assignments Locker & Submissions | ![Student Assignments](screenshots/10_lms_student_course_assignments.png) |
| **11** - Student Quiz submissions (Tab-switching logging) | ![Student Quiz](screenshots/11_lms_student_course_quizzes.png) |
| **12** - Student Course Attendance logs | ![Student Attendance](screenshots/12_lms_student_course_attendance.png) |
| **13** - global Ctrl+K Notion-style Command Palette | ![Command Palette](screenshots/13_lms_student_course_command_palette.png) |
| **14** - Online Meetings Hub Dashboard | ![Meetings Hub](screenshots/14_lms_meetings_hub.png) |
| **15** - Profile settings (Avatar Upload & Save settings) | ![Profile Settings](screenshots/15_lms_user_profile_settings.png) |
| **16** - Floating AI Chatbot sidebar assistant | ![AI Chatbot](screenshots/16_lms_ai_chatbot.png) |
| **17** - Doctor Portal Home Dashboard | ![Doctor Dashboard](screenshots/17_lms_doctor_dashboard.png) |
| **18** - Doctor Course Lectures panel (Light Mode) | ![Doctor Lectures Light](screenshots/18_lms_doctor_lectures_manager.png) |
| **19** - Doctor Course Lectures panel (Dark Mode) | ![Doctor Lectures Dark](screenshots/19_lms_doctor_lectures_dark_mode.png) |
| **20** - Doctor Upload Lecture modal overlay | ![Doctor Upload Lecture](screenshots/20_lms_doctor_lectures_upload.png) |
| **21** - Doctor Assignments Manager catalog | ![Doctor Assignments](screenshots/21_lms_doctor_assignments.png) |
| **22** - Doctor Post Assignment overlay | ![Doctor Post Assignment](screenshots/22_lms_doctor_post_assignment.png) |
| **23** - Doctor Quiz Questions builder | ![Doctor Quiz Questions](screenshots/23_lms_doctor_quizzes_builder.png) |
| **24** - Doctor Quiz Publisher controls | ![Doctor Publish Quiz](screenshots/24_lms_doctor_publish_quiz.png) |
| **25** - Doctor Student Matrix (Lectures watch counts) | ![Doctor Students Matrix](screenshots/25_lms_doctor_students_matrix.png) |
| **26** - Doctor Attendance sheet (Manual checks + QR generation) | ![Doctor Attendance](screenshots/26_lms_doctor_students_attendance.png) |
| **27** - Doctor Meetings dashboard workspace | ![Doctor Meetings Tab](screenshots/27_lms_doctor_online_meetings_tab.png) |
| **28** - Doctor Virtual Meeting scheduler | ![Doctor Start Meeting](screenshots/28_lms_doctor_start_live_meeting.png) |
| **29** - Doctor Live Session call UI (Recording blink & Screen share) | ![Doctor Live Session](screenshots/29_lms_doctor_live_session.png) |
| **30** - Teaching Assistant (TA) Home Dashboard | ![TA Dashboard](screenshots/30_lms_ta_dashboard.png) |
| **31** - TA QR code display with Fullscreen Lightbox | ![TA Fullscreen QR Code](screenshots/31_lms_ta_students_attendance_qr_code.png) |
| **32** - System Admin Control Dashboard statistics | ![Admin Dashboard](screenshots/32_lms_system_admin_dashboard.png) |
| **33** - System Admin User registry manager | ![Admin User Manager](screenshots/33_lms_system_admin_users_manager.png) |
| **34** - System Admin Courses catalog creator | ![Admin Course Manager](screenshots/34_lms_system_admin_courses_manager.png) |

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
Open two terminal windows to run both services simultaneously.

**Backend Setup:**
```bash
cd backend
npm install
```

**Frontend Setup:**
```bash
cd frontend
npm install --legacy-peer-deps
```
> Note: `--legacy-peer-deps` is used to allow React 19 peer resolutions on packages like Lucide Icons.

---

#### Step 2: Synchronize and Seed Database
Generate the Prisma Client and load our rich demo curriculum catalog:

```bash
cd backend
npx prisma db push
npm run prisma:seed
```
This builds your local `dev.db` database and seeds it with **6 Courses** (including paid courses priced in Egyptian Pounds), lecture watch logs, and predefined users.

---

#### Step 3: Run Dev Servers

**Start Express Backend:**
```bash
cd backend
npm run dev
```
Runs at `http://localhost:5000` with API endpoints prefixed under `http://localhost:5000/api/v1`.

**Start Next.js Frontend:**
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:3000`.

---

## 🎨 UI/UX Color Tokens
The interface strictly enforces the custom design system:
*   **Beige-50 (`#FAF7F2`):** Primary background base.
*   **Beige-100 (`#F5F0E8`):** Contrast panel background.
*   **Beige-200 (`#EDE8DC`):** Elegant Sidebar navigation background.
*   **Mint-400 (`#4FB583`):** Interaction highlights and checkmarks.
*   **Mint-500 (`#2D9E6B`):** Brand accents, main buttons, and call-to-actions.
