// Test job queries through tRPC API
import fetch from "node-fetch";

const API_URL = "http://localhost:3334";

async function testJobsAPI() {
  console.log("🔄 Testing Jobs API endpoints...\n");

  try {
    // Get auth token (using hardcoded test token - replace with actual auth)
    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzI1NTM5MjQ4LCJpYXQiOjE3MjU1MzU2NDgsImlzcyI6Imh0dHBzOi8vdWxuY2ZibHZ1aWpsZ25peWRqanUuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6InVzZXJfdjJ4RzQ0bm55Ulp5cUhQemlzdVFMUiIsImVtYWlsIjoiYWRtaW5AdG9jbGQuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQHRvY2xkLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJ1c2VyX3YyeEc0NG5ueVJaeXFIUHppc3VRTFJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzI1NTM1NjQ4fV0sInNlc3Npb25faWQiOiJiYTI0NTc1Ny0wZGUzLTRiODYtOGQ1OS1lYmI2YjMyOGU5NjcifQ.yA9jfczx-jw6CRNkqVq7jJP5_6X4MUK9xhq0HqrRBFA";

    // Test 1: List all jobs
    console.log("Test 1: Listing all jobs...");
    const listResponse = await fetch(`${API_URL}/trpc/job.list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (listResponse.ok) {
      const data = await listResponse.json();
      console.log(`✅ Jobs list endpoint working`);
      console.log(`   Found ${data.result?.data?.json?.length || 0} jobs`);

      if (data.result?.data?.json?.length > 0) {
        console.log("   Sample job:", {
          id: data.result.data.json[0].id,
          jobNumber: data.result.data.json[0].jobNumber,
          status: data.result.data.json[0].status,
        });
      }
    } else {
      console.log(
        `❌ Jobs list failed: ${listResponse.status} ${listResponse.statusText}`,
      );
      const errorText = await listResponse.text();
      console.log("   Error:", errorText);
    }
    console.log("");

    // Test 2: Get summary
    console.log("Test 2: Getting jobs summary...");
    const summaryResponse = await fetch(`${API_URL}/trpc/job.summary`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (summaryResponse.ok) {
      const data = await summaryResponse.json();
      console.log(`✅ Summary endpoint working`);
      const summary = data.result?.data?.json;
      if (summary) {
        console.log("   Summary data:");
        console.log(
          `   - Today: ${summary.today?.total || 0} jobs (${summary.today?.completed || 0} completed)`,
        );
        console.log(
          `   - This week: ${summary.week?.jobCount || 0} jobs, $${summary.week?.revenue || 0} revenue`,
        );
        console.log(
          `   - Pending: ${summary.pending?.count || 0} jobs, $${summary.pending?.potentialRevenue || 0} potential`,
        );
        console.log(
          `   - Monthly: ${summary.month?.volume || 0} m³, ${summary.month?.deliveries || 0} deliveries`,
        );
      }
    } else {
      console.log(
        `❌ Summary failed: ${summaryResponse.status} ${summaryResponse.statusText}`,
      );
      const errorText = await summaryResponse.text();
      console.log("   Error:", errorText);
    }
    console.log("");

    // Test 3: Create a test job
    console.log("Test 3: Creating a test job...");
    const createResponse = await fetch(`${API_URL}/trpc/job.create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          jobNumber: `TEST-${Date.now()}`,
          companyName: "Test Construction Co",
          contactPerson: "Test Contact",
          contactNumber: "0400 000 000",
          rego: "TEST-123",
          loadNumber: 1,
          addressSite: "123 Test Street, Test City",
          materialType: "Test Material",
          equipmentType: "Test Truck",
          pricePerUnit: 100,
          cubicMetreCapacity: 20,
          jobDate: new Date().toISOString().split("T")[0],
          status: "pending",
        },
      }),
    });

    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log(`✅ Job created successfully`);
      const job = data.result?.data?.json;
      if (job) {
        console.log("   Created job:", {
          id: job.id,
          jobNumber: job.jobNumber,
          status: job.status,
        });
      }
    } else {
      console.log(
        `❌ Job creation failed: ${createResponse.status} ${createResponse.statusText}`,
      );
      const errorText = await createResponse.text();
      console.log("   Error:", errorText);
    }

    console.log("\n✅ API test completed!");
  } catch (error) {
    console.error("❌ Error testing API:", error);
  }

  process.exit(0);
}

testJobsAPI();
