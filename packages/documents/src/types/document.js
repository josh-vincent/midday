"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceDataSchema = void 0;
const zod_1 = require("zod");
// Validation schemas
exports.invoiceDataSchema = zod_1.z.object({
    invoiceNumber: zod_1.z.string(),
    issueDate: zod_1.z.date(),
    dueDate: zod_1.z.date(),
    status: zod_1.z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
    seller: zod_1.z.object({
        name: zod_1.z.string(),
        address: zod_1.z.object({
            line1: zod_1.z.string(),
            line2: zod_1.z.string().optional(),
            city: zod_1.z.string(),
            state: zod_1.z.string().optional(),
            postalCode: zod_1.z.string(),
            country: zod_1.z.string(),
        }).optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        taxId: zod_1.z.string().optional(),
    }),
    buyer: zod_1.z.object({
        name: zod_1.z.string(),
        address: zod_1.z.object({
            line1: zod_1.z.string(),
            line2: zod_1.z.string().optional(),
            city: zod_1.z.string(),
            state: zod_1.z.string().optional(),
            postalCode: zod_1.z.string(),
            country: zod_1.z.string(),
        }).optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        taxId: zod_1.z.string().optional(),
    }),
    items: zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string(),
        quantity: zod_1.z.number(),
        unitPrice: zod_1.z.number(),
        amount: zod_1.z.number(),
        tax: zod_1.z.number().optional(),
        discount: zod_1.z.number().optional(),
        sku: zod_1.z.string().optional(),
        unit: zod_1.z.string().optional(),
    })),
    subtotal: zod_1.z.number(),
    tax: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        rate: zod_1.z.number(),
        amount: zod_1.z.number(),
    })).optional(),
    discount: zod_1.z.object({
        type: zod_1.z.enum(["percentage", "fixed"]),
        value: zod_1.z.number(),
        amount: zod_1.z.number(),
    }).optional(),
    shipping: zod_1.z.number().optional(),
    total: zod_1.z.number(),
    paymentTerms: zod_1.z.string().optional(),
    paymentMethods: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    currency: zod_1.z.string().optional(),
    locale: zod_1.z.string().optional(),
});
