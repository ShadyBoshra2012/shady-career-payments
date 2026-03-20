# Shady Career Payments

A modern Angular web application for tracking career/freelance payments, salary disbursements, charitable giving, and financial analytics — replacing manual Excel spreadsheets with a responsive, Firebase-powered dashboard.

<!-- TODO: Add screenshots here -->

---

## Features

### Core Modules

- **Dashboard** — 8 interactive charts (line, bar, doughnut): monthly earnings, earnings by project, God's Money accumulated vs disbursed, accumulative earnings, salary by employee, monthly salary expenses, God's % over time, yearly comparison
- **Payments** — Full CRUD for career/freelance payments with project scopes, expandable payment splits, and God's Money percentage allocation
- **Projects & Employers** — Manage project/employer records with stats (total projects, active projects, total revenue)
- **God's Money** — Track charitable disbursements with automatic balance computation (accumulated from payment allocations minus disbursed)
- **Employees** — Maintain a shared employee pool with position, salary, payment method, and account details
- **Salaries** — Track monthly salary payments per employee with date filtering and totals

### Additional Features

- **Hide Amounts** — Global privacy toggle that blurs all financial figures and charts (persisted in localStorage)
- **Attachments** — Upload notes and images for any payment, stored in Firebase Storage
- **Import / Export** — Full JSON and Excel export/import for data backup; seed support from original Excel spreadsheets
- **Authentication** — Email/password login with Firebase Auth
- **Responsive Design** — Mobile-first layout with Angular Material and adaptive sidenav

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, SCSS, lazy routes) |
| UI | Angular Material 21 (Material 3 custom theme) |
| Backend | Firebase (Auth, Firestore, Storage, Hosting) |
| Charts | Chart.js 4 + ng2-charts |
| Export | SheetJS (xlsx) + file-saver |
| Build | Angular CLI 21 / esbuild |

---

## Project Structure

```
src/app/
├── core/
│   ├── models/           # TypeScript interfaces (Payment, Employee, Salary, etc.)
│   ├── services/         # Auth, Firestore CRUD, Storage, Export/Import, AmountVisibility
│   └── guards/           # Auth & login route guards
├── features/
│   ├── auth/             # Login component
│   ├── dashboard/        # Dashboard with 8 charts + stat cards
│   ├── payments/         # Payments list + dialog (CRUD, expandable splits)
│   ├── projects/         # Projects & Employers management (CRUD)
│   ├── gods-money/       # God's Money list + dialog (CRUD)
│   ├── employees/        # Employees list + dialog (CRUD)
│   ├── salaries/         # Salary Payments list + dialog (CRUD)
│   ├── settings/         # Export, Import, Seed from Excel
│   └── layout/           # Responsive sidenav layout shell
└── shared/
    └── components/       # AttachmentManager (reusable file upload)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (tested with 23.x)
- **npm** 9+
- **Firebase CLI** — `npm install -g firebase-tools`
- A **Firebase project** with Firestore, Auth (Email/Password), and Storage enabled

### 1. Clone & Install

```bash
git clone https://github.com/ShadyBoshra2012/shady-career-payments.git
cd shady-career-payments
npm install
```

### 2. Configure Firebase

Create your own Firebase project at [console.firebase.google.com](https://console.firebase.google.com), then update the config in both environment files:

**`src/environments/environment.ts`** and **`src/environments/environment.prod.ts`**:

```ts
export const environment = {
  production: false, // true for prod
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID',
  },
};
```

### 3. Set Up Firebase Services

In the Firebase Console:

1. **Authentication** → Enable **Email/Password** sign-in method
2. **Firestore Database** → Create database (start in production mode)
3. **Storage** → Enable Firebase Storage
4. **Create a user** → In Authentication → Add user (email + password)

### 4. Deploy Security Rules

The repo includes Firestore and Storage security rules that restrict access to authenticated users:

```bash
firebase login
firebase deploy --only firestore:rules,storage
```

### 5. Run Locally

```bash
ng serve
```

Open [http://localhost:4200](http://localhost:4200) and log in with the user you created.

### 6. Build & Deploy

```bash
ng build
firebase deploy
```

The production build outputs to `dist/shady-career-payments/browser/` and deploys to Firebase Hosting.

---

## Seeding Data from Excel

If you're migrating from Excel spreadsheets:

1. Navigate to **Settings** in the app
2. **Seed Career Payments (.xlsx)** — Select your career payments spreadsheet (expected sheets: `Payments`, `GODs Money`)
3. **Seed Salaries (.xlsx)** — Select your salaries spreadsheet (expected sheets: `Overview`, salary data sheets)

The app will parse the Excel files client-side and import all records into Firestore.

---

## Security Rules

**Firestore** (`firestore.rules`):
```
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

**Storage** (`storage.rules`):
```
match /{allPaths=**} {
  allow read, write: if request.auth != null;
}
```

All data access requires authentication. There is no public registration — users must be created manually in the Firebase Console.

---

## Scripts

The `scripts/` directory contains Node.js utilities for inspecting and seeding data from Excel files. These are **development-only tools** for initial data migration and are not required to run the app.

---

## License

This project is open source. Feel free to fork and adapt it for your own use.

---

**Built by [Shady Boshra](https://github.com/ShadyBoshra2012)**
