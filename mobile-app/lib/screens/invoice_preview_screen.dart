import 'package:flutter/material.dart';
import '../../core/theme.dart';
import 'esc_pos_printer_screen.dart';

class InvoicePreviewScreen extends StatelessWidget {
  final Map<String, dynamic> invoiceData;

  const InvoicePreviewScreen({super.key, required this.invoiceData});

  @override
  Widget build(BuildContext context) {
    final Map<String, dynamic> shop = invoiceData['shop'];
    final List<Map<String, dynamic>> items = List<Map<String, dynamic>>.from(invoiceData['items']);
    final double subtotal = invoiceData['subtotal'];
    final double discount = invoiceData['discount'];
    final double gst = invoiceData['gst'];
    final double grandTotal = invoiceData['grandTotal'];
    final String paymentMode = invoiceData['paymentMode'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice Blueprint Preview'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Bill Invoice Card Blueprint
            Card(
              color: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Invoice Header
                    Center(
                      child: Column(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.asset(
                              'assets/logo.jfif',
                              height: 48,
                              width: 48,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'GEMINI FOODS',
                            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F172A), letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 2),
                          const Text('Commercial Bakeries Pvt. Ltd. • Field Distribution',
                              style: TextStyle(color: Colors.grey, fontSize: 11)),
                          const Text('Support: +91 44 2623 8899 | GSTIN: 33AAACG1234F1Z5',
                              style: TextStyle(color: Colors.grey, fontSize: 10)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Divider(color: Colors.black26, thickness: 1),
                    const SizedBox(height: 12),

                    // Customer / Shop Info
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Billed Outlet:', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                              Text(shop['shopName'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black)),
                              Text(shop['address'], style: const TextStyle(fontSize: 11, color: Colors.black87)),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('Invoice #: ${invoiceData['invoiceNumber'] ?? 'DRAFT'}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.reactIndigo)),
                            Text('Date: ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}', style: const TextStyle(fontSize: 11, color: Colors.black54)),
                            Text('Time: ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}', style: const TextStyle(fontSize: 10, color: Colors.black54)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Items list Table Header
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.all(Radius.circular(4)),
                      ),
                      child: const Row(
                        children: [
                          Expanded(flex: 3, child: Text('ITEM PARTICULARS', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF334155), fontSize: 11))),
                          Expanded(child: Text('QTY', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF334155), fontSize: 11), textAlign: TextAlign.center)),
                          Expanded(child: Text('RATE (₹)', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF334155), fontSize: 11), textAlign: TextAlign.right)),
                          Expanded(child: Text('AMOUNT', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF334155), fontSize: 11), textAlign: TextAlign.right)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),

                    ...items.map((itm) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 4),
                          child: Row(
                            children: [
                              Expanded(flex: 3, child: Text(itm['productName'], style: const TextStyle(color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w500))),
                              Expanded(child: Text('${itm['quantity']}', style: const TextStyle(color: Colors.black, fontSize: 12), textAlign: TextAlign.center)),
                              Expanded(child: Text('₹${itm['price'].toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 12), textAlign: TextAlign.right)),
                              Expanded(child: Text('₹${itm['total'].toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold), textAlign: TextAlign.right)),
                            ],
                          ),
                        )),
                    const Divider(color: Colors.black26),
                    const SizedBox(height: 6),

                    // Summary Block
                    _buildInvoiceTotalRow('Fresh Delivery Total', '₹${subtotal.toStringAsFixed(2)}', isBold: false),
                    if (discount > 0) _buildInvoiceTotalRow('Discount Applied', '-₹${discount.toStringAsFixed(2)}', isBold: false),
                    _buildInvoiceTotalRow('GST (5%)', '₹${gst.toStringAsFixed(2)}', isBold: false),
                    if ((invoiceData['returnCredit'] ?? 0.0) > 0)
                      _buildInvoiceTotalRow('Return Credit (Original Sale Price)', '-₹${(invoiceData['returnCredit'] as double).toStringAsFixed(2)}', isBold: true),
                    const Divider(color: Colors.black38),
                    _buildInvoiceTotalRow('Net Payable Amount', '₹${(invoiceData['netPayable'] ?? grandTotal).toStringAsFixed(2)}', isBold: true),
                    const SizedBox(height: 12),

                    // Payment Mode label
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Payment Settlement:', style: TextStyle(color: Color(0xFF065F46), fontWeight: FontWeight.bold, fontSize: 12)),
                          Text(
                            paymentMode == 'UPI' ? 'INSTANT UPI / DIGITAL QR' : 'INSTANT CASH HANDOVER',
                            style: const TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Center(
                      child: Text('--- Thank You for Shopping with Gemini Food ---',
                          style: TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Complete Sale & Trigger Payment Success ESC/POS Receipt Screen
            ElevatedButton.icon(
              onPressed: () async {
                final result = await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => EscPosPrinterScreen(invoiceData: invoiceData),
                  ),
                );
                if (result == true && context.mounted) {
                  Navigator.of(context).pop(true);
                }
              },
              icon: Icon(invoiceData['isSubmitted'] == true ? Icons.print_rounded : Icons.check_circle_outline),
              label: Text(
                invoiceData['isSubmitted'] == true ? 'Print Thermal Receipt (ESC/POS)' : 'Complete Sale & Post Invoice',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emeraldGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showShareToast(context, 'WhatsApp Business'),
                    icon: const Icon(Icons.share, color: AppTheme.reactCyan, size: 18),
                    label: const Text('WhatsApp Receipt', style: TextStyle(color: AppTheme.reactCyan)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.slateBorder),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const EscPosPrinterScreen(), // Printer settings
                        ),
                      );
                    },
                    icon: const Icon(Icons.settings, color: AppTheme.reactCyan, size: 18),
                    label: const Text('Printer Setup', style: TextStyle(color: AppTheme.reactCyan)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.slateBorder),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showShareToast(BuildContext context, String platform) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Triggered invoice receipt payload to $platform.')),
    );
  }

  Widget _buildInvoiceTotalRow(String label, String value, {required bool isBold}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: const Color(0xFF475569), fontSize: isBold ? 14 : 12, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(color: isBold ? AppTheme.reactIndigo : Colors.black, fontSize: isBold ? 16 : 12, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }
}
