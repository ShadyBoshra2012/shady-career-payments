# Shady Career Payments

A comprehensive Angular 19 web application for managing career payments, salary disbursements, and financial tracking — replacing manual Excel spreadsheets with a modern, responsive, Firebase-powered app.

## Features

- **Payments Management** — Track all career/freelance payments with project scopes, dual currency (EGP/USD), payment splits, and God's Money allocation
- **God's Money Tracking** — Full CRUD for charitable disbursements with balance computation (accumulated from payments minus disbursed)
- **Employee Management** — Maintain a shared employee pool with position, salary, payment method, and account info
- **Salary Payments** — Track monthly salary payments per employee with filtering and totals
- **Dashboard** — 8 interactive charts: monthly earnings, earnings by project, God's Money accumulated vs disbursed, accumulative earnings, salary by employee, monthly salary expenses, God's % over time, yearly comparison
- **Attachments** — Upload notes and images for any payment, stored in Firebase Storage
- **Import / Export** — JSON and Excel export/import for data backup + original Excel seed support
- **Multi-user Auth** — Email/password authentication with admin/viewer roles
- **Responsive Design** — Mobile-first layout with Angular Material and adaptive sidenav

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 19 (standalone components, SCSS) |
| UI | Angular Material (Material 3 theme) |
| Backend | Firebase (Auth, Firestore, Storage, Hosting) |
| Charts | Chart.js + ng2-charts |
| Export | xlsx + file-saver |
| Build | Angular CLI |

## Project Structure

```
src/app/
├── core/
│   ├── models/          # TypeScript interfaces
│   ├── services/        # Auth, Firestore, Storage, Data, Export/Import
│   └── guards/          # Auth & login route guards
├── features/
│   ├── auth/            # Login & Register components
│   ├── dashboard/       # Dashboard with 8 charts + stat cards
│   ├── payments/        # Payments list + dialog (CRUD)
│   ├── gods-money/      # God's Money list + dialog (CRUD)
│   ├── employees/       # Employees list + dialog (CRUD)
│   ├── salaries/        # Salary Payments list + dialog (CRUD)
│   ├── settings/        # Export, Import, Seed from Excel
│   └── layout/          # Responsive sidenav layout shell
└── shared/
    └── components/      # AttachmentManager (reusable file upload)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)

### Install & Run

```bash
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200).

### Build for Production

```bash
ng build
```

Output is in `dist/shady-career-payments/`.

### Deploy to Firebase

```bash
firebase login
firebase deploy
```

## Seeding Data from Excel

1. Go to **Settings** in the app
2. Click **Seed Career Payments (.xlsx)** and select your `My Career Payments .xlsx` file
3. Click **Seed Salaries (.xlsx)** and select your `BeLightTech Salaries.xlsx` file

This imports all historical data into Firestore.

## Firebase Project

- Project ID: `shady-career-payments`
- Hosting: Firebase Hosting
- Database: Cloud Firestore
- Auth: Email/Password
- Storage: Firebase Storage
