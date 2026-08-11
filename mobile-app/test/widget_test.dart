import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bread_erp_mobile/core/theme.dart';

void main() {
  testWidgets('Smoke test verifying AppTheme and MaterialApp render cleanly', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const Scaffold(
          body: Center(child: Text('Bread ERP Mobile Test')),
        ),
      ),
    );
    expect(find.text('Bread ERP Mobile Test'), findsOneWidget);
  });
}
