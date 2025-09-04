import {
  cancelScheduledInvoiceSchema,
  createInvoiceSchema,
  deleteInvoiceSchema,
  draftInvoiceSchema,
  duplicateInvoiceSchema,
  getInvoiceByIdSchema,
  getInvoiceByTokenSchema,
  getInvoicesSchema,
  invoiceSummarySchema,
  remindInvoiceSchema,
  searchInvoiceNumberSchema,
  updateInvoiceSchema,
  updateScheduledInvoiceSchema,
} from "@api/schemas/invoice";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import { UTCDate } from "@date-fns/utc";
import {
  deleteInvoice,
  draftInvoice,
  duplicateInvoice,
  getAverageDaysToPayment,
  getAverageInvoiceSize,
  getCustomerById,
  getInactiveClientsCount,
  getInvoiceById,
  getInvoiceSummary,
  getInvoiceTemplate,
  getInvoices,
  getMostActiveClient,
  getNewCustomersCount,
  getNextInvoiceNumber,
  getPaymentStatus,
  getTeamById,
  getTopRevenueClient,
  // getTrackerProjectById, // Removed - tracker functionality disabled
  // getTrackerRecordsByRange, // Removed - tracker functionality disabled
  getUserById,
  searchInvoiceNumber,
  updateInvoice,
} from "@midday/db/queries";
import { verify } from "@midday/invoice/token";
import { transformCustomerToContent } from "@midday/invoice/utils";
import type {
  GenerateInvoicePayload,
  SendInvoiceReminderPayload,
} from "@midday/jobs/schema";
// Disabled - trigger.dev
// import { runs, tasks } from "@trigger.dev/sdk";
import { TRPCError } from "@trpc/server";
import { addMonths, format, parseISO } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const defaultTemplate = {
  title: "Invoice",
  customerLabel: "To",
  fromLabel: "From",
  invoiceNoLabel: "Invoice No",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Price",
  quantityLabel: "Quantity",
  totalLabel: "Total",
  totalSummaryLabel: "Total",
  subtotalLabel: "Subtotal",
  vatLabel: "VAT",
  taxLabel: "Tax",
  paymentLabel: "Payment Details",
  paymentDetails: undefined,
  noteLabel: "Note",
  logoUrl: undefined,
  currency: "USD",
  fromDetails: undefined,
  size: "a4",
  includeVat: true,
  includeTax: true,
  discountLabel: "Discount",
  includeDiscount: false,
  includeUnits: false,
  includeDecimals: false,
  includePdf: false,
  sendCopy: false,
  includeQr: true,
  dateFormat: "dd/MM/yyyy",
  taxRate: 0,
  vatRate: 0,
  deliveryType: "create",
  timezone: undefined,
  locale: undefined,
};

