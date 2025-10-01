# Job Linking Test Instructions

## Issues Fixed:
1. ✅ **tRPC Schema**: Added missing `customerId` field to job.update input schema
2. ✅ **Cache Invalidation**: Added proper query invalidation to refresh UI after job updates
3. ✅ **Error Handling**: Enhanced error logging and user feedback

## Test the Job Linking Feature:

### Step 1: Access the Jobs Page
- Open browser to http://localhost:3333/jobs
- You should see jobs table with company names
- Look for jobs with ⚠️ warning icons (unlinked companies)

### Step 2: Test Company Linking
1. Click the ⚠️ warning icon next to a company name (e.g., "Acme Corporation")
2. A dropdown should appear with options:
   - **Potential Matches**: If existing customers match the company name
   - **Create new customer**: Option to create company as new customer

### Step 3: Test Existing Customer Link
- If potential matches are shown, click on one
- Should see toast: "Job updated - Company has been linked to existing customer"
- The warning icon should disappear
- The job should now be linked to that customer

### Step 4: Test New Customer Creation
- Click "Create [Company Name] as new customer"
- Customer creation form should open
- Fill out the form and click "Create Customer"
- Should trigger bulk linking dialog for other jobs with same company name
- Complete the bulk linking process

### Step 5: Verify Updates
- Check that warning icons disappear after linking
- Verify jobs table refreshes automatically
- Check customer page to see linked jobs appear there

## Expected Behavior:
- ✅ Toast notifications should show success/error messages
- ✅ UI should refresh automatically after linking (no page reload needed)
- ✅ Warning icons should disappear when jobs are linked
- ✅ Bulk linking should work for newly created customers

## Troubleshooting:
- If still getting errors, check browser console for tRPC errors
- If UI doesn't refresh, cache invalidation may need debugging
- If bulk linking doesn't appear, check console for dialog errors

Both servers should be running:
- **Dashboard**: http://localhost:3333 ✅
- **API**: http://localhost:3334 ✅