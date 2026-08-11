import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../services/esc_pos_printer_service.dart';

class EscPosPrinterScreen extends StatefulWidget {
  final Map<String, dynamic>? invoiceData;

  const EscPosPrinterScreen({super.key, this.invoiceData});

  @override
  State<EscPosPrinterScreen> createState() => _EscPosPrinterScreenState();
}

class _EscPosPrinterScreenState extends State<EscPosPrinterScreen> {
  final EscPosPrinterService _printerService = EscPosPrinterService();
  List<EscPosPrinterDevice> _printers = [];
  bool _isScanning = false;
  bool _isConnecting = false;
  bool _isPrinting = false;
  int _selectedPaperWidth = 58;
  bool _showWhitePaperMode = true; // Toggle between White Thermal Paper vs Terminal view

  final TextEditingController _ipController = TextEditingController(text: '192.168.1.200');

  @override
  void initState() {
    super.initState();
    _selectedPaperWidth = _printerService.paperWidthMm;
    _scanPrinters();
  }

  @override
  void dispose() {
    _ipController.dispose();
    super.dispose();
  }

  Future<void> _scanPrinters() async {
    setState(() => _isScanning = true);
    try {
      final list = await _printerService.scanPrinters();
      if (mounted) {
        setState(() {
          _printers = list;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error scanning printers: $e'), backgroundColor: AppTheme.roseError),
        );
      }
    } finally {
      if (mounted) setState(() => _isScanning = false);
    }
  }

  Future<void> _connectPrinter(EscPosPrinterDevice device) async {
    setState(() => _isConnecting = true);

    // Show animated user-friendly connecting modal loader
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 48,
                height: 48,
                child: CircularProgressIndicator(
                  strokeWidth: 3.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.reactIndigo),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Connecting to ESC/POS Printer',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                device.name,
                style: const TextStyle(fontSize: 13, color: AppTheme.reactIndigo, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                'Establishing ${device.connectionType} handshake with ${device.address}...',
                style: const TextStyle(fontSize: 11, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );

    try {
      await _printerService.connect(device);
      await _scanPrinters();

      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop(); // Dismiss loader modal

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text('Connected to ${device.name} successfully!')),
              ],
            ),
            backgroundColor: AppTheme.emeraldGreen,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop(); // Dismiss loader modal
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to connect: $e'), backgroundColor: AppTheme.roseError),
        );
      }
    } finally {
      if (mounted) setState(() => _isConnecting = false);
    }
  }

  Future<void> _disconnectPrinter() async {
    await _printerService.disconnect();
    await _scanPrinters();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Printer Disconnected.')),
      );
    }
  }

  Future<void> _handlePrint() async {
    if (_printerService.connectedPrinter == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please connect a Bluetooth or IP Thermal Printer first!'),
          backgroundColor: AppTheme.amberAccent,
        ),
      );
      return;
    }

    setState(() => _isPrinting = true);

    // Show step-by-step animated transmission progress dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.emeraldGreen.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.print, color: AppTheme.emeraldGreen, size: 36),
              ),
              const SizedBox(height: 20),
              const Text(
                'Transmitting ESC/POS Payload',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Sending print commands to ${_printerService.connectedPrinter!.name}...',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              const LinearProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.emeraldGreen),
                backgroundColor: Color(0xFFE2E8F0),
                minHeight: 6,
              ),
              const SizedBox(height: 12),
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.content_cut, size: 14, color: Colors.grey),
                  SizedBox(width: 4),
                  Text('Auto paper cut command included', style: TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    try {
      final invoice = widget.invoiceData!;
      await _printerService.printInvoiceReceipt(invoice);

      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop(); // Dismiss progress dialog

        // Success Confirmation Dialog
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: AppTheme.emeraldGreen, size: 28),
                SizedBox(width: 10),
                Text('Print Completed!'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Thermal receipt successfully printed on ${_printerService.connectedPrinter!.name}.',
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.receipt_long, size: 18, color: AppTheme.reactIndigo),
                      SizedBox(width: 8),
                      Text('Status: ESC/POS Cut Command Sent', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.slateSurface)),
                    ],
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop(true);
                },
                child: const Text('OK / Done', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              )
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop(); // Dismiss loader
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Print Error: $e'), backgroundColor: AppTheme.roseError),
        );
      }
    } finally {
      if (mounted) setState(() => _isPrinting = false);
    }
  }

  void _showAddCustomIpModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.wifi, color: AppTheme.reactIndigo),
            SizedBox(width: 8),
            Text('Add Network IP Printer', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter local LAN IP address and raw TCP port (default 9100):',
                style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 14),
            TextField(
              controller: _ipController,
              keyboardType: TextInputType.text,
              decoration: const InputDecoration(
                labelText: 'IP Address & Port',
                hintText: '192.168.1.200:9100',
                prefixIcon: Icon(Icons.router),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final ipText = _ipController.text.trim();
              if (ipText.isNotEmpty) {
                final customDev = EscPosPrinterDevice(
                  id: 'IP-${DateTime.now().millisecondsSinceEpoch}',
                  name: 'Network Printer ($ipText)',
                  address: ipText,
                  connectionType: 'NETWORK_IP',
                );
                setState(() {
                  _printers.add(customDev);
                });
                Navigator.of(ctx).pop();
                _connectPrinter(customDev);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.reactIndigo),
            child: const Text('Connect IP'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final connectedDevice = _printerService.connectedPrinter;
    final bool isPaymentSuccessView = widget.invoiceData != null;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final String receiptPreviewText = isPaymentSuccessView 
        ? _printerService.generateTextReceiptPreview(widget.invoiceData!)
        : '';

    return Scaffold(
      appBar: AppBar(
        title: Text(isPaymentSuccessView ? 'Payment Successful Receipt' : 'Paired Thermal Printers'),
        actions: [
          IconButton(
            icon: _isScanning 
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.reactIndigo))
                : const Icon(Icons.sync),
            onPressed: _isScanning ? null : _scanPrinters,
            tooltip: 'Rescan Printers',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // If opened after payment completion: Show Payment Success Badge at top!
            if (isPaymentSuccessView) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFA7F3D0), width: 1.5),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: const BoxDecoration(
                        color: AppTheme.emeraldGreen,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('PAYMENT SUCCESSFUL!', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF065F46))),
                          SizedBox(height: 2),
                          Text('Sale posted & receipt payload generated. Ready to print thermal copy.', style: TextStyle(fontSize: 11, color: Color(0xFF047857))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Active Connection Status Banner Card
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: connectedDevice != null 
                    ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                    : (isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB)),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: connectedDevice != null 
                      ? (isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0))
                      : (isDark ? const Color(0xFFD97706) : const Color(0xFFFDE68A)),
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: connectedDevice != null ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      connectedDevice != null ? Icons.print : Icons.print_disabled,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              connectedDevice != null ? 'PAIRED PRINTER READY' : 'NO PRINTER CONNECTED',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                                color: connectedDevice != null 
                                    ? (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF065F46))
                                    : (isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          connectedDevice != null
                              ? '${connectedDevice.name} (${connectedDevice.address})'
                              : 'Tap "Connect" on any paired printer below to set active printer.',
                          style: TextStyle(
                            fontSize: 11,
                            color: connectedDevice != null 
                                ? (isDark ? const Color(0xFFA7F3D0) : const Color(0xFF047857))
                                : (isDark ? const Color(0xFFFEF3C7) : const Color(0xFFB45309)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (connectedDevice != null)
                    OutlinedButton(
                      onPressed: _disconnectPrinter,
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.roseError),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text('Disconnect', style: TextStyle(color: AppTheme.roseError, fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Show Paired & Available Printers List ONLY when accessed from setup icon (not on Payment Success View)
            if (!isPaymentSuccessView) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.bluetooth_searching, size: 18, color: AppTheme.reactIndigo),
                      SizedBox(width: 6),
                      Text('Paired Devices & Thermal Printers', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  TextButton.icon(
                    onPressed: _isScanning ? null : _scanPrinters,
                    icon: const Icon(Icons.refresh, size: 14),
                    label: Text(_isScanning ? 'Scanning...' : 'Rescan', style: const TextStyle(fontSize: 12)),
                  ),
                ],
              ),

              // Scanning Progress Indicator
              if (_isScanning)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.reactIndigo.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.reactIndigo.withValues(alpha: 0.2)),
                  ),
                  child: const Row(
                    children: [
                      SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.reactIndigo)),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Scanning for Bluetooth SPP & Network Printers...',
                          style: TextStyle(fontSize: 12, color: AppTheme.reactIndigo, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),

              // Printers List
              if (_printers.isEmpty && !_isScanning)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Column(
                        children: [
                          const Icon(Icons.print_disabled, size: 36, color: Colors.grey),
                          const SizedBox(height: 8),
                          const Text('No thermal printers detected.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 4),
                          const Text('Ensure Bluetooth is ON or add a Network IP printer manually.',
                              style: TextStyle(color: Colors.grey, fontSize: 11), textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: _showAddCustomIpModal,
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Add IP Printer'),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _printers.length,
                  itemBuilder: (ctx, idx) {
                    final dev = _printers[idx];
                    final bool isSelected = connectedDevice?.id == dev.id;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      color: isSelected ? AppTheme.reactIndigo.withValues(alpha: 0.1) : null,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(
                          color: isSelected ? AppTheme.reactIndigo : (isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.reactIndigo : (isDark ? AppTheme.slateBg : AppTheme.snowHover),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            dev.connectionType == 'BLUETOOTH' ? Icons.bluetooth : Icons.wifi,
                            color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppTheme.snowText),
                            size: 20,
                          ),
                        ),
                        title: Text(dev.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        subtitle: Text('${dev.connectionType} • ${dev.address}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        trailing: isSelected
                            ? const Chip(
                                avatar: Icon(Icons.check, size: 14, color: Colors.white),
                                label: Text('ACTIVE', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                                backgroundColor: AppTheme.emeraldGreen,
                                padding: EdgeInsets.zero,
                              )
                            : ElevatedButton(
                                onPressed: _isConnecting ? null : () => _connectPrinter(dev),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.reactIndigo,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  elevation: 0,
                                ),
                                child: const Text('Connect', style: TextStyle(fontSize: 12)),
                              ),
                      ),
                    );
                  },
                ),
            ],
            const SizedBox(height: 20),

            // IF AND ONLY IF PAYMENT IS SUCCESSFUL: Show Receipt Preview & Direct ESC/POS Print Button!
            if (isPaymentSuccessView) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.remove_red_eye, size: 18, color: AppTheme.reactIndigo),
                      SizedBox(width: 6),
                      Text('Thermal Receipt Preview', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  TextButton.icon(
                    onPressed: () => setState(() => _showWhitePaperMode = !_showWhitePaperMode),
                    icon: Icon(_showWhitePaperMode ? Icons.dark_mode : Icons.light_mode, size: 14),
                    label: Text(_showWhitePaperMode ? 'Terminal View' : 'Paper View', style: const TextStyle(fontSize: 11)),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Physical Thermal Receipt Visualizer Container
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _showWhitePaperMode ? Colors.white : const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _showWhitePaperMode ? const Color(0xFFCBD5E1) : const Color(0xFF334155), width: 1.5),
                  boxShadow: _showWhitePaperMode
                      ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, spreadRadius: 2)]
                      : [],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedPaperWidth == 58 ? 'ESC/POS 58mm (32 Col)' : 'ESC/POS 80mm (48 Col)',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: _showWhitePaperMode ? Colors.grey.shade600 : const Color(0xFF94A3B8),
                          ),
                        ),
                        Icon(
                          Icons.content_cut,
                          size: 14,
                          color: _showWhitePaperMode ? Colors.grey.shade600 : const Color(0xFF94A3B8),
                        ),
                      ],
                    ),
                    const Divider(thickness: 1, height: 16),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Text(
                        receiptPreviewText,
                        style: TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: _showWhitePaperMode ? const Color(0xFF0F172A) : const Color(0xFF4ADE80),
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Primary Execute Print Action Button
              ElevatedButton.icon(
                onPressed: _isPrinting ? null : _handlePrint,
                icon: _isPrinting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                    : const Icon(Icons.print, size: 22),
                label: Text(
                  _isPrinting ? 'Transmitting to Thermal Head...' : 'Print ESC/POS Receipt Now',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emeraldGreen,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 3,
                  shadowColor: AppTheme.emeraldGreen.withValues(alpha: 0.4),
                ),
              ),
            ],

            // If accessed from Top Icon (No active payment): Show Field Troubleshooting Guide
            if (!isPaymentSuccessView) ...[
              Card(
                color: isDark ? AppTheme.slateSurface : const Color(0xFFF8FAFC),
                child: const Padding(
                  padding: EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.help_outline, size: 16, color: AppTheme.reactIndigo),
                          SizedBox(width: 6),
                          Text('ESC/POS Setup Guide', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                      SizedBox(height: 6),
                      Text(
                        '• Connected printer will be saved as active default for all field sales.\n'
                        '• When a sale payment is completed, receipt preview will appear automatically with one-tap print.\n'
                        '• Bluetooth PIN is usually 0000 or 1234.',
                        style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
