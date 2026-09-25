import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../models/sports_match.dart';
import '../models/live_channel.dart';
import '../services/movies_service.dart';
import '../services/sports_service.dart';
import '../services/live_tv_service.dart';
import '../theme/app_colors.dart';
import '../widgets/movie_card.dart';
import '../widgets/sports_match_card.dart';
import '../widgets/live_channel_card.dart';
import 'ai_concierge_screen.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final MoviesService _moviesService = MoviesService();
  final SportsService _sportsService = SportsService();
  final LiveTvService _liveTvService = LiveTvService();

  // Search & Movies
  final TextEditingController _searchController = TextEditingController();
  List<Movie> _searchResults = [];
  bool _isSearching = false;
  String _selectedMediaType = 'All';

  // Sports
  List<SportsMatch> _sportsMatches = [];
  bool _isLoadingSports = true;

  // Live TV
  List<LiveChannel> _liveChannels = [];
  bool _isLoadingTv = true;
  String _tvSearch = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadInitialMedia();
    _loadSports();
    _loadLiveTv();
  }

  Future<void> _loadInitialMedia() async {
    setState(() => _isSearching = true);
    final popular = await _moviesService.fetchPopularMovies();
    if (mounted) {
      setState(() {
        _searchResults = popular;
        _isSearching = false;
      });
    }
  }

  Future<void> _loadSports() async {
    setState(() => _isLoadingSports = true);
    final matches = await _sportsService.fetchMatches(type: 'all');
    if (mounted) {
      setState(() {
        _sportsMatches = matches;
        _isLoadingSports = false;
      });
    }
  }

  Future<void> _loadLiveTv() async {
    setState(() => _isLoadingTv = true);
    final channels = await _liveTvService.fetchChannels();
    if (mounted) {
      setState(() {
        _liveChannels = channels;
        _isLoadingTv = false;
      });
    }
  }

  void _onSearch(String query) async {
    if (query.trim().isEmpty) {
      _loadInitialMedia();
      return;
    }
    setState(() => _isSearching = true);
    final results = await _moviesService.searchMedia(query.trim());
    if (mounted) {
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text(
          'Discover & Live Hub',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 18,
            letterSpacing: -0.3,
          ),
        ),
        actions: [
          // AI Assistant Button
          GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AiConciergeScreen()),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.lightBlue, AppColors.gold],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.lightBlue.withOpacity(0.3),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Row(
                children: const [
                  Icon(Icons.auto_awesome_rounded, color: Colors.black, size: 14),
                  SizedBox(width: 4),
                  Text(
                    'AI Concierge',
                    style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.lightBlue,
          indicatorWeight: 3,
          labelColor: AppColors.lightBlue,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Search & Media'),
            Tab(text: '⚽ Live Sports'),
            Tab(text: '📺 Live IPTV'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildSearchAndMediaTab(),
          _buildSportsTab(),
          _buildLiveTvTab(),
        ],
      ),
    );
  }

  Widget _buildSearchAndMediaTab() {
    return Column(
      children: [
        // Search Box
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search movies, TV series, anime, actors...',
                hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.lightBlue),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, color: AppColors.textMuted),
                        onPressed: () {
                          _searchController.clear();
                          _loadInitialMedia();
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: _onSearch,
            ),
          ),
        ),

        // Type Filter Chips
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            children: ['All', 'Movies', 'TV Shows'].map((t) {
              final isSel = t == _selectedMediaType;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(t),
                  selected: isSel,
                  selectedColor: AppColors.lightBlue,
                  backgroundColor: AppColors.card,
                  labelStyle: TextStyle(
                    color: isSel ? Colors.black : AppColors.textLight,
                    fontSize: 11,
                    fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: isSel ? AppColors.lightBlue : AppColors.border),
                  ),
                  onSelected: (_) => setState(() => _selectedMediaType = t),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 8),

        // Results Grid
        Expanded(
          child: _isSearching
              ? const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 14,
                    childAspectRatio: 0.55,
                  ),
                  itemCount: _searchResults.length,
                  itemBuilder: (context, index) {
                    return MovieCard(movie: _searchResults[index], width: double.infinity);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildSportsTab() {
    return _isLoadingSports
        ? const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: _sportsMatches.length,
            itemBuilder: (context, index) {
              return SportsMatchCard(match: _sportsMatches[index]);
            },
          );
  }

  Widget _buildLiveTvTab() {
    final filtered = _liveChannels.where((c) {
      if (_tvSearch.isEmpty) return true;
      return c.name.toLowerCase().contains(_tvSearch.toLowerCase()) ||
          c.group.toLowerCase().contains(_tvSearch.toLowerCase());
    }).toList();

    return _isLoadingTv
        ? const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.emerald),
            ),
          )
        : Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: TextField(
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      hintText: 'Filter 2,900+ live TV channels...',
                      hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
                      prefixIcon: Icon(Icons.tv_rounded, color: AppColors.emerald),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                    onChanged: (val) => setState(() => _tvSearch = val),
                  ),
                ),
              ),
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.3,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    return LiveChannelCard(channel: filtered[index]);
                  },
                ),
              ),
            ],
          );
  }
}
