# Claude Development Notes

## tRPC Query API Usage

**IMPORTANT**: This project uses a specific tRPC query pattern that must be followed to avoid runtime errors.

### ✅ Correct tRPC Query Pattern
```typescript
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const trpc = useTRPC();

// Correct - Use useQuery with queryOptions
const { data, error, isLoading } = useQuery(
  trpc.job.unlinkedByCompany.queryOptions(
    { companyName: "Example", limit: 50 },
    {
      enabled: someCondition,
      retry: 3,
      staleTime: 5 * 60 * 1000,
    }
  )
);
```

### ❌ Incorrect tRPC Query Pattern (DO NOT USE)
```typescript
// This will cause: "contextMap[utilName] is not a function" error
const { data, error, isLoading } = trpc.job.unlinkedByCompany.useQuery(
  { companyName: "Example", limit: 50 },
  {
    enabled: someCondition,
    retry: 3,
  }
);
```

### Why This Matters
- The **old API** (`trpc.procedure.useQuery()`) causes `contextMap[utilName] is not a function` runtime errors
- The **new API** (`useQuery(trpc.procedure.queryOptions())`) works correctly with our tRPC setup
- This pattern must be consistent across all frontend queries

### Examples of Working Queries
- **Customer queries**: `useQuery(trpc.customers.get.queryOptions({...}))`
- **Job queries**: `useQuery(trpc.job.unlinkedByCompany.queryOptions({...}))`
- **Any tRPC query**: `useQuery(trpc.[router].[procedure].queryOptions({...}))`

### Required Imports
```typescript
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
```

## tRPC Mutation Usage

**IMPORTANT**: For mutations, avoid using the old `trpc.procedure.mutate()` API as it causes the same contextMap error.

### ✅ Correct tRPC Mutation Pattern
```typescript
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const trpc = useTRPC();

// Correct - Use useMutation with mutationOptions
const updateMutation = useMutation(
  trpc.job.update.mutationOptions({
    onSuccess: (data) => {
      // Handle success
      toast({ title: "Success", description: "Job updated successfully" });
    },
    onError: (error) => {
      // Handle error
      console.error('Update failed:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  })
);

// Call the mutation
const handleUpdate = async () => {
  await updateMutation.mutateAsync({
    id: "job-id",
    customerId: "customer-id",
    companyName: "Company Name",
  });
};
```

### ❌ Incorrect tRPC Mutation Pattern (DO NOT USE)
```typescript
// This will cause: "contextMap[utilName] is not a function" error
const result = await trpc.job.update.mutate({
  id: jobId,
  customerId,
});
```

---

## Team Permission Middleware

The team permission middleware allows `teamId` to be `null` for certain endpoints. Individual endpoints should handle the null case gracefully:

```typescript
.query(async ({ ctx: { db, teamId }, input }) => {
  if (!teamId) return []; // Handle gracefully
  // ... rest of query
});
```

## Query Invalidation Best Practices

**IMPORTANT**: After any mutation that modifies data, always invalidate relevant queries to ensure UI updates properly.

### ✅ Required Query Invalidation Pattern
```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const mutation = useMutation(
  trpc.job.update.mutationOptions({
    onSuccess: (data) => {
      // ALWAYS invalidate queries after successful mutations
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' && 
                 queryKey[1] && 
                 queryKey[1].toString().startsWith('job.');
        },
      });
      
      // Optional: Also invalidate related entities
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' && 
                 queryKey[1] && 
                 queryKey[1].toString().startsWith('customer.');
        },
      });

      toast({ title: "Success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  })
);
```

### Why This Matters
- **Warning icons disappear** after linking jobs to customers
- **Tables refresh automatically** after create/update/delete operations  
- **UI stays synchronized** with backend data
- **No manual refresh required** by users

## Authentication Testing

To test endpoints with real authentication:
- **Email**: `admin@tocld.com`
- **Password**: `Admin123`
- **API Server**: `http://localhost:3334`
- **Dashboard**: `http://localhost:3333`

Get access token for API testing:
```bash
curl -X POST 'https://ulncfblvuijlgniydjju.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tocld.com", "password": "Admin123"}'
```