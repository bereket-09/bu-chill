import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/glass_bottom_nav.dart';
import 'home_screen.dart';
import 'series_screen.dart';
import 'anime_screen.dart';
import 'discover_screen.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  void _onTabSelected(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Screen Stack preserving states across all 5 premier sections
          IndexedStack(
            index: _currentIndex,
            children: [
              HomeScreen(
                onNavigateToDiscover: () => _onTabSelected(3),
              ),
              SeriesScreen(
                onNavigateToDiscover: () => _onTabSelected(3),
              ),
              AnimeScreen(
                onNavigateToDiscover: () => _onTabSelected(3),
              ),
              const DiscoverScreen(),
              const ProfileScreen(),
            ],
          ),

          // Floating Glass Bottom Navigation Bar
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: GlassBottomNav(
              currentIndex: _currentIndex,
              onTap: _onTabSelected,
            ),
          ),
        ],
      ),
    );
  }
}
