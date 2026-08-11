import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'app_svg_icons.dart';

class AppBreadcrumbs extends StatelessWidget {
  final String currentItem;
  final String parentItem;
  final String? parentSvgIcon;
  final String? currentSvgIcon;

  const AppBreadcrumbs({
    super.key,
    required this.currentItem,
    this.parentItem = 'Route Overview',
    this.parentSvgIcon = AppSvgIcons.truck,
    this.currentSvgIcon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.slateSurface : AppTheme.snowHover,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              AppSvgIcon(
                svgString: parentSvgIcon ?? AppSvgIcons.truck,
                size: 14,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 6),
              Text(
                parentItem,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: mutedColor,
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
          Icon(
            Icons.chevron_right,
            size: 14,
            color: mutedColor,
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.slateBg : Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              children: [
                if (currentSvgIcon != null) ...[
                  AppSvgIcon(
                    svgString: currentSvgIcon!,
                    size: 13,
                    color: AppTheme.reactIndigo,
                  ),
                  const SizedBox(width: 6),
                ],
                Text(
                  currentItem,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
