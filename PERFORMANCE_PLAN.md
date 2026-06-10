# Performance Optimization Plan

Based on the performance audit, the following plan outlines the prioritized execution strategy to resolve bottlenecks.

## Phase 1: High Impact / Medium Risk (Architecture Refactor)

**Goal:** Eliminate redundant Firestore `onSnapshot` listeners to drastically reduce read operations and network usage.

1. **Create Global Context Providers**
   - Refactor `src/hooks/useAuth.ts` to expose its state via an `AuthProvider`.
   - Refactor `src/hooks/useWorkspace.ts` to expose its state via a `WorkspaceProvider`.
   - Refactor `src/hooks/useRoutine.ts` to expose its state via a `RoutineProvider`.
   - Refactor `src/hooks/useEvents.ts` to expose its state via an `EventsProvider`.
2. **Wrap Application Root**
   - Inject these providers in the root layout (`src/app/_layout.tsx`), ensuring they mount exactly once and preserve state globally.
3. **Update Consumer Components**
   - Ensure components (`TodayScreen`, `RoutineScreen`, `EventsScreen`, `SettingsScreen`, etc.) consume the context instead of instantiating new listeners.
4. **Metrics to Track:**
   - Database Document Reads.
   - Client Memory Usage.

## Phase 2: High Impact / Low Risk (React UI Optimization)

**Goal:** Reduce unnecessary re-renders, garbage collection overhead, and optimize main thread performance.

1. **Memoize Event Grouping**
   - In `src/app/(app)/events.tsx`, wrap the `filteredEvents` and `groupedEvents` generation in a `useMemo` block.
   - Extract static arrays (like the `EventType` array for the segmented control) outside the component body to avoid redeclaration on every render.
2. **Isolate `TodayScreen` Reactivity**
   - In `src/app/(app)/today.tsx`, move the `setInterval` (which updates the `currentTimeStr`) to a smaller, dedicated component or custom hook that only re-renders the specific "current" indicators on `ClassRow` components, rather than the entire list and header.
   - Memoize the derived arrays (`todaySlots`, `upcomingEvents`) using `useMemo`.
3. **Memoize Course List Aggregation**
   - In `src/app/(app)/course-list.tsx`, confirm that `aggregateCourses` is safely memoized. If the Context API causes the `routines` object to remain referentially stable (unless actually updated in Firestore), this is already mostly optimal.
4. **Metrics to Track:**
   - UI Frame Rate (FPS) during scrolling and tab switching.
   - Frequency of React re-renders.

## Phase 3: Everything Else (Future Considerations)

**Goal:** Continuous improvement.

1. **Firestore Pagination**
   - As the `events` collection grows, we may eventually fetch too many documents into client memory. Consider setting a time boundary (e.g., only fetching events from `now() - 30 days` to `now() + 90 days`).
2. **Cloud Functions Warmup**
   - Consider modifying cloud function concurrency or memory to handle cold start delays, but wait until usage scales.

## Execution Requirements
- Maintain all existing features, UI designs, and functionality.
- Write or adapt any relevant tests when changing hooks to Context.
- Follow the exact design specifications in `Quicklime_Frontend_PRD.md`.
