# Iron Oasis

A gym management application for tracking trainers, clients, sessions, packages, and income designed for Iron Oasis NYC. Built for fitness businesses with multiple trainers and locations.

## Features

- **Weekly Dashboard** - View weekly breakdowns of sessions, income, and client activity for both trainers and owner of the gym
- **Trainer Management** - Add, edit, and archive trainers with tiered pricing and location assignments
- **Client Management** - Track clients with different training modes and pricing tiers
- **Session Tracking** - Log training sessions with automatic package deduction
- **Package Management** - Create and track session packages with sales bonuses
- **Late Fee Tracking** - Record and manage late fees
- **Role-Based Access** - Owner and trainer roles with appropriate permissions

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Database**: [Neon](https://neon.tech) (Serverless PostgreSQL)
- **Authentication**: [Neon Auth](https://neon.tech/docs/guides/neon-auth)
- **Icons**: [Lucide React](https://lucide.dev)
- **Testing**: [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account with a database

### Installation

1. Install dependencies (this automatically creates `.env.local` from `.env.example`):

```bash
npm install
```

2. Configure your environment variables in `.env.local`

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start development server |
| `npm run build`         | Build for production     |
| `npm run start`         | Start production server  |
| `npm run lint`          | Run ESLint               |
| `npm test`              | Run tests in watch mode  |
| `npm run test:run`      | Run tests once           |
| `npm run test:coverage` | Run tests with coverage  |
