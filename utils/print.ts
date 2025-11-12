import { Receipt, Service, Currency, ExchangeRates } from '../types';
import { convertPrice, formatCurrency as formatCurrencyUtil } from './currency';

export const generateReceiptHtml = (receipt: Receipt, currency: Currency, rates: ExchangeRates): string => {
    const formatCurrency = (amount: number) => {
        const convertedAmount = convertPrice(amount, currency, rates);
        return formatCurrencyUtil(convertedAmount, currency);
    };

    let servicesHtml = receipt.services.map(s => `
        <tr class="item">
            <td>${s.name}</td>
            <td class="text-right">${formatCurrency(s.price)}</td>
        </tr>
    `).join('');

    return `
      <html>
        <head>
          <title>Receipt ${receipt.id}</title>
          <style>
            body { font-family: 'Lato', sans-serif; color: #2F4F4F; margin: 0; padding: 2rem; background: #fdfdfa; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; background: white; }
            h1 { font-family: 'Cormorant', serif; color: #CFB53B; text-align: center; margin-bottom: 0; }
            .header { text-align: center; margin-bottom: 2rem; }
            .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            .invoice-box table td { padding: 5px; vertical-align: top; }
            .invoice-box table tr.top table td { padding-bottom: 20px; }
            .invoice-box table tr.information table td { padding-bottom: 40px; }
            .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
            .invoice-box table tr.details td { padding-bottom: 20px; }
            .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
            .invoice-box table tr.item.last td { border-bottom: none; }
            .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 3rem; font-size: 0.9rem; color: #777; }
          </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <h1>MIRONA</h1>
                    <p>Timeless Luxury & Elegance</p>
                </div>
                <table>
                    <tr class="top">
                        <td colspan="2">
                            <table>
                                <tr>
                                    <td>
                                        Receipt ID: <strong>${receipt.id}</strong><br>
                                        Booking ID: ${receipt.bookingId}<br>
                                        Date Issued: ${receipt.issueDate}<br>
                                        Guest: ${receipt.guestName}
                                    </td>
                                    <td class="text-right">
                                        Check-in: ${receipt.checkIn}<br>
                                        Check-out: ${receipt.checkOut}<br>
                                        Room Type: ${receipt.roomType}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr class="heading">
                        <td>Item</td>
                        <td class="text-right">Price</td>
                    </tr>
                    <tr class="item">
                        <td>Room Charge</td>
                        <td class="text-right">${formatCurrency(receipt.roomTotal)}</td>
                    </tr>
                    ${servicesHtml}
                    <tr class="total">
                        <td></td>
                        <td class="text-right">Subtotal: ${formatCurrency(receipt.subtotal)}</td>
                    </tr>
                     <tr class="item">
                        <td></td>
                        <td class="text-right">Taxes (10%): ${formatCurrency(receipt.tax)}</td>
                    </tr>
                    <tr class="total">
                        <td></td>
                        <td class="text-right"><strong>Grand Total: ${formatCurrency(receipt.grandTotal)}</strong></td>
                    </tr>
                    <tr>
                         <td colspan="2" style="padding-top: 20px;"><strong>Payment Method:</strong> ${receipt.paymentMethod}</td>
                    </tr>
                </table>
                <div class="footer">
                    <p>Thank you for choosing Mirona Hotel. We hope to welcome you back soon.</p>
                </div>
            </div>
        </body>
      </html>
    `;
};
