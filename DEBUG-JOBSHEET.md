# Debugging Job View Sheet

## Issue
The JobViewSheetEnhanced shows a skeleton loader and then an empty sheet with no data.

## Debug Steps Added

### 1. Console Logs Added

**In `/apps/dashboard/src/components/tables/jobs/row.tsx`:**
```tsx
console.log('Row clicked - Setting jobId:', row.original.id);
console.log('Row data:', row.original);
```

**In `/apps/dashboard/src/components/sheets/job-view-sheet-enhanced.tsx`:**
```tsx
console.log('JobViewSheet - jobData:', jobData);
console.log('JobViewSheet - isLoading:', isLoading);
console.log('JobViewSheet - isOpen:', isOpen);
```

**In `/packages/job-sheet-components/src/components/job-view-sheet.tsx`:**
```tsx
console.log('JobViewSheet render:', { isOpen, data, isLoading });
```

### 2. How to Debug

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Navigate to `/jobs`**
3. **Click on any job row**
4. **Check Console Output**

Expected output:
```
Row clicked - Setting jobId: [some-uuid]
Row data: { id: '...', companyName: '...', ... }
JobViewSheet - jobData: { ... }
JobViewSheet - isLoading: false
JobViewSheet - isOpen: true
JobViewSheet render: { isOpen: true, data: {...}, isLoading: false }
```

### 3. Possible Issues & Solutions

#### Issue A: `jobData` is `undefined`
**Cause:** Query not returning data
**Solution:** Check if `trpc.job.getById` exists and works

#### Issue B: `jobData` exists but fields are missing
**Cause:** Backend doesn't include customer/invoice relations
**Solution:** Update the `getById` query to include relations

#### Issue C: `isLoading` stays `true`
**Cause:** Query is hanging or failing
**Solution:** Check network tab for failed requests

#### Issue D: Data has different field names
**Cause:** Schema mismatch between expected and actual
**Solution:** The component already handles multiple field names:
- `customerName || customer?.name || companyName`
- `customerPhone || customer?.phone || contactNumber`

### 4. Quick Fix Options

If the query returns data but without relations, you can:

**Option 1: Use the row data directly (no extra query)**
```tsx
// In job-view-sheet-enhanced.tsx
const jobData = React.useMemo(() => {
  if (!params.jobId) return null;
  // Get from cache/table data instead of new query
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData(['trpc', 'job', 'list']);
  // Find the job in cached list data
  return findJobInCache(cachedData, params.jobId);
}, [params.jobId]);
```

**Option 2: Pass data from row click**
```tsx
// Modify to pass data through params
setParams({ jobId: row.original.id, jobData: row.original });

// Then in the sheet
const jobData = params.jobData;
```

**Option 3: Fix the getById query to use mock data**
```tsx
// In /apps/api/src/trpc/routers/job.ts
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx: { db, teamId }, input }) => {
    if (!teamId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // ADD MOCK MODE CHECK
    if (isMockMode()) {
      const mockJobs = generateMockJobs(teamId);
      const job = mockJobs.find(j => j.id === input.id);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      return job;
    }

    // ... existing code
  })
```

### 5. Temporary Workaround

While debugging, you can test the component with hardcoded data:

```tsx
// In job-view-sheet-enhanced.tsx
const testData = {
  id: '1',
  jobNumber: 'JOB-001',
  companyName: 'Test Company',
  rego: 'ABC123',
  materialType: 'Dry Clean Fill',
  pricePerUnit: 85,
  cubicMetreCapacity: 22,
  contactPerson: 'John Doe',
  contactNumber: '+1-555-1234',
};

<JobViewSheet
  data={jobData || testData}  // Fallback to test data
  // ...
/>
```

## Next Steps

1. Check console logs
2. Report what you see
3. I'll provide the exact fix based on the logs
