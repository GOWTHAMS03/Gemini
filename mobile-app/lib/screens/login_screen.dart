import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme.dart';
import '../../widgets/app_svg_icons.dart';
import '../providers/delivery_provider.dart';
import '../services/api_service.dart';
import 'driver_dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'gowtham1');
  final _passwordController = TextEditingController(text: 'Gowtham@123');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        final provider = Provider.of<DeliveryProvider>(context, listen: false);
        if (provider.errorMessage != null && provider.errorMessage!.contains("access")) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    provider.errorMessage!,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            backgroundColor: AppTheme.roseError,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(16),
            elevation: 4,
          ),
        );
        provider.clearError();
      }
    } catch (_) {}
    });
  }

  void _handleLogin() async {
    final provider = Provider.of<DeliveryProvider>(context, listen: false);

    final success = await provider.login(
      _usernameController.text.trim(),
      _passwordController.text.trim(),
    );

    if (success && mounted) {
      // Save 7-day persistent auto login timestamp
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('login_timestamp', DateTime.now().millisecondsSinceEpoch);

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const DriverDashboardScreen()),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  provider.errorMessage ?? 'Authentication failed.',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          backgroundColor: AppTheme.roseError,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
          elevation: 4,
        ),
      );
    }
  }

  void _showServerConfigDialog() {
    final currentUrl = ApiService.baseUrl;
    String currentHost = '10.0.2.2';
    try {
      final uri = Uri.parse(currentUrl);
      currentHost = uri.host;
    } catch (_) {}

    final ipController = TextEditingController(text: currentHost);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.settings_ethernet, color: Colors.blue),
            SizedBox(width: 8),
            Text('Server Connection IP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select or enter host machine IP address:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ipController,
              decoration: const InputDecoration(
                labelText: 'Host IP / Hostname',
                hintText: 'e.g. 10.0.2.2 or 192.168.0.109',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('10.0.2.2 (Emulator)'),
                  onPressed: () => ipController.text = '10.0.2.2',
                ),
                ActionChip(
                  label: const Text('192.168.0.109 (Wi-Fi)'),
                  onPressed: () => ipController.text = '192.168.0.109',
                ),
                ActionChip(
                  label: const Text('localhost'),
                  onPressed: () => ipController.text = 'localhost',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              ApiService.setServerIp(ipController.text.trim());
              Navigator.pop(ctx);
              setState(() {});
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Server URL set to: ${ApiService.baseUrl}'),
                  backgroundColor: AppTheme.emeraldGreen,
                ),
              );
            },
            child: const Text('Save & Apply'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;
    final textColor = Theme.of(context).colorScheme.onSurface;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 110,
                    height: 110,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: isDark ? AppTheme.reactCyan.withValues(alpha: 0.4) : const Color(0xFFE2E8F0), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 20,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Image.asset(
                        'assets/logo.jfif',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => AppSvgIcon(svgString: AppSvgIcons.bakeryLogo, size: 56, color: primaryColor),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'GEMINI FOODS',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: textColor, letterSpacing: 2.0),
                ),
                const SizedBox(height: 4),
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.reactIndigo.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text(
                      'Enterprise Driver & Field Executive Portal',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.reactIndigo, letterSpacing: 1.0),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                
                const SizedBox(height: 32),

                TextField(
                  controller: _usernameController,
                  style: TextStyle(color: textColor),
                  decoration: InputDecoration(
                    labelText: 'Username or Executive Code',
                    prefixIcon: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: AppSvgIcon(svgString: AppSvgIcons.driverPerson, size: 20, color: primaryColor),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  style: TextStyle(color: textColor),
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: AppSvgIcon(svgString: AppSvgIcons.lockActual, size: 20, color: primaryColor),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Server state badge & Config button
                InkWell(
                  onTap: _showServerConfigDialog,
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 8.0),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              provider.isOnline ? Icons.cloud_done : Icons.dns,
                              size: 14,
                              color: provider.isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              provider.isOnline ? 'Online Integration Ready' : 'Backend Server Connected',
                              style: TextStyle(
                                fontSize: 12,
                                color: provider.isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.edit, size: 12, color: Colors.grey),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          ApiService.baseUrl,
                          style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                ElevatedButton(
                  onPressed: provider.isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: provider.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          'Sign In to Field Dashboard',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
