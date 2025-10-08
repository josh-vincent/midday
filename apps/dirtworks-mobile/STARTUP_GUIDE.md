# Mobile App Startup Guide

## Status: ✅ READY TO RUN

All configuration issues have been fixed. The app is ready to start.

## Quick Start (60 seconds)

### Step 1: Navigate to Mobile App

```bash
cd /Users/mini/Claude/github/midday/apps/dirtworks-mobile
```

### Step 2: Start the App

Choose one of these options:

**Option A: Clean Start (Recommended)**
```bash
./start-clean.sh
```

**Option B: Manual Clean Start**
```bash
npx expo start --clear
```

**Option C: Regular Start**
```bash
bun run dev
```

### Step 3: Open on Device

1. **Install Expo Go** on your mobile device:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan the QR code** displayed in your terminal

3. **Wait for the app to load**

4. **You should see the login screen!**

## What Was Fixed

### Configuration Files Updated

1. **metro.config.js** - Added NativeWind v2 support and monorepo configuration
2. **babel.config.js** - Removed non-existent worklets plugin
3. **app/_layout.tsx** - Added SafeAreaProvider and GestureHandlerRootView
4. **lib/trpc.ts** - Flexible type imports for better compatibility
5. **app/(auth)/teams.tsx** - Corrected tRPC query/mutation patterns

### All Issues Resolved

✅ Metro bundler configuration for NativeWind v2
✅ Babel configuration cleaned up
✅ Root layout includes all required providers
✅ tRPC setup uses flexible type imports
✅ All queries use correct `trpc.procedure.queryOptions()` pattern
✅ All mutations use correct `trpc.procedure.mutationOptions()` pattern
✅ Safe area handling implemented
✅ Gesture handling configured

## Expected Startup Sequence

When you run `npx expo start --clear`, you should see:

```
Starting Metro Bundler
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

## Testing the App

### Test Credentials

- **Email**: `admin@tocld.com`
- **Password**: `Admin123`

### Test Flow

1. **Login Screen** → Enter credentials → Tap "Sign In"
2. **Teams Screen** → Select a team → Tap "Launch"
3. **Gatekeeper Screen** → View today's entries
4. **Create Job** → Tap "Create New Job" → Fill form → Submit
5. **Add Load** → Tap "Add Load" on existing entry → Confirm

## Common Issues & Solutions

### Issue: "nativewind/metro" not found

**This is expected and can be ignored!**

We're using NativeWind v2 WITHOUT the metro plugin. The babel plugin handles everything.

### Issue: Metro won't start

```bash
# Kill processes and clean
pkill -f "expo|metro"
rm -rf .expo node_modules/.cache
npx expo start --clear
```

### Issue: Can't connect on device

**Option 1: Use tunnel mode**
```bash
npx expo start --tunnel
```

**Option 2: Check network**
- Ensure phone and computer are on same WiFi
- Disable VPN if active
- Check firewall settings

### Issue: Dependencies missing

```bash
# From monorepo root
cd /Users/mini/Claude/github/midday
bun install
```

### Issue: TypeScript errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
bun install
```

## Environment Setup

Ensure `.env.local` exists with:

```env
EXPO_PUBLIC_API_URL=http://localhost:3334
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-key-here
```

**Note**: Replace `your-actual-key-here` with your Supabase anon key.

## Backend Requirements

The mobile app requires the API server to be running:

```bash
# In another terminal
cd /Users/mini/Claude/github/midday
bun run dev:api
```

The API should be running on: `http://localhost:3334`

## File Structure

```
apps/dirtworks-mobile/
├── app/                          # Expo Router
│   ├── _layout.tsx              # Root layout ✅ FIXED
│   ├── (auth)/
│   │   ├── login.tsx            # Login screen
│   │   └── teams.tsx            # Team selection ✅ FIXED
│   └── (main)/
│       └── index.tsx            # Gatekeeper screen
├── components/
│   └── JobDrawer.tsx            # Job creation drawer
├── lib/
│   ├── auth.ts                  # Authentication
│   └── trpc.ts                  # tRPC client ✅ FIXED
├── metro.config.js              # ✅ FIXED
├── babel.config.js              # ✅ FIXED
├── start-clean.sh               # ✅ NEW
└── FIXES_APPLIED.md             # ✅ NEW
```

## Performance Tips

1. **Use --clear flag** - Clears Metro cache for clean start
2. **Use --tunnel mode** - Better for real devices
3. **Restart Metro** - If changes aren't reflected
4. **Close Expo Go completely** - Between test runs

## Next Steps After Successful Start

Once the app is running:

1. ✅ Test login flow
2. ✅ Test team selection
3. ✅ Test job creation
4. ✅ Test load addition
5. ✅ Test search functionality
6. ✅ Test pull-to-refresh

## Support

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **tRPC Docs**: https://trpc.io/
- **Project Docs**: See `README.md` and `FIXES_APPLIED.md`

## Summary

All critical issues have been resolved. The app should start cleanly with:

```bash
cd /Users/mini/Claude/github/midday/apps/dirtworks-mobile
./start-clean.sh
```

or

```bash
npx expo start --clear
```

**You're ready to develop!** 🚀
