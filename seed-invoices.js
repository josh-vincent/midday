// Seed example invoices into the database
import { connectDb } from "@midday/db/client";
import { invoices, customers, teams } from "@midday/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { addDays, subDays, subMonths, format } from "date-fns";

async function seedInvoices() {
  console.log("🌱 Seeding Example Invoices...\n");

  try {
    const db = await connectDb();

    // 1. Get existing team and customers
    console.log("📊 Fetching existing data...");

    // Get the test team
    const teamId = "team_vHVRZjT2bVccNVRfqUcPXg"; // Your team ID

    // Get existing customers or create some
    const existingCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.teamId, teamId))
      .limit(10);

    console.log(`Found ${existingCustomers.length} existing customers`);

    // If no customers, create some
    let customerList = existingCustomers;
    if (existingCustomers.length === 0) {
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
        const [created] = await db
          .insert(customers)
          .values({
            id: uuidv4(),
            name: customer.name,
            email: customer.email,
            website: customer.website,
            teamId: teamId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        customerList.push(created);
      }
      console.log(`Created ${customerList.length} customers`);
    }

    // 2. Create diverse invoice examples
    console.log("\n💰 Creating example invoices...");

    const now = new Date();
    const invoiceExamples = [
      // Paid invoices (various dates)
      {
        invoiceNumber: "INV-2024-001",
        status: "paid",
        amount: 285000, // $2,850.00
        issueDate: subMonths(now, 3),
        dueDate: subMonths(now, 2),
        paidAt: subMonths(now, 2.5),
        customerName: customerList[0]?.name || "ABC Construction",
        customerId: customerList[0]?.id,
        description: "Dirt removal services - 30 loads",
      },
      {
        invoiceNumber: "INV-2024-002",
        status: "paid",
        amount: 425000, // $4,250.00
        issueDate: subMonths(now, 2),
        dueDate: subMonths(now, 1),
        paidAt: subMonths(now, 1.2),
        customerName: customerList[1]?.name || "XYZ Builders",
        customerId: customerList[1]?.id,
        description: "Site preparation and excavation",
      },
      {
        invoiceNumber: "INV-2024-003",
        status: "paid",
        amount: 178500, // $1,785.00
        issueDate: subMonths(now, 1),
        dueDate: subDays(now, 15),
        paidAt: subDays(now, 10),
        customerName: customerList[2]?.name || "Quick Build Co",
        customerId: customerList[2]?.id,
        description: "Fill delivery - 15 loads",
      },
      {
        invoiceNumber: "INV-2024-004",
        status: "paid",
        amount: 632000, // $6,320.00
        issueDate: subDays(now, 45),
        dueDate: subDays(now, 15),
        paidAt: subDays(now, 5),
        customerName: customerList[0]?.name || "ABC Construction",
        customerId: customerList[0]?.id,
        description: "Monthly trucking services",
      },

      // Unpaid invoices (current)
      {
        invoiceNumber: "INV-2024-005",
        status: "unpaid",
        amount: 345000, // $3,450.00
        issueDate: subDays(now, 20),
        dueDate: addDays(now, 10),
        customerName: customerList[3]?.name || "Metro Developments",
        customerId: customerList[3]?.id,
        description: "Excavation and hauling services",
      },
      {
        invoiceNumber: "INV-2024-006",
        status: "unpaid",
        amount: 289000, // $2,890.00
        issueDate: subDays(now, 10),
        dueDate: addDays(now, 20),
        customerName: customerList[1]?.name || "XYZ Builders",
        customerId: customerList[1]?.id,
        description: "Rock and sand delivery",
      },
      {
        invoiceNumber: "INV-2024-007",
        status: "unpaid",
        amount: 512000, // $5,120.00
        issueDate: subDays(now, 5),
        dueDate: addDays(now, 25),
        customerName: customerList[4]?.name || "Premier Construction",
        customerId: customerList[4]?.id,
        description: "Site clearing and preparation",
      },

      // Overdue invoices
      {
        invoiceNumber: "INV-2024-008",
        status: "overdue",
        amount: 425000, // $4,250.00
        issueDate: subDays(now, 60),
        dueDate: subDays(now, 30),
        customerName: customerList[2]?.name || "Quick Build Co",
        customerId: customerList[2]?.id,
        description: "Outstanding balance - multiple jobs",
      },
      {
        invoiceNumber: "INV-2024-009",
        status: "overdue",
        amount: 198000, // $1,980.00
        issueDate: subDays(now, 45),
        dueDate: subDays(now, 15),
        customerName: customerList[3]?.name || "Metro Developments",
        customerId: customerList[3]?.id,
        description: "Overdue payment - excavation work",
      },
      {
        invoiceNumber: "INV-2024-010",
        status: "overdue",
        amount: 675000, // $6,750.00
        issueDate: subDays(now, 90),
        dueDate: subDays(now, 60),
        customerName: customerList[0]?.name || "ABC Construction",
        customerId: customerList[0]?.id,
        description: "Long overdue - major project",
      },

      // Draft invoices
      {
        invoiceNumber: "INV-2024-011",
        status: "draft",
        amount: 325000, // $3,250.00
        issueDate: now,
        dueDate: addDays(now, 30),
        customerName: customerList[1]?.name || "XYZ Builders",
        customerId: customerList[1]?.id,
        description: "Pending invoice - recent work",
      },
      {
        invoiceNumber: "INV-2024-012",
        status: "draft",
        amount: 445000, // $4,450.00
        issueDate: now,
        dueDate: addDays(now, 30),
        customerName: customerList[4]?.name || "Premier Construction",
        customerId: customerList[4]?.id,
        description: "Draft - awaiting approval",
      },

      // Partially paid
      {
        invoiceNumber: "INV-2024-013",
        status: "partially_paid",
        amount: 850000, // $8,500.00
        issueDate: subDays(now, 25),
        dueDate: addDays(now, 5),
        customerName: customerList[0]?.name || "ABC Construction",
        customerId: customerList[0]?.id,
        description: "Large project - 50% paid",
      },

      // Scheduled invoice
      {
        invoiceNumber: "INV-2024-014",
        status: "scheduled",
        amount: 565000, // $5,650.00
        issueDate: addDays(now, 7),
        dueDate: addDays(now, 37),
        customerName: customerList[2]?.name || "Quick Build Co",
        customerId: customerList[2]?.id,
        description: "Scheduled for next week",
      },

      // Canceled invoice
      {
        invoiceNumber: "INV-2024-015",
        status: "canceled",
        amount: 225000, // $2,250.00
        issueDate: subDays(now, 30),
        dueDate: now,
        customerName: customerList[3]?.name || "Metro Developments",
        customerId: customerList[3]?.id,
        description: "Canceled - project terminated",
      },

      // Recent paid invoices for trends
      {
        invoiceNumber: "INV-2024-016",
        status: "paid",
        amount: 387000, // $3,870.00
        issueDate: subDays(now, 7),
        dueDate: addDays(now, 23),
        paidAt: subDays(now, 2),
        customerName: customerList[1]?.name || "XYZ Builders",
        customerId: customerList[1]?.id,
        description: "Quick payment - regular client",
      },
      {
        invoiceNumber: "INV-2024-017",
        status: "paid",
        amount: 298000, // $2,980.00
        issueDate: subDays(now, 14),
        dueDate: addDays(now, 16),
        paidAt: subDays(now, 3),
        customerName: customerList[4]?.name || "Premier Construction",
        customerId: customerList[4]?.id,
        description: "Standard job - paid early",
      },
    ];

    // 3. Insert invoices into database
    const createdInvoices = [];
    for (const invoice of invoiceExamples) {
      try {
        const invoiceData = {
          id: uuidv4(),
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          amount: invoice.amount,
          currency: "USD",
          issueDate: format(invoice.issueDate, "yyyy-MM-dd"),
          dueDate: format(invoice.dueDate, "yyyy-MM-dd"),
          paidAt: invoice.paidAt ? format(invoice.paidAt, "yyyy-MM-dd") : null,
          customerId: invoice.customerId || null,
          customerName: invoice.customerName,
          teamId: teamId,
          lineItems: [
            {
              description: invoice.description,
              quantity: 1,
              price: invoice.amount,
              total: invoice.amount,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const [created] = await db
          .insert(invoices)
          .values(invoiceData)
          .returning();
        createdInvoices.push(created);
        console.log(
          `✅ Created ${invoice.status} invoice: ${invoice.invoiceNumber} - $${(invoice.amount / 100).toFixed(2)}`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to create invoice ${invoice.invoiceNumber}:`,
          error.message,
        );
      }
    }

    console.log(`\n✅ Successfully created ${createdInvoices.length} invoices`);

    // 4. Display summary
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
    console.log("   • Invoice status distribution charts");
    console.log("   • Aging analysis with overdue amounts");
    console.log("   • Collection rate and payment metrics");
    console.log("   • Customer invoice rankings");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    console.error("Stack:", error.stack);
  }

  process.exit(0);
}

seedInvoices();
