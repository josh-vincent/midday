# Invoice Features Test Checklist

## Test 1: Invoice Template Settings (/invoices/settings)

1. **Navigate to Invoice Template Settings**
   - Go to `/invoices` page
   - Click the gear icon in the header
   - Should load the template settings page

2. **Test Basic Information Section**
   - Enter "Test Invoice" in the Invoice Title field
   - Enter a logo URL (e.g., https://example.com/logo.png)
   - Click "Save"
   - ✅ Should save without errors

3. **Test From Details Section**
   - Enter your company information:
     ```
     Your Company Name
     123 Main Street
     City, State 12345
     Email: info@company.com
     Phone: +1 234 567 890
     ```
   - Click "Save Company Details"
   - ✅ Should save without showing [Object object]

4. **Test Payment Details Section**
   - Enter payment information:
     ```
     Bank: Example Bank
     Account Name: Your Company
     BSB: 123-456
     Account: 12345678
     PayID: info@company.com
     ```
   - Click "Save Payment Details"
   - ✅ Should save without showing [Object object]

5. **Test Labels Customization**
   - Change "Invoice No" to "Invoice Number"
   - Change "To" to "Bill To"
   - Click "Save Labels"
   - ✅ Should save all label changes

6. **Test Format Options**
   - Toggle "Include VAT" on
   - Toggle "Include Discount Field" on
   - Change currency to "USD"
   - Click "Save Format Options"
   - ✅ Should save all format options

## Test 2: Invoice Creation with Prefilled Data

1. **Create New Invoice**
   - Go to `/invoices`
   - Click "Create Invoice" button
   - ✅ Invoice creation sheet should open

2. **Verify Prefilled Data**
   - ✅ "From" section should show your company details (not [Object object])
   - ✅ "Payment Details" section should show your payment info (not [Object object])
   - ✅ Labels should match your customizations (e.g., "Bill To" instead of "To")
   - ✅ Format options should match (currency, VAT toggle, etc.)

3. **Test Data Entry**
   - Select a customer
   - Add line items
   - ✅ Draft should auto-save (check network tab for draft API calls)

## Test 3: Draft Saving

1. **Create Draft**
   - Start creating a new invoice
   - Select a customer
   - Add a line item
   - Wait 2-3 seconds
   - ✅ Should see draft save API call in network tab

2. **Close and Reopen**
   - Close the invoice sheet
   - Click to create a new invoice
   - ✅ Previous draft data should be loaded

## Test 4: Data Display Verification

1. **Check All Text Fields**
   - ✅ From Details should display as formatted text (not [Object object])
   - ✅ Payment Details should display as formatted text (not [Object object])
   - ✅ Notes should display as formatted text (not [Object object])

2. **Check Saved Templates**
   - Go back to `/invoices/settings`
   - ✅ All previously saved data should be loaded correctly

## Expected Results

All tests marked with ✅ should pass. If any fail, note which specific test failed and any error messages.

## Common Issues to Check

1. **[Object object] appearing**: This means JSON isn't being properly stringified/parsed
2. **Fields not saving**: Check browser console for API errors
3. **Drafts not saving**: Check network tab for draft API calls
4. **Data not prefilling**: Check that template data is being fetched on invoice creation