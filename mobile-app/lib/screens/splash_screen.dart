import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'driver_dashboard_screen.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.7, curve: Curves.easeOut),
    );

    _scaleAnimation = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOutBack),
      ),
    );

    _slideAnimation = Tween<double>(begin: 16.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.2, 0.9, curve: Curves.easeOut),
      ),
    );

    _controller.forward();
    _bootstrapAndNavigate();
  }

  /// Bootstrap Application Session with 7-Day Auto Login Persistence
  Future<void> _bootstrapAndNavigate() async {
    final startTime = DateTime.now();

    SharedPreferences? prefs;
    bool isValid7DaySession = false;

    try {
      prefs = await SharedPreferences.getInstance();
      await ApiService.initialize(prefs);

      // Check 7-Day Persistent Auto Login
      final cachedProfile = prefs.getString('cached_driver_profile');
      final loginTimestamp = prefs.getInt('login_timestamp') ?? 0;

      if (cachedProfile != null && loginTimestamp > 0) {
        final loginDate = DateTime.fromMillisecondsSinceEpoch(loginTimestamp);
        final daysDiff = DateTime.now().difference(loginDate).inDays;
        
        // Auto-login allowed for up to 7 days
        if (daysDiff < 7) {
          isValid7DaySession = true;
        } else {
          // 7 Days expired -> Clear expired session
          await prefs.remove('cached_driver_profile');
          await prefs.remove('login_timestamp');
        }
      }
    } catch (e) {
      debugPrint('Startup session init error: $e');
    }

    // Ensure splash remains visible smoothly for 1.3s
    final elapsed = DateTime.now().difference(startTime).inMilliseconds;
    final remaining = 1300 - elapsed;
    if (remaining > 0) {
      await Future.delayed(Duration(milliseconds: remaining));
    }

    if (!mounted) return;

    // Smooth Page Transition to target screen
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            isValid7DaySession ? const DriverDashboardScreen() : const LoginScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 350),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D47A1), // Logo Royal Blue Theme
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF0B2545), // Deep Navy Royal Blue
              Color(0xFF0D47A1), // Gemini Logo Royal Blue
              Color(0xFF1565C0), // Rich Sapphire Blue
              Color(0xFF1E3A8A), // Ocean Blue
            ],
            stops: [0.0, 0.4, 0.75, 1.0],
          ),
        ),
        child: Stack(
          children: [
            // Decorative background glowing elements
            Positioned(
              top: -60,
              right: -60,
              child: Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
              ),
            ),
            Positioned(
              bottom: -80,
              left: -80,
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF38BDF8).withValues(alpha: 0.08),
                ),
              ),
            ),

            // Main Brand Center Content (Aligned with Login Screen)
            Center(
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return FadeTransition(
                    opacity: _fadeAnimation,
                    child: Transform.scale(
                      scale: _scaleAnimation.value,
                      child: Transform.translate(
                        offset: Offset(0, _slideAnimation.value),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Glassmorphic Glowing Logo Container
                            Container(
                              width: 110,
                              height: 110,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(28),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.9),
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.25),
                                    blurRadius: 24,
                                    offset: const Offset(0, 10),
                                  ),
                                  BoxShadow(
                                    color: const Color(0xFF38BDF8).withValues(alpha: 0.4),
                                    blurRadius: 28,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(18),
                                child: Image.asset(
                                  'assets/logo.jfif',
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) => const Icon(
                                    Icons.bakery_dining_rounded,
                                    size: 56,
                                    color: Color(0xFF0D47A1),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Brand Name: GEMINI FOODS
                            Text(
                              'GEMINI FOODS',
                              style: GoogleFonts.outfit(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 2.2,
                                shadows: [
                                  Shadow(
                                    color: Colors.black.withValues(alpha: 0.3),
                                    offset: const Offset(0, 2),
                                    blurRadius: 6,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),

                            // Subtitle Pill: BREAD & BAKERY DISTRIBUTION
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                              ),
                              child: const Text(
                                'Enterprise Driver & Field Executive Portal',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),

                            const Text(
                              'Fast Route Delivery & Sales Execution',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),

                            const SizedBox(height: 36),

                            // Circular Progress Indicator
                            const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
