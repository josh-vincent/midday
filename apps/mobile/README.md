# ToCLD Gatekeeper Mobile App

A mobile/tablet application for the ToCLD Gatekeeper system, built with Expo and React Native.

## Features

- **Job Entry Management**: View and manage today's job entries grouped by truck
- **Quick Add Load**: Add additional loads to existing jobs with one tap
- **Search & Filter**: Search by customer name or truck registration
- **Real-time Sync**: Automatic data synchronization with the backend
- **Create New Jobs**: Add new job entries on the go
- **Secure Authentication**: Login with email/password via Supabase

## Tech Stack

- **Expo SDK 54** - React Native framework
- **TypeScript** - Type safety
- **NativeWind v4** - Tailwind CSS for React Native
- **tRPC** - Type-safe API client
- **React Query** - Data fetching and caching
- **Expo Router** - File-based navigation
- **Expo Secure Store** - Secure token storage

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your device (optional)

### Installation

1. Clone the repository and navigate to the mobile app:
```bash
cd apps/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
EXPO_PUBLIC_API_URL=http://your-api-url:3334
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development

Start the development server:
```bash
npm run dev
```

Run on specific platform:
```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
```

## Project Structure

```
apps/mobile/
├── app/                  # Expo Router pages
│   ├── (auth)/          # Authentication flow
│   │   └── login.tsx    # Login screen
│   ├── (main)/          # Main app screens
│   │   └── index.tsx    # Gatekeeper main screen
│   └── _layout.tsx      # Root layout
├── components/          # Reusable components
│   ├── JobEntryCard.tsx
│   └── NewJobModal.tsx
├── lib/                 # Utilities
│   ├── auth.ts         # Authentication helpers
│   └── trpc.ts         # tRPC client setup
├── tailwind.config.js   # Tailwind configuration
└── global.css          # Global styles
```

## Authentication

Default test credentials:
- Email: `admin@tocld.com`
- Password: `Admin123`

## API Integration

The app connects to the main API server using tRPC. Ensure the API server is running:

```bash
cd apps/api
npm run dev
```

## Building for Production

### iOS Build
```bash
eas build --platform ios
```

### Android Build
```bash
eas build --platform android
```

### Web Build (Progressive Web App)
```bash
npx expo export --platform web
```

## Testing

Run on physical devices using Expo Go:
1. Install Expo Go from App Store/Play Store
2. Scan the QR code from the dev server
3. App will load on your device

## Troubleshooting

### Metro bundler issues
```bash
npx expo start --clear
```

### iOS Simulator not opening
```bash
sudo xcode-select -s /Applications/Xcode.app
```

### Android connection issues
Ensure your device/emulator and development machine are on the same network.

## Contributing

1. Follow the existing code patterns
2. Use TypeScript strict mode
3. Follow the tRPC query patterns from CLAUDE.md
4. Test on both iOS and Android before submitting