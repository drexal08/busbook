# BusBook

Rwanda's intercity bus booking platform - search routes, select seats, pay with mobile money, and receive QR tickets instantly.

## Features

- **Route Search**: Find bus routes between cities in Rwanda
- **Seat Selection**: Choose your preferred seat from interactive bus layouts
- **Mobile Money Payment**: Pay securely via MTN Mobile Money
- **QR E-Tickets**: Receive scannable e-tickets instantly
- **Multi-Role Support**: Passenger, Company, Operator, and Admin dashboards
- **Real-time Updates**: Live seat availability and booking confirmations
- **Authentication**: Email/password, Google, Facebook, Phone OTP, and Email OTP

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore), Netlify Functions
- **Icons**: React Iconly
- **QR Codes**: qrcode.react, html5-qrcode

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project
- Netlify account (for functions deployment)
- SMTP email service (for email OTP)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Firebase and SMTP credentials
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

### Setup Guide

For detailed setup instructions including Firebase configuration, authentication methods, and Netlify deployment, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

## Scripts

- `npm run dev` - Start development server
- `npm run dev:netlify` - Start with Netlify functions
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run validate-env` - Validate environment variables

## Project Structure

```
src/
├── components/    # Reusable UI components
├── contexts/      # React context providers (Auth, Data, FeatureFlags)
├── lib/           # Utilities (Firebase, auth, firestore, payments)
├── pages/         # Page components
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## License

Private - All rights reserved
