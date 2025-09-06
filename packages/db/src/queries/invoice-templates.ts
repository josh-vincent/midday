import type { Database } from "@db/client";
import { invoiceTemplates } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { createActivity } from "./activities";

type CreateInvoiceTemplateParams = {
  teamId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  includeQr?: boolean;
  includeTaxNumber?: boolean;
  includePaymentDetails?: boolean;
  paymentTerms?: number;
  note?: string;
  terms?: string;
  paymentDetails?: string;
  createdBy?: string;
};

export async function createInvoiceTemplate(
  db: Database,
  params: CreateInvoiceTemplateParams,
) {
  const { createdBy, ...templateData } = params;

  const [template] = await db
    .insert(invoiceTemplates)
    .values({
      ...templateData,
      isDefault: templateData.isDefault || false,
      primaryColor: templateData.primaryColor || "#000000",
      includeQr: templateData.includeQr || false,
      includeTaxNumber: templateData.includeTaxNumber !== false,
      includePaymentDetails: templateData.includePaymentDetails !== false,
    })
    .returning();

  // Log activity
  if (createdBy) {
    await createActivity(db, {
      teamId: params.teamId,
      userId: createdBy,
      action: "created",
      entity: "invoice_template",
      entityId: template.id,
      metadata: {
        templateName: template.name,
      },
    });
  }

  return template;
}

type UpdateInvoiceTemplateParams = Partial<CreateInvoiceTemplateParams> & {
  id: string;
  teamId: string;
  updatedBy?: string;
};

export async function updateInvoiceTemplate(
  db: Database,
  params: UpdateInvoiceTemplateParams,
) {
  const { id, teamId, updatedBy, ...updateData } = params;

  // If setting as default, unset other defaults first
  if (updateData.isDefault) {
    await db
      .update(invoiceTemplates)
      .set({ isDefault: false })
      .where(eq(invoiceTemplates.teamId, teamId));
  }

  const [template] = await db
    .update(invoiceTemplates)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
    )
    .returning();

  // Log activity
  if (updatedBy) {
    await createActivity(db, {
      teamId,
      userId: updatedBy,
      action: "updated",
      entity: "invoice_template",
      entityId: id,
      metadata: {
        templateName: template.name,
        changes: Object.keys(updateData),
      },
    });
  }

  return template;
}

export async function getInvoiceTemplate(
  db: Database,
  id: string,
  teamId: string,
) {
  const [template] = await db
    .select()
    .from(invoiceTemplates)
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
    );

  return template;
}

export async function getInvoiceTemplates(db: Database, teamId: string) {
  return db
    .select()
    .from(invoiceTemplates)
    .where(eq(invoiceTemplates.teamId, teamId))
    .orderBy(invoiceTemplates.isDefault, invoiceTemplates.name);
}

export async function getDefaultInvoiceTemplate(db: Database, teamId: string) {
  const [template] = await db
    .select()
    .from(invoiceTemplates)
    .where(
      and(
        eq(invoiceTemplates.teamId, teamId),
        eq(invoiceTemplates.isDefault, true),
      ),
    );

  return template;
}

export async function deleteInvoiceTemplate(
  db: Database,
  id: string,
  teamId: string,
  deletedBy?: string,
) {
  // Get template info before deletion
  const [template] = await db
    .select({ name: invoiceTemplates.name })
    .from(invoiceTemplates)
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
    );

  if (template) {
    // Log activity before deletion
    if (deletedBy) {
      await createActivity(db, {
        teamId,
        userId: deletedBy,
        action: "deleted",
        entity: "invoice_template",
        entityId: id,
        metadata: {
          templateName: template.name,
        },
      });
    }

    // Delete template
    await db
      .delete(invoiceTemplates)
      .where(
        and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
      );
  }

  return template;
}

export async function ensureDefaultTemplate(db: Database, teamId: string) {
  // Check if there's a default template
  const defaultTemplate = await getDefaultInvoiceTemplate(db, teamId);

  if (!defaultTemplate) {
    // Create a basic default template
    const template = await createInvoiceTemplate(db, {
      teamId,
      name: "Default Template",
      description: "Standard invoice template",
      isDefault: true,
      primaryColor: "#000000",
      includeQr: false,
      includeTaxNumber: true,
      includePaymentDetails: true,
      paymentTerms: 30,
    });

    return template;
  }

  return defaultTemplate;
}
