# 🎓 Full-Stack Learning Management System (LMS)

A premium, production-grade monorepo containing a complete Learning Management System. Built with a **Next.js 15 App Router** frontend and an **Express + TypeScript + Prisma** backend, deployed on Vercel with a live Neon PostgreSQL cloud database.

The platform features a signature **Beige & Mint** design system, custom micro-animations, glassmorphic UI elements, full Arabic/English RTL/LTR switching, and five specialized user roles: **Admin**, **Doctor**, **TA**, **Student**, and **Support Agent**.

---

## 🚀 Live Cloud Deployment

| Service | URL |
| :--- | :--- |
| **Frontend Portal** | [https://mariam-lms-portal-pink.vercel.app](https://mariam-lms-portal-pink.vercel.app) |
| **Backend API** | [https://lms-backend-xi-blue.vercel.app](https://lms-backend-xi-blue.vercel.app) |
| **Database** | Neon Serverless PostgreSQL |

---

## 🔑 Demo Credentials

All accounts use the password: **`Password@123`**

| Role | Email | Name |
| :--- | :--- | :--- |
| **ADMIN** | `admin@lms.com` | System Admin |
| **SUPPORT** | `support@lms.com` | Help Centre Support |
| **DOCTOR** | `ahmedhagag@lms.com` | Dr. Ahmed Hagag |
| **DOCTOR** | `hossamali@lms.com` | Dr. Hossam Ali |
| **TA** | `youssefmohamed@lms.com` | Youssef Mohamed |
| **TA** | `omaryasser@lms.com` | Omar Yasser |
| **STUDENT** | `mariamgamal@lms.com` | Mariam Gamal |
| **STUDENT** | `shehabebied@lms.com` | Shehab Ebied |
| **STUDENT** | `talineyoussef@lms.com` | Taline Youssef |

---

## 🛠️ Tech Stack

### Backend (`/backend`)

| Layer | Technology |
| :--- | :--- |
| Runtime & Framework | Node.js + Express + TypeScript |
| ORM & Database | Prisma ORM → Neon Serverless PostgreSQL (production) / SQLite (local) |
| Authentication | JWT Access Tokens (15 min) + httpOnly Refresh Token Cookies (7 days) |
| File Uploads | Multer middleware with Cloudinary SDK integration + local fallback |
| Email | Nodemailer + custom email templates |
| API Structure | Role-guarded REST endpoints under `/api/v1/*` |

### Frontend (`/frontend`)

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript + React 19 |
| Styling | Tailwind CSS with custom design tokens |
| State | Zustand stores (`useAuthStore`, `useToastStore`, `useTranslation`) |
| Data Fetching | TanStack React Query v5 |
| Rich Text | Tiptap Editor |
| Icons | Lucide React |
| Modals | React Portals via `ModalPortal` component (full-viewport backdrop coverage) |

---

## 🗂️ Project Structure

```
Learning Management System/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Full data model (17+ models)
│   │   └── seed.ts                # Rich demo data seeder
│   └── src/
│       ├── middlewares/           # auth, role guards, upload (multer)
│       ├── routes/
│       │   ├── auth.ts            # Login, register, refresh, forgot/reset password
│       │   ├── courses.ts         # CRUD, enroll, attendance, announcements, comments
│       │   ├── lectures.ts        # Lecture management and watch tracking
│       │   ├── assignments.ts     # Assignments, submissions, grading
│       │   ├── quizzes.ts         # Quiz builder, attempts, grading desk
│       │   ├── meetings.ts        # Virtual meetings and attendee tracking
│       │   ├── posts.ts           # Social feed posts, likes, reposts, bookmarks
│       │   ├── emails.ts          # Internal user-to-user email system
│       │   ├── support.ts         # Help centre tickets, messages, KB articles
│       │   ├── workspace.ts       # Teams, projects, internships, applications
│       │   ├── users.ts           # User management, contacts, roles
│       │   ├── dashboard.ts       # Analytics and overview stats
│       │   ├── kb.ts              # Knowledge base articles
│       │   └── notifications.ts   # Bell notifications
│       └── utils/
│           ├── cloudinary.ts      # File upload handler
│           └── email.ts           # Email sending utility
└── frontend/
    └── src/
        ├── app/
        │   ├── login/             # Split-screen auth with LMS showcase panel
        │   ├── register/          # Split-screen signup with LMS showcase panel
        │   ├── forgot-password/   # Password recovery flow
        │   ├── reset-password/    # Token-based password reset
        │   └── dashboard/
        │       ├── layout.tsx     # Sidebar nav, topbar, dark mode, help centre modal
        │       ├── admin/
        │       │   ├── page.tsx          # Admin statistics dashboard
        │       │   ├── users/            # User management (create, edit, delete)
        │       │   ├── courses/          # Course management (CRUD, assign TAs)
        │       │   └── internships/      # Internship listings CRUD + applications table
        │       ├── doctor/
        │       │   ├── page.tsx          # Doctor course hub
        │       │   ├── courses/[id]/     # Full course control portal
        │       │   ├── lectures/         # Lecture manager
        │       │   ├── assignments/      # Assignment manager
        │       │   └── quizzes/          # Quiz builder
        │       ├── ta/
        │       │   ├── page.tsx          # TA dashboard
        │       │   ├── courses/[id]/     # TA course portal
        │       │   ├── lectures/         # TA lecture view
        │       │   └── quizzes/          # TA quiz view
        │       ├── student/
        │       │   ├── page.tsx          # Student dashboard (XP, streaks, achievements)
        │       │   ├── catalog/          # Course catalog with Egyptian pound pricing
        │       │   ├── courses/          # Enrolled courses list
        │       │   ├── courses/[id]/     # Course workspace (lectures, assignments, quizzes)
        │       │   ├── courses/certificate/ # Completion certificate (printable PDF)
        │       │   ├── courses/checkout/ # Course payment checkout
        │       │   ├── attendance/checkin/ # QR attendance check-in
        │       │   └── workspace/        # Teams, Projects, Internships hub
        │       ├── support/
        │       │   ├── page.tsx          # Support agent main dashboard + stats
        │       │   ├── tickets/          # Ticket queue and thread viewer
        │       │   ├── kb/               # Knowledge base article manager
        │       │   ├── students/         # Student search and profile lookup
        │       │   ├── reports/          # Analytics and ticket reports
        │       │   └── settings/         # Support agent profile settings
        │       ├── feed/                 # Social activity feed
        │       ├── mailbox/              # Internal email client (Inbox, Sent, Reply)
        │       ├── meetings/             # Meeting hub and live session UI
        │       ├── profile/              # Profile settings + change password
        │       └── about/                # About LMS showcase page
        └── components/
            ├── ActivityFeed.tsx     # Full social feed component (posts, likes, reposts)
            ├── AIChatbot.tsx        # Floating AI assistant sidebar
            ├── CommandPalette.tsx   # Ctrl+K global navigation overlay
            ├── TiptapEditor.tsx     # Rich text editor for announcements
            └── ModalPortal.tsx      # React Portal for full-viewport modal backdrops
```

---

## ✨ Full Feature Breakdown

### 🔐 Authentication & Authorization
- JWT-based auth with 15-minute access tokens and 7-day httpOnly refresh token cookies
- Role-based route guards: **ADMIN**, **DOCTOR**, **TA**, **STUDENT**, **SUPPORT**
- Forgot/reset password flow via email token link
- Profile photo upload with persistent avatar on re-login
- Change password form available to all user roles from profile settings

### 🎨 Design System & UX
- **Beige & Mint** signature color palette with full dark mode support
- All modals rendered via **React Portal** — backdrop fully covers the sidebar and entire viewport in both light and dark mode
- Smooth `animate-scale-up` and `animate-fade-in` micro-animations on all modal overlays
- Light mode: All form inputs, textareas, and selects use explicit `text-text-primary` and `bg-white` classes for full contrast visibility
- Custom `shadow-premium` and `shadow-soft` elevation tokens

### 🌐 Arabic/English RTL Bilingual Support
- Global language toggle in the header — switches interface between English (LTR) and Arabic (RTL) on the fly
- `useTranslation` Zustand hook with localization dictionaries for all roles
- All dashboard pages, sidebar links, toasts, and modals are fully translated

### 📊 Student Dashboard — Gamification Hub
- **Flame Streaks**: Active daily study streaks with animated orange indicator
- **XP Leveling**: Experience points tracker with level progression
- **Achievement Badges**: Unlockable badges (Perfect Attendance, Quiz Champion, Code Cadet, Curriculum Graduate)
- Academic performance overview (GPA, course progress, recent grades)

### 📚 Course System
- **Course Catalog**: Browse all available courses with Egyptian Pound (LE) pricing and enrollment
- **Checkout Flow**: Paid course enrollment with checkout confirmation modal
- **Enrolled Courses**: Personal course list with progress indicators
- **Course Workspace** (per course):
  - 📹 **Lectures**: Video player with watch-time tracking, AI summaries with hover flashcards
  - 📝 **Assignments**: Submit files, view grades, and feedback from instructors
  - 🧠 **Quizzes**: MCQ, True/False, and Short Answer — tab-switch logging, timed attempts
  - 📅 **Attendance**: View attendance history and QR check-in
  - 📣 **Announcements**: Rich text posts from Doctor/TA with inline student comments and replies
- **Completion Certificates**: Auto-generated landscape PDF certificate after 100% lecture completion

### 🧑‍💻 Code Compiler Sandbox
- In-browser multi-language code execution: JavaScript, Python 3, C++, TypeScript, Go
- Mounted only for tech-oriented courses (Cyber Security, Computer Science, Java, etc.)

### 🏫 Doctor Portal
- Overview of assigned courses with student enrollment stats
- Per-course control panel:
  - **Lectures Manager**: Upload, edit, delete video lectures
  - **Assignments Manager**: Post assignments, review and grade student submissions
  - **Quiz Builder**: Create MCQ/True-False/Short Answer quizzes with custom point weights per question
  - **Grading Desk**: View full submitted answers log per student attempt with color-coded accuracy
  - **Student Matrix**: Track lecture watch counts per student
  - **Attendance Sheet**: Manual check + QR code generation with fullscreen lightbox display
  - **Announcements**: Rich text publisher with Tiptap editor (Bold, Italic, Underline, Highlight)

### 🧑‍🏫 Teaching Assistant (TA) Portal
- Mirror of Doctor portal scoped to TA permissions
- QR code fullscreen lightbox for lecture hall projections
- TA-graded assignments reviewed by Doctor for approval
- Quizzes view with grading desk access

### 🛡️ Admin Control Center
- **Statistics Dashboard**: Total users, courses, enrollments, assignments, quizzes, platform overview
- **User Manager**: Create, edit, delete, and filter users by role
- **Course Manager**: Create courses, assign head Doctors, assign TAs, publish/unpublish
- **Internship Manager** *(new)*:
  - Create, edit, delete internship listings (company, position, skills, deadline, mode)
  - Full applications review table: view all applicants with university, year, GPA, resume CV link
  - Inline status updater per application: Applied → Under Review → Interview → Accepted → Rejected

### 📣 Social Activity Feed
- Unified feed at `/dashboard/feed` for all roles
- **Tab filters**: All Feed, My Posts, Bookmarks, My Reposts
- **Media posts**: Attach multiple photos and videos
- **Reactions**: Like, bookmark, repost, quote-repost
- **Self-service editing**: Edit or delete own posts, comments, and replies
- **Context-aware translation**: Human-crafted EN↔AR translation for all 20 seeded posts with machine-translation correction
- **Tiptap-powered announcements** inside courses with HTML rendering

### 📩 Internal Mailbox & Email System
- Dual-pane mail client at `/dashboard/mailbox`:
  - **Inbox** and **Sent** folders with read/unread state
  - Click any email to view full content, sender details, and attachment
  - **Reply Button**: Inline reply form appears below any received email — auto-fills subject as `Re: <original>` and detects correct recipient
  - **Compose**: Real-time recipient search across all users, subject, body, and optional file attachment
  - Attachment download button for files
- **Support Ticket Inbox**: Students see their help centre tickets in the mailbox with full thread history

### ❓ Help Centre Support System
- **Global `?` button** in the top header bar (all pages, all roles) — opens a support ticket modal with:
  - Subject line, description/message, optional screenshot attachment
  - Rendered via React Portal — covers entire viewport including the sidebar
- **Support Agent Account** (`support@lms.com`):
  - **Dashboard**: Overview cards (Total Tickets, New Today, Open, Pending, Resolved, High Priority, Avg Response Time) + trend charts
  - **Ticket Queue** (`/support/tickets`): List all incoming tickets, filter by status/priority, view full thread with screenshot previews
  - **Ticket Thread**: Reply directly to students, update ticket status (Open → Pending → Resolved → Closed)
  - **Knowledge Base** (`/support/kb`): Create and manage help articles for common issues
  - **Student Search** (`/support/students`): Look up any student's profile and activity
  - **Analytics & Reports** (`/support/reports`): Ticket trend visualizations
  - **Agent Settings** (`/support/settings`): Profile update and password change

### 🧑‍🤝‍🧑 Student Workspace Hub
All-in-one collaborative hub at `/dashboard/student/workspace`:

#### 🤝 Collaborative Teams
- Create a team with name and description
- Invite members by email with role assignment (Developer, Designer, PM, QA, etc.)
- Accept/decline team invitations

#### 📁 Project Portfolios
- Register a project linked to a team with:
  - Name, description, category, tech stack, key features, status, progress %
  - GitHub repo link, live demo URL, documentation link
  - Project logo image upload
  - Multiple file/code attachments upload
  - Demo video file upload or external video URL
- View project details with inline HTML5 video player and downloadable file badges
- Live Demo and GitHub Repo buttons (safe external URL formatter)

#### 💼 Internship Opportunities
- Browse all available internship listings with company info, skills, mode, deadline
- Click an internship card to open detailed view (overview, tech stack, responsibilities, requirements, benefits)
- **Apply for Internship** — full application form modal:
  - Full Name (pre-filled), Email (pre-filled)
  - University (full width)
  - GPA (e.g. 3.8 / 4.0) and Year in University (1st–5th Year / Graduate) — side by side
  - Resume/CV file upload (PDF, DOC, DOCX) with styled drag area
  - Portfolio URL (optional)
- Track submitted applications in the **My Applications** tab

### 🖥️ Virtual Meetings
- Meeting hub listing all scheduled and past sessions
- Create meetings with title, description, and scheduled time
- Live meeting room UI:
  - Webcam/mic toggle controls
  - Screen sharing via `navigator.mediaDevices.getDisplayMedia`
  - Stateful recording button (blinking red dot → download on stop)
  - Real-time physical attendees list via join/leave REST endpoints
  - Light-mode friendly control palette (mint theme)

### ⌨️ Ctrl+K Command Palette
- Global keyboard shortcut `Ctrl+K` / `Cmd+K` opens a Notion-style command overlay
- Fully keyboard-navigable (Arrow keys + Enter)
- Jump to any page, toggle language, or sign out

### 🤖 AI Copilot & Summaries
- **Floating AI Chatbot**: Context-aware assistant responding to grade, attendance, and certification queries
- **AI Lecture Summaries**: Bullet-point takeaways with hover-to-reveal review flashcards under each lecture

### 👁️ Fullscreen QR Code Lightbox
- Eye button on QR code attendance cards opens a fullscreen overlay
- Enlarged QR code with session code for lecture hall projector display

### 📜 Completion Certificates
- Auto-unlocked after 100% lecture completion
- Landscape-formatted with student name, course duration, effort hours, and stylized seal
- Custom print stylesheet for PDF export

### 🔔 Notifications
- Bell icon in the header with unread count badge
- Mark-all-read action
- Per-notification toast system for real-time feedback

### 📋 Profile & Account Settings
- Avatar upload with instant preview
- Update full name and email
- **Change Password** form for all user roles (accessible from `/dashboard/profile`)
- Support agent has dedicated settings page at `/support/settings`

### 🌍 About LMS Page
- Showcase page at `/dashboard/about` detailing platform capabilities
- Also displayed as a right-panel on the Login and Register split-screen pages

---

## 🗃️ Database Models (Prisma Schema)

| Model | Purpose |
| :--- | :--- |
| `User` | All users with role, profile photo, password hash |
| `Course` | Courses with pricing, doctor, enrollment, publish state |
| `CourseEnrollment` | Student ↔ Course many-to-many |
| `Lecture` | Video lectures with watch-time tracking |
| `LectureWatch` | Per-student watch log |
| `Assignment` | Assignment definitions per course |
| `AssignmentSubmission` | Student file submissions and grades |
| `Quiz` | Quiz metadata (title, time limit, points) |
| `QuizQuestion` | MCQ / True-False / Short Answer with point weights |
| `QuizAttempt` | Student attempt records with answers and score |
| `CourseAttendance` | Per-session attendance records |
| `Post` | Social feed posts with media attachments |
| `PostLike` | Post reaction records |
| `PostRepost` | Repost and quote-repost records |
| `PostComment` | Threaded comments and replies |
| `Bookmark` | Saved post records |
| `Email` | Internal user-to-user emails with attachments |
| `Notification` | Bell notification records |
| `SupportTicket` | Help centre tickets with status and priority |
| `TicketMessage` | Threaded messages per ticket |
| `KBArticle` | Knowledge base help articles |
| `Meeting` | Virtual meeting sessions |
| `MeetingAttendee` | Real-time meeting participant tracking |
| `WorkspaceTeam` | Student collaborative teams |
| `TeamMember` | Team membership and role records |
| `TeamInvitation` | Pending team invitations |
| `WorkspaceProject` | Student projects with files, video, links |
| `Internship` | Internship opportunity listings |
| `InternshipApplication` | Student internship applications with GPA, year, CV |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` resolves React 19 peer dependency conflicts with some packages.

### 2. Environment Setup

**Backend** — create `backend/.env`:
```env
DATABASE_URL="your-neon-postgresql-url"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

### 3. Sync Database & Seed

```bash
cd backend
npx prisma db push
npm run prisma:seed
```

Seeds: 9 user accounts, 6 courses, lectures, assignments, quizzes, attendance records, 20 social posts, emails, support tickets, KB articles, workspace teams, projects, and internship listings.

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (Express)
cd backend
npm run dev
# Runs at http://localhost:5000

# Terminal 2 — Frontend (Next.js)
cd frontend
npm run dev
# Runs at http://localhost:3000
```

---

## 🎨 Design System Color Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `beige-50` | `#FAF7F2` | Primary page background |
| `beige-100` | `#F5F0E8` | Secondary panel background |
| `beige-200` | `#EDE8DC` | Sidebar and card borders |
| `beige-300` | `#E0D8C8` | Hover states and dividers |
| `mint-400` | `#4FB583` | Interactive highlights, checkmarks |
| `mint-500` | `#2D9E6B` | Primary brand color, CTA buttons |
| `neutral-850` | `#1C1C1E` | Dark mode card backgrounds |
| `neutral-900` | `#141414` | Dark mode page background |

---

## 🔌 API Endpoints Summary

| Prefix | Router | Key Operations |
| :--- | :--- | :--- |
| `/api/v1/auth` | `auth.ts` | Login, register, refresh token, forgot/reset password |
| `/api/v1/courses` | `courses.ts` | CRUD, enroll, lectures, assignments, quizzes, attendance, announcements, comments |
| `/api/v1/lectures` | `lectures.ts` | Create, update, delete lectures; watch tracking |
| `/api/v1/assignments` | `assignments.ts` | Post assignments, submit, grade |
| `/api/v1/quizzes` | `quizzes.ts` | Build quizzes, attempt, grade desk |
| `/api/v1/meetings` | `meetings.ts` | Schedule meetings, join/leave, attendees |
| `/api/v1/posts` | `posts.ts` | Feed posts, likes, reposts, bookmarks, comments |
| `/api/v1/emails` | `emails.ts` | Compose, inbox, sent, delete internal emails |
| `/api/v1/support` | `support.ts` | Tickets, ticket messages, KB articles, agent stats |
| `/api/v1/workspace` | `workspace.ts` | Teams, projects, internships, applications, admin CRUD |
| `/api/v1/users` | `users.ts` | Profile, avatar upload, contacts list, user management |
| `/api/v1/dashboard` | `dashboard.ts` | Admin analytics and overview statistics |
| `/api/v1/notifications` | `notifications.ts` | Fetch and mark-read notifications |
| `/api/v1/kb` | `kb.ts` | Knowledge base article CRUD |
