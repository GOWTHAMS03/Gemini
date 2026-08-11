import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // React Dashboard - Snow White Minimalist Theme Tokens
  static const Color snowBg = Color(0xFFF7F9FB);
  static const Color snowCard = Color(0xFFFFFFFF);
  static const Color snowSidebar = Color(0xFFFFFFFF);
  static const Color snowText = Color(0xFF1C1C1C);
  static const Color snowMuted = Color(0xFF8C8C8C);
  static const Color snowBorder = Color(0xFFE8ECEF);
  static const Color snowHover = Color(0xFFF4F5F7);
  static const Color snowActive = Color(0xFF1C1C1C);

  // Soft Metric Pastel Tint Backgrounds (Used in React Dashboard Cards)
  static const Color metricViolet = Color(0xFFE5ECF6);
  static const Color metricBlue = Color(0xFFE3F5FF);
  static const Color metricPurple = Color(0xFFF3E8FF);
  static const Color metricSky = Color(0xFFE5F2FE);
  static const Color metricEmerald = Color(0xFFE6F9F3);
  static const Color metricRose = Color(0xFFFEE2E2);

  // Accent & Brand Colors
  static const Color accentMint = Color(0xFF4CD7B6);
  static const Color accentSky = Color(0xFF80C3FF);
  static const Color accentLavender = Color(0xFFB497E7);
  static const Color accentDark = Color(0xFF1C1C1C);
  static const Color accentGreen = Color(0xFF7CD992);
  static const Color accentBlue = Color(0xFF80B3FF);

  // Status & Utility Colors
  static const Color emeraldGreen = Color(0xFF10B981);
  static const Color amberAccent = Color(0xFFF59E0B);
  static const Color roseError = Color(0xFFF43F5E);
  static const Color reactIndigo = Color(0xFF6366F1);
  static const Color reactCyan = Color(0xFF38BDF8);

  // Dark Theme Palette Tokens (Matching React App Dark Mode)
  static const Color slateBg = Color(0xFF0F172A);      // Slate 900
  static const Color slateSurface = Color(0xFF1E293B); // Slate 800
  static const Color slateBorder = Color(0xFF334155);  // Slate 700
  static const Color slateMuted = Color(0xFF94A3B8);   // Slate 400

  /// Light Theme matching the default React Admin Dashboard
  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: snowBg,
    primaryColor: snowActive,
    colorScheme: const ColorScheme.light(
      primary: snowActive,
      secondary: reactIndigo,
      surface: snowCard,
      error: roseError,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: snowText,
    ),
    textTheme: GoogleFonts.plusJakartaSansTextTheme(
      ThemeData.light().textTheme.apply(
        bodyColor: snowText,
        displayColor: snowText,
      ),
    ),
    cardTheme: CardThemeData(
      color: snowCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: snowBorder, width: 1),
      ),
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: 0.04),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: snowCard,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      iconTheme: const IconThemeData(color: snowText),
      titleTextStyle: GoogleFonts.plusJakartaSans(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: snowText,
        letterSpacing: -0.2,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: snowCard,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: snowBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: snowBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: snowActive, width: 1.5),
      ),
      hintStyle: GoogleFonts.plusJakartaSans(color: snowMuted),
      labelStyle: GoogleFonts.plusJakartaSans(color: snowText),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: snowActive,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          fontSize: 15,
        ),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: snowHover,
      disabledColor: snowBg,
      selectedColor: snowActive,
      secondarySelectedColor: reactIndigo,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      labelStyle: GoogleFonts.plusJakartaSans(
        color: snowText,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: snowBorder),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: snowBorder,
      thickness: 1,
      space: 1,
    ),
  );

  /// Dark Theme matching the React Admin Dashboard dark mode
  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: slateBg,
    primaryColor: reactCyan,
    colorScheme: const ColorScheme.dark(
      primary: reactCyan,
      secondary: reactIndigo,
      surface: slateSurface,
      error: roseError,
      onPrimary: Colors.black,
      onSecondary: Colors.white,
      onSurface: Colors.white,
    ),
    textTheme: GoogleFonts.plusJakartaSansTextTheme(
      ThemeData.dark().textTheme,
    ),
    cardTheme: CardThemeData(
      color: slateSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: slateBorder, width: 1),
      ),
      elevation: 2,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: slateBg,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      iconTheme: const IconThemeData(color: Colors.white),
      titleTextStyle: GoogleFonts.plusJakartaSans(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Colors.white,
        letterSpacing: -0.2,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: slateSurface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: slateBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: slateBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: reactCyan, width: 1.5),
      ),
      hintStyle: GoogleFonts.plusJakartaSans(color: slateMuted),
      labelStyle: GoogleFonts.plusJakartaSans(color: const Color(0xFFCBD5E1)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: reactIndigo,
        foregroundColor: Colors.white,
        elevation: 2,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          fontSize: 15,
        ),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: slateSurface,
      disabledColor: slateBg,
      selectedColor: reactIndigo,
      secondarySelectedColor: reactCyan,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      labelStyle: GoogleFonts.plusJakartaSans(
        color: Colors.white,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: slateBorder),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: slateBorder,
      thickness: 1,
      space: 1,
    ),
  );
}
