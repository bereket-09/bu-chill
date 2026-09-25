import 'package:flutter/material.dart';
import '../models/sports_match.dart';
import '../models/live_channel.dart';
import '../services/sports_service.dart';
import '../services/live_tv_service.dart';
import '../theme/app_colors.dart';
import '../widgets/sports_match_card.dart';
import '../widgets/live_channel_card.dart';

class SportsScreen extends StatefulWidget {
  const SportsScreen({super.key});

  @override
  State<SportsScreen> createState() => _SportsScreenState();
}

class _SportsScreenState extends State<SportsScreen> {
  final SportsService _sportsService = SportsService();
  final LiveTvService _liveTvService = LiveTvService();

  List<SportsMatch> _matches = [];
  List<LiveChannel> _sportsChannels = [];
  String _selectedFilter = 'All';
  bool _isLoading = true;

  final List<String> _filters = ['All', 'Live Now', 'Football', 'Basketball', 'Motorsport', '24/7 Channels'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final matchesFuture = _sportsService.fetchMatches(type: 'all');
      final channelsFuture = _liveTvService.fetchChannels();

      final results = await Future.wait([matchesFuture, channelsFuture]);
      final matches = results[0] as List<SportsMatch>;
      final channels = results[1] as List<LiveChannel>;

      final sportsOnly = channels
          .where((ch) => ch.group.toLowerCase().contains('sport') || ch.name.toLowerCase().contains('sport'))
          .take(20)
          .toList();

      if (mounted) {
        setState(() {
          _matches = matches;
          _sportsChannels = sportsOnly;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<SportsMatch> get _filteredMatches {
    if (_selectedFilter == 'All') return _matches;
    if (_selectedFilter == 'Live Now') return _matches.where((m) => m.isLive).toList();
    if (_selectedFilter == 'Football') return _matches.where((m) => m.category.toLowerCase().contains('foot') || m.category.toLowerCase().contains('socc')).toList();
    if (_selectedFilter == 'Basketball') return _matches.where((m) => m.category.toLowerCase().contains('basket')).toList();
    if (_selectedFilter == 'Motorsport') return _matches.where((m) => m.category.toLowerCase().contains('motor') || m.category.toLowerCase().contains('f1')).toList();
    return _matches;
  }

  @override
  Widget build(BuildContext context) {
    final liveMatches = _matches.where((m) => m.isLive).toList();
    final upcomingMatches = _filteredMatches.where((m) => !m.isLive).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundDark,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.liveRed,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'LIVE',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Sports Hub',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primaryRed,
        backgroundColor: AppColors.card,
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryRed),
                ),
              )
            : CustomScrollView(
                slivers: [
                  // Filter Chips
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 44,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: _filters.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final filter = _filters[index];
                          final isSelected = filter == _selectedFilter;

                          return ChoiceChip(
                            label: Text(filter),
                            selected: isSelected,
                            selectedColor: AppColors.primaryRed,
                            backgroundColor: AppColors.surface,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : AppColors.textMuted,
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: BorderSide(
                                color: isSelected
                                    ? AppColors.primaryRed
                                    : Colors.white.withOpacity(0.06),
                              ),
                            ),
                            onSelected: (_) {
                              setState(() {
                                _selectedFilter = filter;
                              });
                            },
                          );
                        },
                      ),
                    ),
                  ),

                  const SliverToBoxAdapter(child: SizedBox(height: 16)),

                  // 24/7 Channels Section if filter is 'All' or '24/7 Channels'
                  if ((_selectedFilter == 'All' || _selectedFilter == '24/7 Channels') && _sportsChannels.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Container(
                              width: 3.5,
                              height: 16,
                              decoration: BoxDecoration(
                                color: AppColors.gold,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              '24/7 Live Sports Channels',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 12)),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 130,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          itemCount: _sportsChannels.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            return SizedBox(
                              width: 140,
                              child: LiveChannelCard(channel: _sportsChannels[index]),
                            );
                          },
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 24)),
                  ],

                  // If user selected 24/7 Channels only, we skip match lists
                  if (_selectedFilter != '24/7 Channels') ...[
                    // Live Now Section
                    if (liveMatches.isNotEmpty && (_selectedFilter == 'All' || _selectedFilter == 'Live Now')) ...[
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.liveRed,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Happening Right Now',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SliverToBoxAdapter(child: SizedBox(height: 12)),
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) => SportsMatchCard(match: liveMatches[index]),
                            childCount: liveMatches.length,
                          ),
                        ),
                      ),
                      const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    ],

                    // Upcoming Matches Section
                    if (upcomingMatches.isNotEmpty && _selectedFilter != 'Live Now') ...[
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              Container(
                                width: 3.5,
                                height: 16,
                                decoration: BoxDecoration(
                                  color: AppColors.primaryRed,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Scheduled Fixtures & Upcoming',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SliverToBoxAdapter(child: SizedBox(height: 12)),
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) => SportsMatchCard(match: upcomingMatches[index]),
                            childCount: upcomingMatches.length,
                          ),
                        ),
                      ),
                    ],

                    if (_filteredMatches.isEmpty)
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.sports_soccer_rounded, color: AppColors.textMuted, size: 48),
                              SizedBox(height: 12),
                              Text(
                                'No matches found in this category.',
                                style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],

                  // Bottom padding for nav bar
                  const SliverToBoxAdapter(child: SizedBox(height: 90)),
                ],
              ),
      ),
    );
  }
}
