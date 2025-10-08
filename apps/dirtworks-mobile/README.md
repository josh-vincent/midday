# ToCLD Gatekeeper Mobile App

A React Native mobile application built with Expo for managing job entries and load tracking for the DirtWorks platform.

## Features

- 📱 **Mobile-First Design** - Optimized for phones and tablets
- 🔐 **Secure Authentication** - Token-based auth with SecureStore
- 👥 **Team Management** - Multi-team support
- 📊 **Job Tracking** - Create and manage job entries
- 🚛 **Load Management** - Track multiple loads per truck
- 🔄 **Real-time Updates** - Auto-refresh with React Query
- ⚡ **Offline Ready** - Offline support infrastructure
- 🎨 **Modern UI** - Clean, professional interface with NativeWind

## Tech Stack

- **Expo SDK 54** - React Native development platform
- **React Native 0.76.5** - Mobile framework
- **Expo Router 6** - File-based routing
- **tRPC** - Type-safe API client
- **React Query v4** - Data fetching and caching
- **NativeWind v2** - Tailwind CSS for React Native (babel plugin only)
- **TypeScript** - Type safety
- **Zod** - Runtime validation

## Quick Start

### 1. Install Dependencies

From the monorepo root:

```bash
cd /Users/mini/Claude/github/midday
bun install
```

### 2. Set Up Environment

Create `.env.local` in the mobile app directory:

```bash
cd apps/dirtworks-mobile
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
EXPO_PUBLIC_API_URL=http://localhost:3334
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Start the App

**Option A: Using the clean startup script (recommended)**

```bash
chmod +x start-clean.sh
./start-clean.sh
```

**Option B: Manual start**

```bash
npx expo start --clear
```

**Option C: Development mode**

```bash
bun run dev
```

### 4. Open on Device

- Scan the QR code with the Expo Go app (iOS) or Camera app (Android)
- Wait for the bundle to build
- App should launch and show the login screen

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

### Metro Bundler Won't Start

```bash
# Kill all processes
pkill -f "expo|metro"

# Clear all caches
rm -rf .expo node_modules/.cache

# Restart
npx expo start --clear
```

### "nativewind/metro" Error

This is expected! We're using NativeWind v2 WITHOUT the metro plugin. The error can be ignored as the app will work correctly with the babel plugin only.

### tRPC Queries Fail

1. Ensure API is running: `http://localhost:3334`
2. Check `.env.local` has correct API URL
3. Verify authentication token is valid
4. Check network connectivity (use tunnel for real device)

### App Won't Load on Device

1. Ensure device and computer are on same network
2. Try tunnel mode: `npx expo start --tunnel`
3. Check firewall settings
4. Verify Expo Go app is up to date

### Dependencies Out of Sync

```bash
# From monorepo root
cd /Users/mini/Claude/github/midday
bun run clean:workspaces
bun install
```

## Recent Fixes (2025-10-06)

All major configuration issues have been resolved:

1. ✅ Metro bundler configured for NativeWind v2 and monorepo
2. ✅ Babel configuration cleaned up
3. ✅ Root layout includes all required providers (SafeAreaProvider, GestureHandlerRootView)
4. ✅ tRPC setup uses flexible type imports
5. ✅ All queries and mutations use correct tRPC patterns
6. ✅ Safe area handling implemented consistently
7. ✅ Gesture handling properly configured

See `FIXES_APPLIED.md` for detailed information on all fixes.

## Contributing

1. Follow the existing code patterns
2. Use TypeScript strict mode
3. Follow the tRPC query patterns from CLAUDE.md
4. Test on both iOS and Android before submitting
5. Always use SafeAreaView for screens
6. Implement proper error handling and loading states