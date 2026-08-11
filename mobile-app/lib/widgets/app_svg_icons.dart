import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// High Precision SVG Icon Library for Bread ERP Mobile App
/// Matches Lucide / React Admin Dashboard modern iconography aesthetics
class AppSvgIcon extends StatelessWidget {
  final String svgString;
  final double size;
  final Color? color;

  const AppSvgIcon({
    super.key,
    required this.svgString,
    this.size = 20,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? Theme.of(context).colorScheme.primary;
    return SvgPicture.string(
      svgString,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(effectiveColor, BlendMode.srcIn),
    );
  }
}

/// Dynamic Animated Driving Truck Icon Widget
/// Features vertical suspension bounce, engine rumble tilt, and scrolling road motion lines
class AnimatedDrivingTruck extends StatefulWidget {
  final double size;
  final Color? color;
  final bool showRoad;

  const AnimatedDrivingTruck({
    super.key,
    this.size = 28,
    this.color,
    this.showRoad = true,
  });

  @override
  State<AnimatedDrivingTruck> createState() => _AnimatedDrivingTruckState();
}

class _AnimatedDrivingTruckState extends State<AnimatedDrivingTruck> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final effectiveColor = widget.color ?? Theme.of(context).colorScheme.primary;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final progress = _controller.value;
        final bounceOffset = math.sin(progress * math.pi * 2) * 1.5;
        final tiltAngle = math.sin(progress * math.pi * 4) * 0.02;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Transform.translate(
              offset: Offset(0, bounceOffset),
              child: Transform.rotate(
                angle: tiltAngle,
                child: AppSvgIcon(
                  svgString: AppSvgIcons.truck,
                  size: widget.size,
                  color: effectiveColor,
                ),
              ),
            ),
            if (widget.showRoad) ...[
              const SizedBox(height: 2),
              ClipRect(
                child: SizedBox(
                  width: widget.size * 1.2,
                  height: 3,
                  child: Stack(
                    children: [
                      Positioned(
                        left: -((progress * 24) % 12),
                        child: Row(
                          children: List.generate(
                            6,
                            (index) => Container(
                              margin: const EdgeInsets.only(right: 6),
                              width: 6,
                              height: 2,
                              decoration: BoxDecoration(
                                color: effectiveColor.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(1),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}

/// 1. Heartbeat Pulsing Scale Vector SVG Icon Widget (Status / Alerts / Checkmarks)
class AnimatedPulseIcon extends StatefulWidget {
  final String svgString;
  final double size;
  final Color? color;
  final double minScale;
  final double maxScale;

  const AnimatedPulseIcon({
    super.key,
    required this.svgString,
    this.size = 20,
    this.color,
    this.minScale = 0.9,
    this.maxScale = 1.15,
  });

  @override
  State<AnimatedPulseIcon> createState() => _AnimatedPulseIconState();
}

class _AnimatedPulseIconState extends State<AnimatedPulseIcon> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _scaleAnim = Tween<double>(begin: widget.minScale, end: widget.maxScale).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnim,
      child: AppSvgIcon(
        svgString: widget.svgString,
        size: widget.size,
        color: widget.color,
      ),
    );
  }
}

/// 3. Spring Bounce Up/Down Vector SVG Icon Widget (Actions / Sales / Cash)
class AnimatedBounceIcon extends StatefulWidget {
  final String svgString;
  final double size;
  final Color? color;
  final double bounceHeight;

  const AnimatedBounceIcon({
    super.key,
    required this.svgString,
    this.size = 20,
    this.color,
    this.bounceHeight = 3.0,
  });

  @override
  State<AnimatedBounceIcon> createState() => _AnimatedBounceIconState();
}

class _AnimatedBounceIconState extends State<AnimatedBounceIcon> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final offset = math.sin(_controller.value * math.pi) * widget.bounceHeight;
        return Transform.translate(
          offset: Offset(0, -offset),
          child: AppSvgIcon(
            svgString: widget.svgString,
            size: widget.size,
            color: widget.color,
          ),
        );
      },
    );
  }
}

class AppSvgIcons {
  // 1. Bakery Logo Header Icon
  static const String bakeryLogo = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z"/>
  <line x1="6" y1="17" x2="18" y2="17"/>
  <line x1="10" y1="9.5" x2="10" y2="13.5"/>
  <line x1="14" y1="9.5" x2="14" y2="13.5"/>
</svg>
''';

  // 2. Delivery Truck Icon (Lucide Truck)
  static const String truck = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="1" y="3" width="15" height="13" rx="2"/>
  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
  <circle cx="5.5" cy="18.5" r="2.5"/>
  <circle cx="18.5" cy="18.5" r="2.5"/>
</svg>
''';

  // 0. Hamburger Menu Navigation Icon
  static const String hamburgerMenu = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="4" x2="20" y1="6" y2="6"/>
  <line x1="4" x2="16" y1="12" y2="12"/>
  <line x1="4" x2="20" y1="18" y2="18"/>
</svg>
''';

  // 3. Storefront / Shop Outlet Icon (Modern Clean Storefront)
  static const String store = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
</svg>
''';

  // 4. Spot Sale / Shopping Cart Plus Icon
  static const String spotSale = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="9" cy="21" r="1"/>
  <circle cx="20" cy="21" r="1"/>
  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  <line x1="12" y1="9" x2="18" y2="9"/>
  <line x1="15" y1="6" x2="15" y2="12"/>
</svg>
''';

  // 5. Digital POD Signature Icon (Lucide Signature / Pen Tool)
  static const String podSignature = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m18 16 2.414-.805a2 2 0 0 0 1.259-1.259L22 11.53V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12"/>
  <path d="M6 14s1.5-2 3.5-2 2.5 2 4.5 2 3-1 3-1"/>
  <path d="M18 22l4-4"/>
  <path d="M15 15l6-6"/>
</svg>
''';

  // 6. UPI QR Code Icon
  static const String upiQr = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="7" rx="1"/>
  <rect x="14" y="3" width="7" height="7" rx="1"/>
  <rect x="3" y="14" width="7" height="7" rx="1"/>
  <path d="M14 14h3v3h-3z"/>
  <path d="M18 18h3v3h-3z"/>
  <path d="M18 14h3"/>
  <path d="M14 18v3"/>
</svg>
''';

  // 7. Lock / Actual Price Icon
  static const String lockActual = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>
''';

  // 8. Edit / Selling Price Tag Icon
  static const String editSelling = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20h9"/>
  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
</svg>
''';

  // 9. Truck Inventory / Boxes Icon (Lucide Boxes)
  static const String inventoryBoxes = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  <line x1="12" y1="22.08" x2="12" y2="12"/>
</svg>
''';

  // 10. EOD Settlement / Closing Icon (Lucide FileText)
  static const String eodClosing = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
  <polyline points="10 9 9 9 8 9"/>
</svg>
''';

  // 11. Sync Refresh Icon
  static const String sync = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21.5 2v6h-6"/>
  <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
</svg>
''';

  // 12. Cash Collection / Payments Icon (Lucide DollarSign)
  static const String cash = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="5" width="20" height="14" rx="2"/>
  <line x1="2" y1="10" x2="22" y2="10"/>
</svg>
''';

  // 13. Driver Person Profile Icon
  static const String driverPerson = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>
''';

  // 14. Sign Out / Logout Icon
  static const String logout = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</svg>
''';

  // 15. Swipe Right Gesture Icon
  static const String swipeRight = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="9 18 15 12 9 6"/>
</svg>
''';

  // 16. Swipe Left Gesture Icon
  static const String swipeLeft = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="15 18 9 12 15 6"/>
</svg>
''';

  // 17. Check Circle Success Icon
  static const String checkCircle = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
  <polyline points="22 4 12 14.01 9 11.01"/>
</svg>
''';

  // 18. Information Info Circle Icon
  static const String info = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" y1="16" x2="12" y2="12"/>
  <line x1="12" y1="8" x2="12.01" y2="8"/>
</svg>
''';

  // 19. Premium Onboard New Shop Icon (Crisp Store Building with Plus Badge)
  static const String onboardShop = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 10h20"/>
  <path d="m2 7 4-4h12l4 4"/>
  <path d="M4 10v11h16V10"/>
  <path d="M9 21v-6h6v6"/>
  <circle cx="18" cy="5" r="3.5"/>
  <line x1="18" y1="3.5" x2="18" y2="6.5"/>
  <line x1="16.5" y1="5" x2="19.5" y2="5"/>
</svg>
''';

  // 20. Map Pin Location Icon
  static const String mapPin = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
  <circle cx="12" cy="10" r="3"/>
</svg>
''';

  // 21. Phone Call Icon
  static const String phone = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
</svg>
''';

  // 22. GSTIN Tax Document Icon
  static const String gstinDocument = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
  <line x1="10" y1="9" x2="8" y2="9"/>
</svg>
''';

  // 23. Category Tag Icon
  static const String categoryTag = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2H2v10l11.29 11.29a1 1 0 0 0 1.41 0l7.58-7.58a1 1 0 0 0 0-1.41L12 2z"/>
  <circle cx="7" cy="7" r="1.5"/>
</svg>
''';

  // 24. Location City / Building Landmark Icon
  static const String locationCity = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
  <line x1="9" y1="6" x2="9.01" y2="6"/>
  <line x1="15" y1="6" x2="15.01" y2="6"/>
  <line x1="9" y1="10" x2="9.01" y2="10"/>
  <line x1="15" y1="10" x2="15.01" y2="10"/>
  <line x1="9" y1="14" x2="9.01" y2="14"/>
  <line x1="15" y1="14" x2="15.01" y2="14"/>
  <path d="M10 22v-4h4v4"/>
</svg>
''';

  // 25. Route Path / Alt Route Icon
  static const String routePath = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="6" cy="19" r="3"/>
  <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
  <circle cx="18" cy="5" r="3"/>
</svg>
''';

  // 26. GPS Target Crosshair Icon
  static const String gpsTarget = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="22" y1="12" x2="18" y2="12"/>
  <line x1="6" y1="12" x2="2" y2="12"/>
  <line x1="12" y1="6" x2="12" y2="2"/>
  <line x1="12" y1="22" x2="12" y2="18"/>
</svg>
''';

  // 27. My Location Navigation Arrow Icon
  static const String myLocation = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
</svg>
''';

  // 28. Arrow Forward Right Icon
  static const String arrowForward = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="5" y1="12" x2="19" y2="12"/>
  <polyline points="12 5 19 12 12 19"/>
</svg>
''';

  // 29. Arrow Back Left Icon
  static const String arrowBack = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="19" y1="12" x2="5" y2="12"/>
  <polyline points="12 19 5 12 12 5"/>
</svg>
''';

  // 30. Shop Returns & Replacements Icon
  static const String returnBoxes = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="9 14 4 9 9 4"/>
  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
  <rect x="2" y="14" width="6" height="6" rx="1"/>
</svg>
''';
}
