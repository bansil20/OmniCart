// Utility function to generate and trigger PDF download for OmniCart Invoices
export const downloadOrderInvoicePDF = (order, isSellerInvoice = false) => {
  if (!order) return;

  const orderId = order._id || 'ORD-UNKNOWN';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString();

  const shipping = order.shippingAddress || {};
  const items = order.orderItems || [];
  const total = Number(order.totalPrice || 0);

  const printWindow = window.open('', '_blank');

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OmniCart_Invoice_${orderId}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 30px;
            color: #1e293b;
            background: #ffffff;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #e2e8f0;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-b: 2px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .brand-logo {
            font-size: 28px;
            font-weight: 900;
            color: #1e3a8a;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 800;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .info-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            font-size: 13px;
            line-height: 1.6;
          }
          .info-col {
            flex: 1;
          }
          .info-col strong {
            color: #0f172a;
          }
          .table-header {
            background-color: #f1f5f9;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .amount-col {
            text-align: right;
          }
          .total-box {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
          }
          .total-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px 25px;
            border-radius: 12px;
            width: 260px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .grand-total {
            font-size: 16px;
            font-weight: 800;
            color: #1e3a8a;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            margin-top: 8px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-t: 1px solid #f1f5f9;
            padding-top: 15px;
          }
          .status-stamp {
            display: inline-block;
            background-color: #dcfce7;
            color: #166534;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
          }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header-row">
            <div>
              <div class="brand-logo">OmniCart</div>
              <div style="font-size: 11px; color: #64748b;">Official Purchase Receipt & Tax Invoice</div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">${isSellerInvoice ? 'SALES INVOICE' : 'CUSTOMER BILL'}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;"># ${orderId}</div>
              <div class="status-stamp" style="margin-top: 6px;">PAID & CONFIRMED</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-col">
              <strong>Order Details:</strong><br/>
              <strong>Date:</strong> ${orderDate}<br/>
              <strong>Payment Mode:</strong> ${order.paymentMethod || 'Card'}<br/>
              <strong>Payment Status:</strong> Successful (Processed)
            </div>
            <div class="info-col" style="text-align: right;">
              <strong>Billed / Delivered To:</strong><br/>
              <strong>Name:</strong> ${shipping.fullName || order.user?.name || 'Customer'}<br/>
              <strong>Phone:</strong> ${shipping.phone || 'N/A'}<br/>
              <strong>Address:</strong> ${shipping.address || ''}, ${shipping.city || ''}, ${shipping.state || ''} - ${shipping.pincode || ''}
            </div>
          </div>

          <table>
            <thead>
              <tr class="table-header">
                <th>#</th>
                <th>Item Description</th>
                <th class="amount-col">Price (₹)</th>
                <th class="amount-col">Qty</th>
                <th class="amount-col">Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.name || item.product?.name || 'Product'}</strong></td>
                  <td class="amount-col">₹${Number(item.price || 0).toFixed(2)}</td>
                  <td class="amount-col">${item.qty || 1}</td>
                  <td class="amount-col"><strong>₹${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}</strong></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-card">
              <div class="total-row">
                <span>Items Subtotal:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Shipping Fee:</span>
                <span style="color: #16a34a; font-weight: 700;">FREE</span>
              </div>
              <div class="total-row grand-total">
                <span>Total Paid:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            Thank you for shopping on OmniCart! For customer support, contact support@omnicart.com.<br/>
            This is a computer-generated tax invoice. No signature required.
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
};
