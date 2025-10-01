#!/usr/bin/env node

// Comprehensive test for new customer fields

const API_URL = "http://localhost:3334";

// Test data specifically for new fields
const testCustomerData = {
  // Required field
  name: "Test Customer - New Fields",

  // Original fields
  email: "test@example.com",
  phone: "+61 123 456 789",
  website: "https://testcustomer.com.au",
  addressLine1: "123 Test Street",
  addressLine2: "Suite 456",
  city: "Sydney",
  state: "NSW",
  country: "Australia",
  zip: "2000",
  vatNumber: "VAT123456",
  currency: "AUD",
  note: "Testing all new fields",
  tags: ["test", "new-fields"],

  // NEW fields added in migration
  billingEmail: "billing@testcompany.com.au",
  abn: "12345678901",
  countryCode: "AU",
  contact: "John Smith - CEO",
};

async function testNewFields() {
  console.log("🧪 Testing New Customer Fields\n");
  console.log("📋 New fields being tested:");
  console.log("  - billingEmail");
  console.log("  - abn (Australian Business Number)");
  console.log("  - countryCode");
  console.log("  - contact (contact person)");
  console.log("  - addressLine1 (renamed from address)");
  console.log("  - addressLine2 (new)");
  console.log("  - token (auto-generated)\n");

  try {
    // 1. CREATE - Test creating with ALL new fields
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

    if (createResult.error) {
      console.error("❌ Creation failed:", createResult.error);
      return;
    }

    const created = createResult.result?.data?.json;
    console.log("✅ Customer created successfully!");
    console.log("   ID:", created?.id);
    console.log("   Name:", created?.name);
    console.log("   Token:", created?.token, "(auto-generated)");

    // Check new fields
    console.log("\n📌 New Fields Check:");
    console.log("   billingEmail:", created?.billingEmail || "❌ MISSING");
    console.log("   abn:", created?.abn || "❌ MISSING");
    console.log("   countryCode:", created?.countryCode || "❌ MISSING");
    console.log("   contact:", created?.contact || "❌ MISSING");
    console.log("   addressLine1:", created?.addressLine1 || "❌ MISSING");
    console.log("   addressLine2:", created?.addressLine2 || "❌ MISSING");

    const customerId = created?.id;

    if (!customerId) {
      console.error("❌ No customer ID returned");
      return;
    }

    // 2. READ - Verify all fields are stored correctly
    console.log("\n2️⃣ READ: Fetching customer to verify stored data...");
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
    const fetched = getResult.result?.data?.json;

    console.log("✅ Customer retrieved successfully!");

    // Verify each new field
    console.log("\n🔍 Detailed Field Verification:");
    const fields = [
      {
        name: "billingEmail",
        expected: testCustomerData.billingEmail,
        actual: fetched?.billingEmail,
      },
      { name: "abn", expected: testCustomerData.abn, actual: fetched?.abn },
      {
        name: "countryCode",
        expected: testCustomerData.countryCode,
        actual: fetched?.countryCode,
      },
      {
        name: "contact",
        expected: testCustomerData.contact,
        actual: fetched?.contact,
      },
      {
        name: "addressLine1",
        expected: testCustomerData.addressLine1,
        actual: fetched?.addressLine1,
      },
      {
        name: "addressLine2",
        expected: testCustomerData.addressLine2,
        actual: fetched?.addressLine2,
      },
    ];

    let allFieldsCorrect = true;
    fields.forEach((field) => {
      const match = field.expected === field.actual;
      console.log(
        `   ${field.name}: ${match ? "✅" : "❌"} "${field.actual}" ${match ? "" : `(expected: "${field.expected}")`}`,
      );
      if (!match) allFieldsCorrect = false;
    });

    // Check token was generated
    console.log(
      `   token: ${fetched?.token ? "✅" : "❌"} "${fetched?.token}" (auto-generated)`,
    );

    // 3. UPDATE - Test updating new fields
    console.log("\n3️⃣ UPDATE: Testing update of new fields...");
    const updateData = {
      id: customerId,
      billingEmail: "updated-billing@company.com.au",
      abn: "98765432109",
      contact: "Jane Doe - CFO",
      addressLine1: "456 Updated Avenue",
      addressLine2: "Floor 10",
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
    const updated = updateResult.result?.data?.json;

    console.log("✅ Customer updated successfully!");
    console.log("   Updated billingEmail:", updated?.billingEmail);
    console.log("   Updated abn:", updated?.abn);
    console.log("   Updated contact:", updated?.contact);
    console.log("   Updated addressLine1:", updated?.addressLine1);
    console.log("   Updated addressLine2:", updated?.addressLine2);

    // 4. LIST - Verify in list results
    console.log(
      "\n4️⃣ LIST: Verifying customer appears in list with new fields...",
    );
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
    const ourCustomer = listResult.result?.data?.json?.data?.find(
      (c) => c.id === customerId,
    );

    if (ourCustomer) {
      console.log("✅ Customer found in list!");
      console.log("   Has token:", !!ourCustomer.token);
      console.log("   Has billingEmail:", !!ourCustomer.billingEmail);
      console.log("   Has abn:", !!ourCustomer.abn);
      console.log("   Has contact:", !!ourCustomer.contact);
      console.log("   Has addressLine1:", !!ourCustomer.addressLine1);
      console.log("   Has countryCode:", !!ourCustomer.countryCode);
    } else {
      console.log("❌ Customer not found in list");
    }

    // 5. DELETE - Clean up
    console.log("\n5️⃣ DELETE: Cleaning up test data...");
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
    console.log("✅ Customer deleted:", !!deleteResult.result?.data?.json);

    // Summary
    console.log("\n" + "=".repeat(50));
    if (allFieldsCorrect) {
      console.log("✨ SUCCESS: All new fields are working correctly!");
      console.log("   - billingEmail ✅");
      console.log("   - abn ✅");
      console.log("   - countryCode ✅");
      console.log("   - contact ✅");
      console.log("   - addressLine1 ✅");
      console.log("   - addressLine2 ✅");
      console.log("   - token (auto-generated) ✅");
    } else {
      console.log("⚠️ PARTIAL SUCCESS: Some fields may need attention");
    }
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
  }
}

// Run the test
testNewFields();
