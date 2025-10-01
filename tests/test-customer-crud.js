#!/usr/bin/env node

// Test Customer CRUD operations with all new fields

const API_URL = "http://localhost:3334";

// Test data with all new fields
const testCustomerData = {
  name: "Test Customer with New Fields",
  email: "test@example.com",
  billingEmail: "billing@example.com",
  phone: "+61 123 456 789",
  website: "https://testcustomer.com.au",
  contact: "John Smith",
  addressLine1: "123 Test Street",
  addressLine2: "Suite 456",
  city: "Sydney",
  state: "NSW",
  country: "Australia",
  countryCode: "AU",
  zip: "2000",
  vatNumber: "VAT123456",
  abn: "12345678901",
  currency: "AUD",
  note: "Test customer with all new fields",
  tags: ["test", "new-schema"],
};

async function testCustomerCRUD() {
  console.log("🧪 Testing Customer CRUD Operations with New Schema\n");

  try {
    // 1. CREATE - Test creating a customer with all new fields
    console.log("1️⃣ CREATE: Creating customer with all new fields...");
    const createResponse = await fetch(`${API_URL}/api/trpc/customers.upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: testCustomerData,
      }),
    });

    const createResult = await createResponse.json();
    console.log("✅ Customer created:", {
      id: createResult.result?.data?.json?.id,
      name: createResult.result?.data?.json?.name,
      token: createResult.result?.data?.json?.token,
      hasNewFields: {
        billingEmail: !!createResult.result?.data?.json?.billingEmail,
        abn: !!createResult.result?.data?.json?.abn,
        countryCode: !!createResult.result?.data?.json?.countryCode,
        contact: !!createResult.result?.data?.json?.contact,
        addressLine1: !!createResult.result?.data?.json?.addressLine1,
        addressLine2: !!createResult.result?.data?.json?.addressLine2,
      },
    });

    const customerId = createResult.result?.data?.json?.id;

    if (!customerId) {
      throw new Error("Failed to create customer");
    }

    // 2. READ - Get the customer and verify all fields
    console.log("\n2️⃣ READ: Fetching customer by ID...");
    const getResponse = await fetch(
      `${API_URL}/api/trpc/customers.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: customerId } }))}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const getResult = await getResponse.json();
    console.log("✅ Customer retrieved:", {
      id: getResult.result?.data?.json?.id,
      name: getResult.result?.data?.json?.name,
      billingEmail: getResult.result?.data?.json?.billingEmail,
      abn: getResult.result?.data?.json?.abn,
      contact: getResult.result?.data?.json?.contact,
      addressLine1: getResult.result?.data?.json?.addressLine1,
      addressLine2: getResult.result?.data?.json?.addressLine2,
      countryCode: getResult.result?.data?.json?.countryCode,
      token: getResult.result?.data?.json?.token,
    });

    // 3. UPDATE - Update some of the new fields
    console.log("\n3️⃣ UPDATE: Updating customer with new values...");
    const updateData = {
      id: customerId,
      name: "Updated Customer Name",
      billingEmail: "updated-billing@example.com",
      abn: "98765432109",
      contact: "Jane Doe",
      addressLine1: "456 Updated Street",
      note: "Customer information updated",
    };

    const updateResponse = await fetch(`${API_URL}/api/trpc/customers.upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: updateData,
      }),
    });

    const updateResult = await updateResponse.json();
    console.log("✅ Customer updated:", {
      id: updateResult.result?.data?.json?.id,
      name: updateResult.result?.data?.json?.name,
      billingEmail: updateResult.result?.data?.json?.billingEmail,
      abn: updateResult.result?.data?.json?.abn,
      contact: updateResult.result?.data?.json?.contact,
      addressLine1: updateResult.result?.data?.json?.addressLine1,
    });

    // 4. LIST - Get all customers to verify our updates
    console.log("\n4️⃣ LIST: Fetching all customers...");
    const listResponse = await fetch(
      `${API_URL}/api/trpc/customers.get?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const listResult = await listResponse.json();
    console.log("✅ Customers list:", {
      total: listResult.result?.data?.json?.data?.length,
      hasOurCustomer: listResult.result?.data?.json?.data?.some(
        (c) => c.id === customerId,
      ),
      firstCustomer: listResult.result?.data?.json?.data?.[0]
        ? {
            name: listResult.result?.data?.json?.data[0].name,
            hasToken: !!listResult.result?.data?.json?.data[0].token,
            hasBillingEmail:
              !!listResult.result?.data?.json?.data[0].billingEmail,
            hasAbn: !!listResult.result?.data?.json?.data[0].abn,
          }
        : null,
    });

    // 5. DELETE - Clean up test data
    console.log("\n5️⃣ DELETE: Removing test customer...");
    const deleteResponse = await fetch(`${API_URL}/api/trpc/customers.delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: { id: customerId },
      }),
    });

    const deleteResult = await deleteResponse.json();
    console.log("✅ Customer deleted:", {
      success: !!deleteResult.result?.data?.json,
      deletedId: deleteResult.result?.data?.json?.id,
    });

    console.log(
      "\n✨ All CRUD operations completed successfully with new schema fields!",
    );
  } catch (error) {
    console.error("\n❌ Error during test:", error.message);
    if (error.response) {
      const errorBody = await error.response.text();
      console.error("Response:", errorBody);
    }
  }
}

// Run the test
testCustomerCRUD();
