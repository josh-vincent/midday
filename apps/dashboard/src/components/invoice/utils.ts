import type { InvoiceFormValues } from "./form-context";

export const transformFormValuesToDraft = (values: InvoiceFormValues) => {
  return {
    ...values,
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
};
