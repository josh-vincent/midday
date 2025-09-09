import type { InvoiceFormValues } from "./form-context";

export const transformFormValuesToDraft = (values: InvoiceFormValues) => {
  console.log("Transform input values (NO CONVERSION):", {
    amount: values.amount,
    subtotal: values.subtotal,
    tax: values.tax,
    vat: values.vat,
    lineItems: values.lineItems?.map(item => ({ name: item.name, price: item.price, quantity: item.quantity }))
  });

  // Pass values through without any conversion - let the API handle it
  const result = {
    ...values,
    // No conversion - pass amounts as-is
    amount: values.amount || 0,
    subtotal: values.subtotal || 0,
    tax: values.tax || 0,
    vat: values.vat || 0,
    discount: values.discount || 0,
    // No conversion for line items either
    lineItems: values.lineItems || [],
    template: {
      ...values.template,
      ...(values.paymentDetails && {
        paymentDetails: typeof values.paymentDetails === 'string' 
          ? values.paymentDetails 
          : JSON.stringify(values.paymentDetails),
      }),
      ...(values.fromDetails && {
        fromDetails: typeof values.fromDetails === 'string' 
          ? values.fromDetails 
          : JSON.stringify(values.fromDetails),
      }),
    },
    ...(values.paymentDetails && {
      paymentDetails: typeof values.paymentDetails === 'string' 
        ? values.paymentDetails 
        : JSON.stringify(values.paymentDetails),
    }),
    ...(values.fromDetails && {
      fromDetails: typeof values.fromDetails === 'string' 
        ? values.fromDetails 
        : JSON.stringify(values.fromDetails),
    }),
    ...(values.customerDetails && {
      customerDetails: typeof values.customerDetails === 'string' 
        ? values.customerDetails 
        : JSON.stringify(values.customerDetails),
    }),
    ...(values.noteDetails && {
      noteDetails: typeof values.noteDetails === 'string' 
        ? values.noteDetails 
        : JSON.stringify(values.noteDetails),
    }),
  };

  console.log("Transform output values:", {
    amount: result.amount,
    subtotal: result.subtotal,
    tax: result.tax,
    vat: result.vat,
    lineItems: result.lineItems?.map(item => ({ name: item.name, price: item.price, quantity: item.quantity }))
  });

  return result;
};
