import 'dart:async';
import 'dart:convert';

/// Representation of a Bluetooth or WiFi/Network Thermal ESC/POS Printer
class EscPosPrinterDevice {
  final String id;
  final String name;
  final String address; // MAC address for Bluetooth or IP Address for Network
  final String connectionType; // 'BLUETOOTH' or 'NETWORK_IP'
  final bool isConnected;

  EscPosPrinterDevice({
    required this.id,
    required this.name,
    required this.address,
    required this.connectionType,
    this.isConnected = false,
  });

  EscPosPrinterDevice copyWith({bool? isConnected}) {
    return EscPosPrinterDevice(
      id: id,
      name: name,
      address: address,
      connectionType: connectionType,
      isConnected: isConnected ?? this.isConnected,
    );
  }
}

class EscPosPrinterService {
  static final EscPosPrinterService _instance = EscPosPrinterService._internal();
  factory EscPosPrinterService() => _instance;
  EscPosPrinterService._internal();

  EscPosPrinterDevice? _connectedPrinter;
  int _paperWidthMm = 58; // 58mm (32 chars) or 80mm (48 chars)

  EscPosPrinterDevice? get connectedPrinter => _connectedPrinter;
  int get paperWidthMm => _paperWidthMm;

  void setPaperWidth(int width) {
    _paperWidthMm = width;
  }

  /// Scan for available Bluetooth and Network Thermal POS Printers
  Future<List<EscPosPrinterDevice>> scanPrinters() async {
    await Future.delayed(const Duration(seconds: 1)); // Simulate BLE/Network discovery
    return [
      EscPosPrinterDevice(
        id: 'BT-001',
        name: 'RONGTA RPP02N (Thermal POS)',
        address: '88:1B:99:C2:A4:10',
        connectionType: 'BLUETOOTH',
        isConnected: _connectedPrinter?.id == 'BT-001',
      ),
      EscPosPrinterDevice(
        id: 'BT-002',
        name: 'POS-5802DD Mobile Printer',
        address: '00:11:22:33:44:55',
        connectionType: 'BLUETOOTH',
        isConnected: _connectedPrinter?.id == 'BT-002',
      ),
      EscPosPrinterDevice(
        id: 'NET-001',
        name: 'Epson TM-T88VI (Network IP)',
        address: '192.168.1.150:9100',
        connectionType: 'NETWORK_IP',
        isConnected: _connectedPrinter?.id == 'NET-001',
      ),
      EscPosPrinterDevice(
        id: 'BT-003',
        name: 'Star Micronics TSP100 III',
        address: 'AA:BB:CC:DD:EE:FF',
        connectionType: 'BLUETOOTH',
        isConnected: _connectedPrinter?.id == 'BT-003',
      ),
    ];
  }

  /// Connect to a thermal printer
  Future<bool> connect(EscPosPrinterDevice device) async {
    await Future.delayed(const Duration(milliseconds: 800));
    _connectedPrinter = device.copyWith(isConnected: true);
    return true;
  }

  /// Disconnect printer
  Future<void> disconnect() async {
    await Future.delayed(const Duration(milliseconds: 300));
    _connectedPrinter = null;
  }

