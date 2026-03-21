# Mobile Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Build a React Native CLI mobile app for PriceHawk with feature parity to the web app, sharing ~70% business logic.

**Architecture:** React Native CLI with TypeScript, React Navigation for routing, Zustand + React Query for state, native modules for share extension and push notifications.

**Tech Stack:** React Native CLI, TypeScript, React Navigation, Zustand, TanStack Query, Victory Native, AsyncStorage

---

## File Structure

```
mobile/
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
├── app.json
├── index.js
└── src/
    ├── App.tsx
    ├── navigation/
    │   ├── AppNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   └── MainNavigator.tsx
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   ├── dashboard/
    │   │   └── DashboardScreen.tsx
    │   ├── item/
    │   │   ├── ItemDetailScreen.tsx
    │   │   └── AddItemScreen.tsx
    │   └── settings/
    │       └── SettingsScreen.tsx
    ├── components/
    │   ├── ItemCard.tsx
    │   ├── EmptyState.tsx
    │   └── OfflineBanner.tsx
    ├── lib/
    │   ├── api.ts
    │   ├── async-storage.ts
    │   └── query-client.ts
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useItems.ts
    │   └── useNotifications.ts
    ├── stores/
    │   ├── auth-store.ts
    │   └── ui-store.ts
    ├── types/
    │   └── index.ts
    ├── theme/
    │   ├── colors.ts
    │   ├── spacing.ts
    │   └── typography.ts
    └── utils/
        └── formatting.ts
```

---

## Implementation Status

### ✅ Completed

1. **Project Setup** - package.json, tsconfig.json, metro.config.js, babel.config.js
2. **Theme System** - colors, spacing, typography matching web app
3. **Types** - Copied from web (100% reusable)
4. **Storage Layer** - AsyncStorage wrapper with token management
5. **API Client** - Fetch-based API client with auth interceptors
6. **React Query Setup** - Query client configuration
7. **Zustand Stores** - Auth store and UI store with AsyncStorage persistence
8. **Hooks** - useAuth, useItems, useNotifications
9. **Navigation** - AuthNavigator, MainNavigator, AppNavigator
10. **Components** - ItemCard, EmptyState, OfflineBanner
11. **Screens** - Login, Register, Dashboard, AddItem, ItemDetail, Settings
12. **Utilities** - Formatting functions
13. **App Entry** - App.tsx with providers

---

## Next Steps (Not Implemented)

### iOS Configuration
- Create Xcode project in `mobile/ios/`
- Configure Info.plist for permissions
- Set up CocoaPods

### Android Configuration
- Create Android project in `mobile/android/`
- Configure Gradle build
- Set up permissions in AndroidManifest.xml

### Native Modules
- Share Extension implementation
- Push Notifications (FCM/APNs)
- Camera/gallery for product images

### Testing
- Jest configuration
- React Native Testing Library tests
- Detox E2E tests

---

## Summary

The mobile app is structured to share maximum code with the web app:

**Shared (~70%):**
- Type definitions
- API client patterns
- Zustand stores
- React Query hooks
- Business logic utilities

**Mobile-specific (~30%):**
- React Navigation (stack + tabs)
- StyleSheet-based theming
- Native screens
- Platform-specific components