export const invoiceRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInvoicesSchema.optional())
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoices(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getInvoiceByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoiceById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  getInvoiceByToken: publicProcedure
    .input(getInvoiceByTokenSchema)
    .query(async ({ input, ctx: { db } }) => {
      const { id } = (await verify(decodeURIComponent(input.token))) as {
        id: string;
      };

      if (!id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return getInvoiceById(db, {
        id,
      });
    }),

  paymentStatus: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getPaymentStatus(db, teamId!);
  }),

  searchInvoiceNumber: protectedProcedure
    .input(searchInvoiceNumberSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return searchInvoiceNumber(db, {
        teamId: teamId!,
        query: input.query,
      });
    }),

  invoiceSummary: protectedProcedure
    .input(invoiceSummarySchema.optional())
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInvoiceSummary(db, {
        teamId: teamId!,
        status: input?.status,
      });
    }),

  createFromTracker: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        dateFrom: z.string(),
        dateTo: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      // Tracker functionality has been disabled
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Tracker functionality is no longer supported",
      });
    }),

  defaultSettings: protectedProcedure.query(
    async ({ ctx: { db, teamId, session, geo } }) => {
      // Fetch invoice number, template, and team details concurrently
      const [nextInvoiceNumber, template, team, user] = await Promise.all([
        getNextInvoiceNumber(db, teamId!),
        getInvoiceTemplate(db, teamId!),
        getTeamById(db, teamId!),
        getUserById(db, session?.user.id!),
      ]);

      const locale = user?.locale ?? geo?.locale ?? "en";
      const timezone = user?.timezone ?? geo?.timezone ?? "America/New_York";
      const currency =
        template?.currency ?? team?.baseCurrency ?? defaultTemplate.currency;
      const dateFormat =
        template?.dateFormat ?? user?.dateFormat ?? defaultTemplate.dateFormat;
      const logoUrl = template?.logoUrl ?? defaultTemplate.logoUrl;
      const countryCode = geo?.country ?? "US";

      // Default to letter size for US/CA, A4 for rest of world
      const size = ["US", "CA"].includes(countryCode) ? "letter" : "a4";

      // Default to include sales tax for countries where it's common
      const includeTax = ["US", "CA", "AU", "NZ", "SG", "MY", "IN"].includes(
        countryCode,
      );

      const savedTemplate = {
        title: template?.title ?? defaultTemplate.title,
        logoUrl,
        currency,
        size: template?.size ?? defaultTemplate.size,
        includeTax: template?.includeTax ?? includeTax,
        includeVat: template?.includeVat ?? !includeTax,
        includeDiscount:
          template?.includeDiscount ?? defaultTemplate.includeDiscount,
        includeDecimals:
          template?.includeDecimals ?? defaultTemplate.includeDecimals,
        includeUnits: template?.includeUnits ?? defaultTemplate.includeUnits,
        includeQr: template?.includeQr ?? defaultTemplate.includeQr,
        includePdf: template?.includePdf ?? defaultTemplate.includePdf,
        sendCopy: template?.sendCopy ?? defaultTemplate.sendCopy,
        customerLabel: template?.customerLabel ?? defaultTemplate.customerLabel,
        fromLabel: template?.fromLabel ?? defaultTemplate.fromLabel,
        invoiceNoLabel:
          template?.invoiceNoLabel ?? defaultTemplate.invoiceNoLabel,
        subtotalLabel: template?.subtotalLabel ?? defaultTemplate.subtotalLabel,
        issueDateLabel:
          template?.issueDateLabel ?? defaultTemplate.issueDateLabel,
        totalSummaryLabel:
          template?.totalSummaryLabel ?? defaultTemplate.totalSummaryLabel,
        dueDateLabel: template?.dueDateLabel ?? defaultTemplate.dueDateLabel,
        discountLabel: template?.discountLabel ?? defaultTemplate.discountLabel,
        descriptionLabel:
          template?.descriptionLabel ?? defaultTemplate.descriptionLabel,
        priceLabel: template?.priceLabel ?? defaultTemplate.priceLabel,
        quantityLabel: template?.quantityLabel ?? defaultTemplate.quantityLabel,
        totalLabel: template?.totalLabel ?? defaultTemplate.totalLabel,
        vatLabel: template?.vatLabel ?? defaultTemplate.vatLabel,
        taxLabel: template?.taxLabel ?? defaultTemplate.taxLabel,
        paymentLabel: template?.paymentLabel ?? defaultTemplate.paymentLabel,
        noteLabel: template?.noteLabel ?? defaultTemplate.noteLabel,
        dateFormat,
        deliveryType: template?.deliveryType ?? defaultTemplate.deliveryType,
        taxRate: template?.taxRate ?? defaultTemplate.taxRate,
        vatRate: template?.vatRate ?? defaultTemplate.vatRate,
        fromDetails: template?.fromDetails ?? defaultTemplate.fromDetails,
        paymentDetails:
          template?.paymentDetails ?? defaultTemplate.paymentDetails,
        timezone,
        locale,
      };

      return {
        // Default values first
        id: uuidv4(),
        currency,
        status: "draft",
        size,
        includeTax: savedTemplate?.includeTax ?? includeTax,
        includeVat: savedTemplate?.includeVat ?? !includeTax,
        includeDiscount: false,
        includeDecimals: false,
        includePdf: false,
        sendCopy: false,
        includeUnits: false,
        includeQr: true,
        invoiceNumber: nextInvoiceNumber,
        timezone,
        locale,
        fromDetails: savedTemplate.fromDetails,
        paymentDetails: savedTemplate.paymentDetails,
        customerDetails: undefined,
        noteDetails: undefined,
        customerId: undefined,
        issueDate: new UTCDate().toISOString(),
        dueDate: addMonths(new UTCDate(), 1).toISOString(),
        lineItems: [{ name: "", quantity: 0, price: 0, vat: 0 }],
        tax: undefined,
        token: undefined,
        discount: undefined,
        subtotal: undefined,
        topBlock: undefined,
        bottomBlock: undefined,
        amount: undefined,
        customerName: undefined,
        logoUrl: undefined,
        vat: undefined,
        template: savedTemplate,
      };
    },
  ),

  update: protectedProcedure
    .input(updateInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return updateInvoice(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(deleteInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteInvoice(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  draft: protectedProcedure
    .input(draftInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return draftInvoice(db, {
        ...input,
        teamId: teamId!,
        userId: session?.user.id!,
        paymentDetails: parseInputValue(input.paymentDetails),
        fromDetails: parseInputValue(input.fromDetails),
        customerDetails: parseInputValue(input.customerDetails),
        noteDetails: parseInputValue(input.noteDetails),
      });
    }),

  create: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      // Handle different delivery types
      if (input.deliveryType === "scheduled") {
        if (!input.scheduledAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "scheduledAt is required for scheduled delivery",
          });
        }

        // Convert to Date object and validate it's in the future
        const scheduledDate = new Date(input.scheduledAt);
        const now = new Date();

        if (scheduledDate <= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "scheduledAt must be in the future",
          });
        }

        // Check if this is an existing scheduled invoice
        const existingInvoice = await getInvoiceById(db, {
          id: input.id,
          teamId: teamId!,
        });

        let scheduledJobId: string;

        if (existingInvoice?.scheduledJobId) {
          // Reschedule the existing job instead of creating a new one
          // Disabled - trigger.dev
          // await runs.reschedule(existingInvoice.scheduledJobId, {
          //   delay: scheduledDate,
          // });
          scheduledJobId = existingInvoice.scheduledJobId;
        } else {
          // Create a new scheduled job
          // Disabled - trigger.dev
          // const scheduledRun = await tasks.trigger(
          //   "schedule-invoice",
          //   {
          //     invoiceId: input.id,
          //     scheduledAt: input.scheduledAt,
          //   },
          //   {
          //     delay: scheduledDate,
          //   },
          // );

          // scheduledJobId = scheduledRun.id;
          scheduledJobId = null; // Placeholder
        }

        // Update the invoice with scheduling information
        const data = await updateInvoice(db, {
          id: input.id,
          status: "scheduled",
          scheduledAt: input.scheduledAt,
          scheduledJobId,
          teamId: teamId!,
        });

        if (!data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found",
          });
        }

        // Disabled - trigger.dev
        // tasks.trigger("notification", {
        //   type: "invoice_scheduled",
        //   teamId: teamId!,
        //   invoiceId: input.id,
        //   invoiceNumber: data.invoiceNumber,
        //   scheduledAt: input.scheduledAt,
        //   customerName: data.customerName,
        // });

        return data;
      }

      const data = await updateInvoice(db, {
        id: input.id,
        status: "unpaid",
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Disabled - trigger.dev
      // await tasks.trigger("generate-invoice", {
      //   invoiceId: data.id,
      //   deliveryType: input.deliveryType,
      // } satisfies GenerateInvoicePayload);

      return data;
    }),

  remind: protectedProcedure
    .input(remindInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Disabled - trigger.dev
      // await tasks.trigger("send-invoice-reminder", {
      //   invoiceId: input.id,
      // } satisfies SendInvoiceReminderPayload);

      return updateInvoice(db, {
        id: input.id,
        teamId: teamId!,
        reminderSentAt: input.date,
      });
    }),

  duplicate: protectedProcedure
    .input(duplicateInvoiceSchema)
    .mutation(async ({ input, ctx: { db, session, teamId } }) => {
      const nextInvoiceNumber = await getNextInvoiceNumber(db, teamId!);

      return duplicateInvoice(db, {
        id: input.id,
        userId: session?.user.id!,
        invoiceNumber: nextInvoiceNumber!,
        teamId: teamId!,
      });
    }),

  updateSchedule: protectedProcedure
    .input(updateScheduledInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Get the current invoice to find the old scheduled job ID
      const invoice = await getInvoiceById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!invoice || !invoice.scheduledJobId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled invoice not found",
        });
      }

      // Convert to Date object and validate it's in the future
      const scheduledDate = new Date(input.scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "scheduledAt must be in the future",
        });
      }

      // Disabled - trigger.dev
      // Reschedule the existing job with the new date
      // await runs.reschedule(invoice.scheduledJobId, {
      //   delay: scheduledDate,
      // });

      // Update the scheduled date in the database
      const updatedInvoice = await updateInvoice(db, {
        id: input.id,
        scheduledAt: input.scheduledAt,
        teamId: teamId!,
      });

      return updatedInvoice;
    }),

  cancelSchedule: protectedProcedure
    .input(cancelScheduledInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Get the current invoice to find the scheduled job ID
      const invoice = await getInvoiceById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!invoice || !invoice.scheduledJobId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled invoice not found",
        });
      }

      // Disabled - trigger.dev
      // Cancel the scheduled job
      // await runs.cancel(invoice.scheduledJobId);

      // Update the invoice status back to draft and clear scheduling fields
      const updatedInvoice = await updateInvoice(db, {
        id: input.id,
        status: "draft",
        scheduledAt: null,
        scheduledJobId: null,
        teamId: teamId!,
      });

      return updatedInvoice;
    }),

  mostActiveClient: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getMostActiveClient(db, { teamId: teamId! });
    },
  ),

  inactiveClientsCount: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getInactiveClientsCount(db, { teamId: teamId! });
    },
  ),

  averageDaysToPayment: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getAverageDaysToPayment(db, { teamId: teamId! });
    },
  ),

  averageInvoiceSize: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getAverageInvoiceSize(db, { teamId: teamId! });
    },
  ),

  topRevenueClient: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getTopRevenueClient(db, { teamId: teamId! });
    },
  ),

  newCustomersCount: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getNewCustomersCount(db, { teamId: teamId! });
    },
  ),
});