  /// Generates human-readable monospaced text receipt preview for thermal printout
  String generateTextReceiptPreview(Map<String, dynamic> invoiceData) {
    final int charsPerLine = _paperWidthMm == 58 ? 32 : 48;
    final StringBuffer sb = StringBuffer();

    String center(String text) {
      if (text.length >= charsPerLine) return text;
      int left = (charsPerLine - text.length) ~/ 2;
      return ' ' * left + text;
    }

    String line() => '-' * charsPerLine;

    String row(String left, String right) {
      int space = charsPerLine - left.length - right.length;
      if (space < 1) space = 1;
      return left + (' ' * space) + right;
    }

    final shop = invoiceData['shop'] ?? {};
    final items = List<Map<String, dynamic>>.from(invoiceData['items'] ?? []);
    final double subtotal = (invoiceData['subtotal'] ?? 0.0).toDouble();
    final double discount = (invoiceData['discount'] ?? 0.0).toDouble();
    final double gst = (invoiceData['gst'] ?? 0.0).toDouble();
    final double returnCredit = (invoiceData['returnCredit'] ?? 0.0).toDouble();
    final double grandTotal = (invoiceData['netPayable'] ?? invoiceData['grandTotal'] ?? 0.0).toDouble();
    final String paymentMode = invoiceData['paymentMode'] ?? 'CASH';

    sb.writeln(center('GEMINI FOODS'));
    sb.writeln(center('Field Distribution & Billing'));
    sb.writeln(center('GSTIN: 33AAACG1234F1Z5'));
    sb.writeln(center('Ph: +91 44 2623 8899'));
    sb.writeln(line());
    sb.writeln(row('Date: ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}', 'Time: ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}'));
    sb.writeln('Shop: ${shop['shopName'] ?? 'Retail Customer'}');
    sb.writeln('Addr: ${shop['address'] ?? 'Counter Sale'}');
    sb.writeln(line());
    sb.writeln(row('ITEM', 'QTY  PRICE   TOTAL'));
    sb.writeln(line());

    for (var itm in items) {
      String name = itm['productName'] ?? 'Item';
      if (name.length > charsPerLine - 14) {
        name = name.substring(0, charsPerLine - 14);
      }
      String qtyStr = '${itm['quantity']}';
      String priceStr = '₹${(itm['price'] ?? 0).toStringAsFixed(0)}';
      String totalStr = '₹${(itm['total'] ?? 0).toStringAsFixed(0)}';
      String rightCol = '$qtyStr x $priceStr = $totalStr';
      sb.writeln(row(name, rightCol));
    }

    sb.writeln(line());
    sb.writeln(row('Subtotal:', '₹${subtotal.toStringAsFixed(2)}'));
    if (discount > 0) sb.writeln(row('Discount:', '-₹${discount.toStringAsFixed(2)}'));
    sb.writeln(row('GST (5%):', '₹${gst.toStringAsFixed(2)}'));
    if (returnCredit > 0) sb.writeln(row('Return Credit:', '-₹${returnCredit.toStringAsFixed(2)}'));
    sb.writeln(line());
    sb.writeln(row('NET PAYABLE:', '₹${grandTotal.toStringAsFixed(2)}'));
    sb.writeln(line());
    sb.writeln(center('PAYMENT: ${paymentMode.toUpperCase()}'));
    sb.writeln(line());
    sb.writeln(center('Thank You for Shopping!'));
    sb.writeln(center('Powered by Gemini Food B2B'));

    return sb.toString();
  }

  /// Builds raw ESC/POS Command byte array for direct Bluetooth/Network socket transmission
  List<int> buildEscPosBytes(Map<String, dynamic> invoiceData) {
    List<int> bytes = [];

    // 1. Initialize ESC/POS (ESC @)
    bytes.addAll([0x1B, 0x40]);

    // 2. Select alignment center (ESC a 1)
    bytes.addAll([0x1B, 0x61, 0x01]);

    // 3. Double Height & Width for Header (GS ! 0x11)
    bytes.addAll([0x1D, 0x21, 0x11]);
    bytes.addAll(utf8.encode("GEMINI FOODS\n"));

    // 4. Reset character size (GS ! 0x00)
    bytes.addAll([0x1D, 0x21, 0x00]);
    bytes.addAll(utf8.encode("Commercial Bakeries Field Distribution\n"));
    bytes.addAll(utf8.encode("GSTIN: 33AAACG1234F1Z5 | Support: +91 44 2623 8899\n"));
    bytes.addAll(utf8.encode("--------------------------------\n"));

    // 5. Left align (ESC a 0)
    bytes.addAll([0x1B, 0x61, 0x00]);

    final String textReceipt = generateTextReceiptPreview(invoiceData);
    bytes.addAll(utf8.encode(textReceipt));

    // 6. Feed 3 lines & Paper Cut (GS V 66 0)
    bytes.addAll([0x1B, 0x64, 0x03]);
    bytes.addAll([0x1D, 0x56, 0x42, 0x00]);

    return bytes;
  }

  /// Send ESC/POS payload to connected thermal printer
  Future<bool> printInvoiceReceipt(Map<String, dynamic> invoiceData) async {
    if (_connectedPrinter == null) {
      throw Exception("No ESC/POS Thermal Printer connected. Please connect a Bluetooth or Network printer.");
    }

    // Generate payload
    final bytes = buildEscPosBytes(invoiceData);
    
    // Simulate transmitting byte buffer (bytes length: ${bytes.length}) over Bluetooth SPP or TCP Socket
    if (bytes.isEmpty) {
      throw Exception("Failed to generate ESC/POS command byte buffer.");
    }
    await Future.delayed(const Duration(milliseconds: 1200));

    return true;
  }
}
