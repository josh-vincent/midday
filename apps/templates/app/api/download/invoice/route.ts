import { invoicesAPI } from "@/lib/mock/invoices-mock";
import { PdfTemplate, renderToStream } from "@midday/invoice-core";
import type { NextRequest } from "next/server";
import { z } from "zod";

const paramsSchema = z.object({
  token: z.string().optional(),
  preview: z.preprocess((val) => val === "true", z.boolean().default(false)),
});

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  const result = paramsSchema.safeParse(
    Object.fromEntries(requestUrl.searchParams.entries()),
  );

  if (!result.success) {
    return new Response("Invalid parameters", { status: 400 });
  }

  const { token, preview } = result.data;

  if (!token) {
    return new Response("Token is required", { status: 400 });
  }

  let data = null;

  try {
    data = await invoicesAPI.getInvoiceByToken(token);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return new Response("Error fetching invoice", { status: 500 });
  }

  if (!data) {
    return new Response("Invoice not found", { status: 404 });
  }

  try {
    const stream = await renderToStream(await PdfTemplate(data));

    // @ts-expect-error - stream is not assignable to BodyInit
    const blob = await new Response(stream).blob();

    const headers: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, max-age=0",
    };

    if (!preview) {
      headers["Content-Disposition"] =
        `attachment; filename="${data.invoiceNumber}.pdf"`;
    }

    return new Response(blob, { headers });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response("Error generating PDF", { status: 500 });
  }
}