import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testJobsData() {
  // Authenticate
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: "admin@tocld.com",
    password: "Admin123",
  });

  if (error) {
    console.error("Auth failed:", error);
    return;
  }

  console.log("✅ Authenticated successfully\n");

  // 1. Check Jobs table structure and data
  console.log("1. Fetching Jobs data...");
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (jobsError) {
    console.log("Error fetching jobs:", jobsError);
  } else {
    console.log(`Found ${jobs?.length || 0} jobs\n`);
    
    if (jobs && jobs.length > 0) {
      console.log("Sample job structure:");
      console.log(JSON.stringify(jobs[0], null, 2));
      
      // Group jobs by customer
      console.log("\n2. Jobs grouped by customer:");
      const jobsByCustomer = {};
      
      jobs.forEach(job => {
        const customerId = job.customer_id || 'no-customer';
        const customerName = job.customer?.name || job.company_name || 'Unknown';
        
        if (!jobsByCustomer[customerId]) {
          jobsByCustomer[customerId] = {
            customerName,
            jobs: [],
            totalAmount: 0,
            jobCount: 0
          };
        }
        
        jobsByCustomer[customerId].jobs.push({
          id: job.id,
          jobNumber: job.job_number,
          status: job.status,
          amount: job.total_amount || 0
        });
        jobsByCustomer[customerId].totalAmount += job.total_amount || 0;
        jobsByCustomer[customerId].jobCount++;
      });
      
      Object.entries(jobsByCustomer).forEach(([customerId, data]) => {
        console.log(`\nCustomer: ${data.customerName} (ID: ${customerId})`);
        console.log(`  Total Jobs: ${data.jobCount}`);
        console.log(`  Total Amount: $${data.totalAmount}`);
        console.log(`  Jobs:`, data.jobs.map(j => `#${j.jobNumber} (${j.status})`).join(', '));
      });
    }
  }

  // 3. Check for jobs ready to be invoiced (completed but not invoiced)
  console.log("\n3. Jobs ready for invoicing (completed, not invoiced):");
  const { data: readyJobs, error: readyError } = await supabase
    .from('jobs')
    .select('id, job_number, customer_id, company_name, total_amount, status')
    .eq('status', 'completed')
    .is('invoice_id', null);

  if (readyError) {
    console.log("Error:", readyError);
  } else {
    console.log(`Found ${readyJobs?.length || 0} completed jobs without invoices`);
    
    if (readyJobs && readyJobs.length > 0) {
      // Group by customer for bulk invoicing
      const readyByCustomer = {};
      readyJobs.forEach(job => {
        const key = job.customer_id || job.company_name || 'unknown';
        if (!readyByCustomer[key]) {
          readyByCustomer[key] = [];
        }
        readyByCustomer[key].push(job);
      });
      
      console.log("\nGrouped for bulk invoicing:");
      Object.entries(readyByCustomer).forEach(([customer, jobs]) => {
        const total = jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0);
        console.log(`  ${customer}: ${jobs.length} jobs, Total: $${total}`);
        console.log(`    Job Numbers: ${jobs.map(j => j.job_number).join(', ')}`);
      });
    }
  }

  // 4. Check if there's a job_invoice junction table for many-to-many
  console.log("\n4. Checking for job_invoice junction table...");
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .ilike('table_name', '%job%invoice%');
    
  if (tables && tables.length > 0) {
    console.log("Found junction tables:", tables.map(t => t.table_name).join(', '));
  } else {
    console.log("No job_invoice junction table found - jobs likely have single invoice_id");
  }

  // 5. Check invoice structure for line items
  console.log("\n5. Checking invoice structure for line items...");
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('id, invoice_number, line_items')
    .limit(1);
    
  if (invError) {
    console.log("Error fetching invoices:", invError);
  } else if (invoices && invoices.length > 0) {
    console.log("Invoice has line_items field:", !!invoices[0].line_items);
    if (invoices[0].line_items) {
      console.log("Line items structure:", typeof invoices[0].line_items);
    }
  }

  // 6. Test API endpoint for job grouping
  console.log("\n6. Testing API endpoints for job operations...");
  const token = authData.session.access_token;
  
  const response = await fetch('http://localhost:3334/trpc/job.list?batch=1&input=' + 
    encodeURIComponent(JSON.stringify({"0":{"json":{}}})), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    const jobs = data[0]?.result?.data?.json || [];
    console.log(`API returned ${jobs.length} jobs`);
    
    // Check if API supports grouping by customer
    if (jobs.length > 0) {
      const hasCustomerInfo = jobs[0].customerId || jobs[0].customer_id;
      console.log("Jobs have customer info:", !!hasCustomerInfo);
    }
  }

  await supabase.auth.signOut();
  console.log("\n✅ Test complete!");
}

testJobsData().catch(console.error);