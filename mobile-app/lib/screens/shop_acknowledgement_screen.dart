import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:signature/signature.dart';
import '../../core/theme.dart';
import '../../providers/delivery_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_svg_icons.dart';

class ShopAcknowledgementScreen extends StatefulWidget {
  final DeliveryShopModel shop;

  const ShopAcknowledgementScreen({super.key, required this.shop});

  @override
  State<ShopAcknowledgementScreen> createState() => _ShopAcknowledgementScreenState();
}

class _ShopAcknowledgementScreenState extends State<ShopAcknowledgementScreen> {
  late final SignatureController _signatureController;
  final ImagePicker _picker = ImagePicker();
  
  File? _capturedPodImage;
  String? _uploadedPhotoUrl;
  bool _isUploadingPhoto = false;

  @override
  void initState() {
    super.initState();
    _signatureController = SignatureController(
      penStrokeWidth: 3.5,
      penColor: AppTheme.reactIndigo,
      exportBackgroundColor: Colors.white,
      onDrawStart: () {
        if (mounted) setState(() {});
      },
      onDrawEnd: () {
        if (mounted) setState(() {});
      },
    );
  }

  @override
  void dispose() {
    _signatureController.dispose();
    super.dispose();
  }

  /// Captures photo using Camera, saves to dedicated `/pod/` local directory & uploads to Cloudinary
  Future<void> _captureOutletPhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1200,
        maxHeight: 1200,
      );

      if (photo != null) {
        // 1. Create dedicated local POD storage folder
        final appDir = await getApplicationDocumentsDirectory();
        final podDirectory = Directory('${appDir.path}/pod');
        if (!await podDirectory.exists()) {
          await podDirectory.create(recursive: true);
        }

        // 2. Save captured image in local POD folder
        final fileName = 'pod_shop_${widget.shop.shopId}_${DateTime.now().millisecondsSinceEpoch}.jpg';
        final savedImage = await File(photo.path).copy('${podDirectory.path}/$fileName');

        setState(() {
          _capturedPodImage = savedImage;
          _isUploadingPhoto = true;
        });

        // 3. Upload to Cloudinary folder bread_erp/pod via backend API
        final imageBytes = await savedImage.readAsBytes();
        final cloudUrl = await ApiService().uploadPodProofImage(imageBytes, fileName);

        if (mounted) {
          setState(() {
            _uploadedPhotoUrl = cloudUrl;
            _isUploadingPhoto = false;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                cloudUrl != null && cloudUrl.isNotEmpty
                    ? 'Photo saved to local POD folder & uploaded to Cloudinary!'
                    : 'Photo saved to local POD folder: ${savedImage.path}',
              ),
              backgroundColor: AppTheme.emeraldGreen,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploadingPhoto = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Camera capture notice: $e'), backgroundColor: AppTheme.amberAccent),
        );
      }
    }
  }

  void _submitAcknowledgement() async {
    if (_signatureController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please capture shop owner signature before submitting POD.')),
      );
      return;
    }

    final provider = Provider.of<DeliveryProvider>(context, listen: false);
    final trip = provider.activeTrip;
    final totalQty = trip?.items.fold(0, (sum, i) => sum + i.loadedQuantity) ?? 0;

    await provider.recordDeliveryAcknowledgement(
      shop: widget.shop,
      acceptedQty: totalQty,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const AppSvgIcon(svgString: AppSvgIcons.checkCircle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text('Proof of Delivery (POD) confirmed for ${widget.shop.shopName}!'),
            ],
          ),
          backgroundColor: AppTheme.emeraldGreen,
        ),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);
    final trip = provider.activeTrip;
    final isSigned = _signatureController.isNotEmpty;

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    return Scaffold(
      appBar: AppBar(
        title: Text('POD - ${widget.shop.shopName}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Shop Details Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.accentSky.withValues(alpha: 0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.asset(
                              'assets/logo.jfif',
                              height: 22,
                              width: 22,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            widget.shop.shopCode,
                            style: TextStyle(
                              color: isDark ? AppTheme.reactCyan : AppTheme.snowActive,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: widget.shop.deliveryStatus == 'DELIVERED'
                              ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                              : AppTheme.amberAccent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          widget.shop.deliveryStatus,
                          style: TextStyle(
                            color: widget.shop.deliveryStatus == 'DELIVERED' ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.shop.shopName,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: textColor),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Owner: ${widget.shop.ownerName} • Contact: ${widget.shop.phone}',
                    style: TextStyle(color: mutedColor, fontSize: 13),
                  ),
                  Text(
                    'Address: ${widget.shop.address}',
                    style: TextStyle(color: mutedColor, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ─── POD Camera Photo Proof Capture Section ────────────────────────
            Text(
              'Outlet Camera Photo Proof',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  if (_capturedPodImage != null) ...[
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            _capturedPodImage!,
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        if (_isUploadingPhoto)
                          Positioned.fill(
                            child: Container(
                              color: Colors.black.withValues(alpha: 0.5),
                              child: const Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    CircularProgressIndicator(color: AppTheme.reactCyan),
                                    SizedBox(height: 8),
                                    Text(
                                      'Uploading to Cloudinary (bread_erp/pod)...',
                                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        if (_uploadedPhotoUrl != null)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.emeraldGreen,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.cloud_done_rounded, color: Colors.white, size: 14),
                                  SizedBox(width: 4),
                                  Text(
                                    'Cloudinary Synced',
                                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isUploadingPhoto ? null : _captureOutletPhoto,
                          icon: const Icon(Icons.camera_alt_rounded, size: 18),
                          label: Text(_capturedPodImage == null ? 'Take Outlet Photo Proof' : 'Retake Camera Photo'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.reactIndigo,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            Text(
              'Delivered Items Verification',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 12),

            if (trip != null)
              ...trip.items.map((item) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.productName,
                                  style: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 14),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Dispatched Qty: ${item.loadedQuantity} Packs',
                                  style: TextStyle(color: mutedColor, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.emeraldGreen),
                            ),
                            child: const Row(
                              children: [
                                AppSvgIcon(svgString: AppSvgIcons.checkCircle, size: 14, color: AppTheme.emeraldGreen),
                                SizedBox(width: 4),
                                Text(
                                  'Verified',
                                  style: TextStyle(color: AppTheme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),
                  )),

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Shop Owner Live Signature Canvas',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textColor),
                ),
                if (isSigned)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        AppSvgIcon(svgString: AppSvgIcons.podSignature, size: 14, color: AppTheme.emeraldGreen),
                        SizedBox(width: 4),
                        Text(
                          'Signature Drawn',
                          style: TextStyle(color: AppTheme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // Live Interactive Touch Canvas Box
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF020617) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSigned ? AppTheme.emeraldGreen : borderColor,
                  width: isSigned ? 2 : 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    Signature(
                      controller: _signatureController,
                      height: 200,
                      backgroundColor: isDark ? const Color(0xFF020617) : Colors.white,
                    ),
                    if (!isSigned)
                      IgnorePointer(
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              AppSvgIcon(svgString: AppSvgIcons.podSignature, color: mutedColor, size: 40),
                              const SizedBox(height: 8),
                              Text(
                                'Shop Owner: Sign Here on Live Canvas',
                                style: TextStyle(color: mutedColor, fontSize: 13, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                OutlinedButton.icon(
                  onPressed: isSigned
                      ? () {
                          _signatureController.clear();
                          setState(() {});
                        }
                      : null,
                  icon: const Icon(Icons.clear, size: 18),
                  label: const Text('Clear Canvas'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.roseError,
                    side: BorderSide(color: borderColor),
                  ),
                ),
                Text(
                  isSigned ? 'Stroke Recorded ✓' : 'Touch screen to sign',
                  style: TextStyle(
                    color: isSigned ? AppTheme.emeraldGreen : mutedColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: isSigned ? _submitAcknowledgement : null,
              icon: const AppSvgIcon(svgString: AppSvgIcons.podSignature, size: 20, color: Colors.white),
              label: const Text('Confirm Delivery & Sign POD', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? AppTheme.reactIndigo : AppTheme.snowActive,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
