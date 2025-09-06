// Seed example invoices using Supabase API
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { addDays, subDays, subMonths, format } from "date-fns";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedInvoices() {
  console.log("🌱 Seeding Example Invoices via Supabase...\n");

  try {
    // 1. Sign in first
    console.log("🔑 Authenticating...");
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });

    if (authError) {
      console.error("Auth failed:", authError.message);
      return;
    }

    console.log("✅ Authenticated successfully\n");

    // 2. Get existing customers
    console.log("📊 Fetching existing customers...");
    const teamId = "6a980403-42c5-40c5-ac24-a08752a3172f"; // Test Team ID from earlier data

    const { data: existingCustomers, error: customersError } = await supabase
      .from("customers")
      .select("*")
      .eq("team_id", teamId)
      .limit(10);

    if (customersError) {
      console.log(
        "Warning: Could not fetch customers:",
        customersError.message,
      );
    }

    console.log(`Found ${existingCustomers?.length || 0} existing customers`);

    // 3. Create customers if none exist
    let customerList = existingCustomers || [];
    if (!customerList || customerList.length === 0) {
      console.log("Creating sample customers...");
      const sampleCustomers = [
        {
          name: "ABC Construction",
          email: "accounts@abcconstruction.com",
          website: "abcconstruction.com",
        },
        {
          name: "XYZ Builders",
          email: "billing@xyzbuilders.com",
          website: "xyzbuilders.com",
        },
        {
          name: "Quick Build Co",
          email: "finance@quickbuild.com",
          website: "quickbuild.com",
        },
        {
          name: "Metro Developments",
          email: "accounts@metrodev.com",
          website: "metrodev.com",
        },
        {
          name: "Premier Construction",
          email: "invoices@premier.com",
          website: "premier.com",
        },
      ];

      for (const customer of sampleCustomers) {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            id: uuidv4(),
            name: customer.name,
            email: customer.email,
            website: customer.website,
            team_id: teamId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error(
            `❌ Failed to create customer ${customer.name}:`,
            error.message,
          );
        } else if (data) {
          customerList.push(data);
          console.log(`✅ Created customer: ${customer.name}`);
        }
      }
    }

    // Make sure we have customers
    if (customerList.length === 0) {
      console.error("❌ No customers available. Cannot create invoices.");
      process.exit(1);
    }

    // 4. Create diverse invoice examples
    console.log("\n💰 Creating example invoices...");

    const now = new Date();
    const invoiceExamples = [
      // Paid invoices (various dates)
      {
        invoice_number: "INV-2024-001",
        status: "paid",
        amount: 285000, // $2,850.00
        issue_date: format(subMonths(now, 3), "yyyy-MM-dd"),
        due_date: format(subMonths(now, 2), "yyyy-MM-dd"),
        customer_name: customerList[0]?.name || "ABC Construction",
        customer_id: customerList[0]?.id || null,
        line_items: [
          {
            description: "Dirt removal services - 30 loads",
            quantity: 30,
            price: 9500,
            total: 285000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-002",
        status: "paid",
        amount: 425000, // $4,250.00
        issue_date: format(subMonths(now, 2), "yyyy-MM-dd"),
        due_date: format(subMonths(now, 1), "yyyy-MM-dd"),
        customer_name: customerList[1]?.name || "XYZ Builders",
        customer_id: customerList[1]?.id || null,
        line_items: [
          {
            description: "Site preparation and excavation",
            quantity: 1,
            price: 425000,
            total: 425000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-003",
        status: "paid",
        amount: 178500, // $1,785.00
        issue_date: format(subMonths(now, 1), "yyyy-MM-dd"),
        due_date: format(subDays(now, 15), "yyyy-MM-dd"),
        customer_name: customerList[2]?.name || "Quick Build Co",
        customer_id: customerList[2]?.id || null,
        line_items: [
          {
            description: "Fill delivery - 15 loads",
            quantity: 15,
            price: 11900,
            total: 178500,
          },
        ],
      },

      // Unpaid invoices (current)
      {
        invoice_number: "INV-2024-004",
        status: "unpaid",
        amount: 345000, // $3,450.00
        issue_date: format(subDays(now, 20), "yyyy-MM-dd"),
        due_date: format(addDays(now, 10), "yyyy-MM-dd"),
        customer_name: customerList[3]?.name || "Metro Developments",
        customer_id: customerList[3]?.id || null,
        line_items: [
          {
            description: "Excavation and hauling services",
            quantity: 1,
            price: 345000,
            total: 345000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-005",
        status: "unpaid",
        amount: 289000, // $2,890.00
        issue_date: format(subDays(now, 10), "yyyy-MM-dd"),
        due_date: format(addDays(now, 20), "yyyy-MM-dd"),
        customer_name: customerList[1]?.name || "XYZ Builders",
        customer_id: customerList[1]?.id || null,
        line_items: [
          {
            description: "Rock and sand delivery",
            quantity: 20,
            price: 14450,
            total: 289000,
          },
        ],
      },

      // Overdue invoices
      {
        invoice_number: "INV-2024-006",
        status: "overdue",
        amount: 425000, // $4,250.00
        issue_date: format(subDays(now, 60), "yyyy-MM-dd"),
        due_date: format(subDays(now, 30), "yyyy-MM-dd"),
        customer_name: customerList[2]?.name || "Quick Build Co",
        customer_id: customerList[2]?.id || null,
        line_items: [
          {
            description: "Outstanding balance - multiple jobs",
            quantity: 1,
            price: 425000,
            total: 425000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-007",
        status: "overdue",
        amount: 198000, // $1,980.00
        issue_date: format(subDays(now, 45), "yyyy-MM-dd"),
        due_date: format(subDays(now, 15), "yyyy-MM-dd"),
        customer_name: customerList[3]?.name || "Metro Developments",
        customer_id: customerList[3]?.id || null,
        line_items: [
          {
            description: "Overdue payment - excavation work",
            quantity: 1,
            price: 198000,
            total: 198000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-008",
        status: "overdue",
        amount: 675000, // $6,750.00
        issue_date: format(subDays(now, 90), "yyyy-MM-dd"),
        due_date: format(subDays(now, 60), "yyyy-MM-dd"),
        customer_name: customerList[0]?.name || "ABC Construction",
        customer_id: customerList[0]?.id || null,
        line_items: [
          {
            description: "Long overdue - major project",
            quantity: 1,
            price: 675000,
            total: 675000,
          },
        ],
      },

      // Draft invoices
      {
        invoice_number: "INV-2024-009",
        status: "draft",
        amount: 325000, // $3,250.00
        issue_date: format(now, "yyyy-MM-dd"),
        due_date: format(addDays(now, 30), "yyyy-MM-dd"),
        customer_name: customerList[1]?.name || "XYZ Builders",
        customer_id: customerList[1]?.id || null,
        line_items: [
          {
            description: "Pending invoice - recent work",
            quantity: 1,
            price: 325000,
            total: 325000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-010",
        status: "draft",
        amount: 445000, // $4,450.00
        issue_date: format(now, "yyyy-MM-dd"),
        due_date: format(addDays(now, 30), "yyyy-MM-dd"),
        customer_name: customerList[4]?.name || "Premier Construction",
        customer_id: customerList[4]?.id || null,
        line_items: [
          {
            description: "Draft - awaiting approval",
            quantity: 1,
            price: 445000,
            total: 445000,
          },
        ],
      },

      // Partially paid
      {
        invoice_number: "INV-2024-011",
        status: "partially_paid",
        amount: 850000, // $8,500.00
        issue_date: format(subDays(now, 25), "yyyy-MM-dd"),
        due_date: format(addDays(now, 5), "yyyy-MM-dd"),
        customer_name: customerList[0]?.name || "ABC Construction",
        customer_id: customerList[0]?.id || null,
        line_items: [
          {
            description: "Large project - 50% paid",
            quantity: 1,
            price: 850000,
            total: 850000,
          },
        ],
      },

      // More varied paid invoices for better charts
      {
        invoice_number: "INV-2024-012",
        status: "paid",
        amount: 387000, // $3,870.00
        issue_date: format(subDays(now, 7), "yyyy-MM-dd"),
        due_date: format(addDays(now, 23), "yyyy-MM-dd"),
        customer_name: customerList[1]?.name || "XYZ Builders",
        customer_id: customerList[1]?.id || null,
        line_items: [
          {
            description: "Quick payment - regular client",
            quantity: 1,
            price: 387000,
            total: 387000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-013",
        status: "paid",
        amount: 298000, // $2,980.00
        issue_date: format(subDays(now, 14), "yyyy-MM-dd"),
        due_date: format(addDays(now, 16), "yyyy-MM-dd"),
        customer_name: customerList[4]?.name || "Premier Construction",
        customer_id: customerList[4]?.id || null,
        line_items: [
          {
            description: "Standard job - paid early",
            quantity: 1,
            price: 298000,
            total: 298000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-014",
        status: "unpaid",
        amount: 512000, // $5,120.00
        issue_date: format(subDays(now, 5), "yyyy-MM-dd"),
        due_date: format(addDays(now, 25), "yyyy-MM-dd"),
        customer_name: customerList[4]?.name || "Premier Construction",
        customer_id: customerList[4]?.id || null,
        line_items: [
          {
            description: "Site clearing and preparation",
            quantity: 1,
            price: 512000,
            total: 512000,
          },
        ],
      },
      {
        invoice_number: "INV-2024-015",
        status: "canceled",
        amount: 225000, // $2,250.00
        issue_date: format(subDays(now, 30), "yyyy-MM-dd"),
        due_date: format(now, "yyyy-MM-dd"),
        customer_name: customerList[3]?.name || "Metro Developments",
        customer_id: customerList[3]?.id || null,
        line_items: [
          {
            description: "Canceled - project terminated",
            quantity: 1,
            price: 225000,
            total: 225000,
          },
        ],
      },
    ];

    // 5. Insert invoices into database
    const createdInvoices = [];
    for (const invoice of invoiceExamples) {
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          id: uuidv4(),
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          amount: invoice.amount,
          currency: "USD",
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          customer_id: invoice.customer_id,
          customer_name: invoice.customer_name,
          team_id: teamId,
          line_items: invoice.line_items,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(
          `❌ Failed to create invoice ${invoice.invoice_number}:`,
          error.message,
        );
      } else if (data) {
        createdInvoices.push(data);
        console.log(
          `✅ Created ${invoice.status} invoice: ${invoice.invoice_number} - $${(invoice.amount / 100).toFixed(2)}`,
        );
      }
    }

    console.log(`\n✅ Successfully created ${createdInvoices.length} invoices`);

    // 6. Display summary
    console.log("\n📊 Invoice Summary:");
    console.log("─".repeat(50));

    const statusCounts = createdInvoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    Object.entries(statusCounts).forEach(([status, count]) => {
      const totalAmount = createdInvoices
        .filter((inv) => inv.status === status)
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      console.log(
        `${status.toUpperCase()}: ${count} invoices - $${(totalAmount / 100).toFixed(2)}`,
      );
    });

    const totalAmount = createdInvoices.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0,
    );
    console.log(
      `\nTOTAL: ${createdInvoices.length} invoices - $${(totalAmount / 100).toFixed(2)}`,
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 INVOICE SEEDING COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📈 You can now view these invoices at:");
    console.log("   • Invoices page: http://localhost:3333/invoices");
    console.log("   • Reports page: http://localhost:3333/reports");
    console.log("\nThe reports will now show:");
    console.log("   • Invoice status distribution pie charts");
    console.log("   • Aging analysis with overdue amounts");
    console.log(
      "   • Collection rate: " +
        (
          (createdInvoices.filter((i) => i.status === "paid").length /
            createdInvoices.length) *
          100
        ).toFixed(1) +
        "%",
    );
    console.log("   • Outstanding balance tracking");
    console.log("   • Monthly trends and customer rankings");

    await supabase.auth.signOut();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }

  process.exit(0);
}

seedInvoices();
