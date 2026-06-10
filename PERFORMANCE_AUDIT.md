# Performance Audit

## Executive Summary
A comprehensive performance audit of the Quicklime application has been conducted, covering its React Native frontend, Firebase Firestore access patterns, Cloud Functions, and application state management. The audit identified significant opportunities to reduce database reads, improve memory efficiency, and optimize UI rendering.

## Identified Bottlenecks & Analysis

### 1. N+1 / Redundant Database Query Listeners
- **Identified Bottleneck**: Multiple components instantiating their own `onSnapshot` listeners to the same Firestore collections (`routines`, `events`, `workspace`, `users/{uid}`).
- **Root Cause Analysis**: The application architecture binds Firestore listeners inside custom hooks (`useEvents`, `useRoutine`, `useWorkspace`, `useAuth`). When these hooks are used by multiple active screens in a Tab Navigator (e.g., `TodayScreen`, `RoutineScreen`, `EventsScreen`, `SettingsScreen`), the app instantiates duplicate concurrent listeners. This results in N-times the necessary Document Reads and excessive WebSocket overhead.
- **Estimated Impact**: High. Dramatically increases Firestore billable read operations and wastes device battery and network bandwidth.
- **Recommended Fixes**: Introduce centralized React Context Providers (e.g., `EventsProvider`, `RoutineProvider`) at the root of the app that hold exactly one `onSnapshot` listener per collection and propagate the data down via Context. The existing hooks should be refactored to simply consume these Contexts.
- **Risk Assessment**: Medium. This requires modifying core hooks and wrapping the app in Context Providers, but it does not change the shape of the data.
- **Expected Performance Gains**: 50-75% reduction in Firestore Read operations. Lower memory usage and network consumption on the client.

### 2. Excessive Memory Allocations and Re-Renders in `TodayScreen`
- **Identified Bottleneck**: The `TodayScreen` re-renders completely every 60 seconds.
- **Root Cause Analysis**: A `setInterval` inside `TodayScreen` updates a string `currentTimeStr` every minute. Because this state is at the root of the component, the entire `TodayScreen`, including all class and event cards, is re-rendered every minute, and arrays are re-filtered.
- **Estimated Impact**: Medium. Causes unnecessary battery drain and minor UI jank if complex lists are present.
- **Recommended Fixes**: Isolate the "current time" dependency. Either push the time-dependent logic down into smaller components (e.g., `ClassRow` tracking its own "isCurrent" state), or memoize the complex list calculations so the time update only re-renders what is strictly necessary.
- **Risk Assessment**: Low.
- **Expected Performance Gains**: Smoother UI, reduced battery drain while the Today tab is open.

### 3. Duplicate Computations in `EventsScreen`
- **Identified Bottleneck**: `groupEventsByDate(filteredEvents)` is executed inline on every render of `EventsScreen`.
- **Root Cause Analysis**: The grouping logic iterates over the entire events list and creates a new grouped object. This is done synchronously during render.
- **Estimated Impact**: Medium. As the number of events grows, this synchronous work will block the main JS thread and cause sluggish tab switching or scrolling.
- **Recommended Fixes**: Wrap `groupEventsByDate` and `filteredEvents` logic in a `useMemo` hook, keyed to the raw `events` list and `activeFilter`.
- **Risk Assessment**: Low. Standard React optimization.
- **Expected Performance Gains**: Faster tab switching and smoother scrolling in the Events tab.

### 4. Duplicate Computations in `CourseListScreen`
- **Identified Bottleneck**: `aggregateCourses(routines)` is executed inside a `useMemo`, but it still requires creating Map and Array allocations.
- **Root Cause Analysis**: The aggregation algorithm iterates over all days and all slots. It's relatively fast, but could be further optimized. Currently, the `useMemo` is acceptable, but if `routines` changes often, this could be expensive.
- **Estimated Impact**: Low to Medium.
- **Recommended Fixes**: Ensure the `routines` state isn't changing unnecessarily (which the Context Provider fix will help with). No direct change to the aggregation logic is strictly necessary unless profiles show it's a bottleneck, but we will ensure it uses `useMemo` efficiently.
- **Risk Assessment**: Low.
- **Expected Performance Gains**: Prevention of UI blocking.

### 5. Inline Functions and Object Creation
- **Identified Bottleneck**: Several components define arrays or callbacks inline within JSX, causing child components to re-render.
- **Root Cause Analysis**: E.g., `(['test', 'extra_class', 'assignment', 'notice'] as EventType[]).map(...)` in `events.tsx`. Every render creates a new array reference.
- **Estimated Impact**: Low. React is generally fast, but this defeats `React.memo` if used on child components.
- **Recommended Fixes**: Move static arrays and objects outside the component definition. Use `useCallback` for functions passed as props to expensive child components.
- **Risk Assessment**: Low.
- **Expected Performance Gains**: Reduced garbage collection pauses.

### 6. Missing Indexes / Inefficient Queries
- **Identified Bottleneck**: `firestore.indexes.json` includes a composite index for `events` by `type` and `date`. However, the app fetches `events` using: `query(eventsColRef, orderBy('date', 'asc'), orderBy('startTime', 'asc'))`.
- **Root Cause Analysis**: The current query fetches all events and then filters them client-side in `events.tsx` based on `activeFilter` (type). Over-fetching data.
- **Estimated Impact**: Medium. Fetches events that the user may not want to see. However, since the app needs to group by date regardless of type, and since it's a relatively small dataset per workspace, client-side filtering might actually be cheaper than setting up multiple listeners for different queries.
- **Recommended Fixes**: Keep client-side filtering but optimize the client-side grouping. If the dataset grows significantly, consider pagination or limiting the fetch to future events, rather than all historical events.
- **Risk Assessment**: Low.
- **Expected Performance Gains**: Mitigation of future memory bloat.

### 7. Cloud Functions Cold Starts
- **Identified Bottleneck**: HTTPS Callable functions (`joinWorkspace`, `createWorkspace`) and triggers may experience cold starts.
- **Root Cause Analysis**: Standard serverless architecture behavior.
- **Estimated Impact**: Low to Medium (user sees a spinner for a few seconds).
- **Recommended Fixes**: For a comprehensive audit, this is noted, but optimizing Node.js cold starts involves keeping functions warm or increasing memory allocation, which affects infrastructure cost. We will avoid premature optimization here, but ensure the frontend has optimistic UI or clear loading states.
- **Risk Assessment**: N/A
- **Expected Performance Gains**: Better perceived performance.
