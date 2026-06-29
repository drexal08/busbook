# Trip Generation Issue Analysis

## Problem Summary
Scheduled trips created from templates (set to occur on specific days like Monday, Tuesday, Wednesday) are not showing in search results.

## Code Flow Analysis

### 1. **Template Creation** (✅ Works)
- User creates a `TripTemplate` with `daysOfWeek: [1, 2, 3]` (Mon, Tue, Wed)
- Stored in Firestore `/tripTemplates/{templateId}`
- File: `src/pages/CompanyDashboard.tsx` line 512

### 2. **Trip Generation** (⚠️ Potential Issues)
- Location: `src/lib/tripGeneration.ts` → `ensureUpcomingTripsFromTemplates()`
- Called when user clicks "Generate trips" button
- File: `src/pages/CompanyDashboard.tsx` line 429

**Key Logic:**
```typescript
function dayOfWeekMon1Sun7FromUtcMs(ms: number) {
  const dowSun0 = d.getUTCDay();  // 0=Sunday, 6=Saturday
  return ((dowSun0 + 6) % 7) + 1; // Converts to 1=Monday, 7=Sunday
}
```

**Timezone Handling:**
```typescript
function kigaliTodayUtcMidnightMs(nowMs: number) {
  const offsetMs = 2 * 60 * 60 * 1000;  // UTC+2
  const kigali = new Date(nowMs + offsetMs);
  const y = kigali.getUTCFullYear();
  const m = kigali.getUTCMonth();
  const d = kigali.getUTCDate();
  return Date.UTC(y, m, d);
}
```

### 3. **Trip Search Filtering** (✅ Looks OK)
- File: `src/contexts/DataContext.tsx` line 156
- Filters by: origin, destination, date, company status, availability
- **No date filtering issue detected**

## Identified Issues

### **Issue #1: Firestore Rules** ❌
The rules allow **unrestricted READ access** to trips:
```firestore
match /trips/{tripId} {
  allow read: if true;  // ⚠️ SECURITY ISSUE: Anyone can read
}
```
While this won't block display, **it's a security vulnerability**. Only fix permissions if this is intentional.

### **Issue #2: Missing Real-Time Subscription** ⚠️
- DataContext fetches trips **ONCE on initial load** (line 115-130)
- When trips are generated, only a manual refresh happens (line 279)
- **Generated trips might not display until page refresh**

### **Issue #3: Day of Week Conversion** ⚠️
The timezone offset calculation in `kigaliTodayUtcMidnightMs()` may have edge cases near midnight in Kigali timezone.

## Most Likely Root Cause

**The trips ARE being created in Firestore, but the frontend is not refreshing properly.**

### Debugging Steps:

1. **Check Firestore Console:**
   - Go to Firebase Console → Firestore → `trips` collection
   - Filter by your company ID
   - Do you see trips with `source: 'template'` and the correct dates?

2. **Check Template Setup:**
   - Open DevTools → Console
   - Create a template with `daysOfWeek: [1,2,3]` (Mon, Tue, Wed)
   - Click "Generate trips"
   - Check if the success message says trips were created

3. **Check Search Logic:**
   - Ensure you're searching for dates that match the generated trip dates
   - Verify company status is 'approved'

## Solution Options

### Quick Fix (Workaround)
**Page reload after generating trips** - This forces a fresh data fetch

### Proper Fix (Recommended)
**Add real-time subscription to trips** in DataContext:

Replace the one-time fetch in `useEffect` at line 115 with a real-time listener:
```typescript
useEffect(() => {
  const tripsListener = onSnapshot(
    collection(db, 'trips'), 
    (snapshot) => {
      const updated = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setTrips(updated);
    }
  );
  return () => tripsListener();
}, []);
```

This way, any new trips created in Firestore instantly appear in the UI.

### Security Fix (Critical)
**Update Firestore Rules** - Restrict read access to trips:
```firestore
match /trips/{tripId} {
  allow read: if isAdmin() || 
    (signedIn() && resource.data.companyId == currentUserData().companyId) ||
    (signedIn() && resource.data.passengerId == request.auth.uid);
}
```

## Files to Check/Modify
- `src/lib/tripGeneration.ts` - Timezone logic
- `src/contexts/DataContext.tsx` - Trip fetching & real-time updates
- `firestore.rules` - Security rules
