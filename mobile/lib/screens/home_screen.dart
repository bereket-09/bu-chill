import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/movies_service.dart';
import '../theme/app_colors.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/movie_tray.dart';
import 'ai_concierge_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback? onNavigateToDiscover;

  const HomeScreen({
    super.key,
    this.onNavigateToDiscover,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final MoviesService _moviesService = MoviesService();

  List<Movie> _trendingMovies = [];
  List<Movie> _popularMovies = [];
  List<Movie> _topRatedMovies = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final results = await Future.wait([
        _moviesService.fetchTrendingMovies(),
        _moviesService.fetchPopularMovies(),
        _moviesService.fetchTopRatedMovies(),
      ]);

      if (mounted) {
        setState(() {
          _trendingMovies = results[0];
          _popularMovies = results[1];
          _topRatedMovies = results[2];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.lightBlue,
        backgroundColor: AppColors.card,
        child: CustomScrollView(
          slivers: [
            // Top App Bar with Bu-Chill Light Blue & Gold Brand
            SliverAppBar(
              floating: true,
              pinned: false,
              backgroundColor: AppColors.background.withOpacity(0.9),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.lightBlue, AppColors.gold],
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'BU',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'CHILL',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
              actions: [
                // AI Concierge Button
                IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.lightBlue, AppColors.gold],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.auto_awesome_rounded, color: Colors.black, size: 16),
                  ),
                  tooltip: 'Bu-Chill AI Concierge',
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AiConciergeScreen()),
                    );
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.search_rounded, color: Colors.white),
                  onPressed: widget.onNavigateToDiscover,
                ),
              ],
            ),

            // Content
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildListDelegate([
                  // Hero Carousel
                  if (_trendingMovies.isNotEmpty)
                    HeroCarousel(movies: _trendingMovies),

                  const SizedBox(height: 16),

                  // Trending Movies Tray
                  MovieTray(
                    title: 'Trending Movies',
                    movies: _trendingMovies,
                    onSeeAll: widget.onNavigateToDiscover,
                  ),

                  const SizedBox(height: 24),

                  // Top Rated Movies Tray
                  MovieTray(
                    title: 'Top Rated Blockbusters',
                    movies: _topRatedMovies,
                    onSeeAll: widget.onNavigateToDiscover,
                  ),

                  const SizedBox(height: 24),

                  // Popular Movies Tray
                  MovieTray(
                    title: 'Global Fan Favorites',
                    movies: _popularMovies,
                    onSeeAll: widget.onNavigateToDiscover,
                  ),

                  // Bottom padding for floating navigation bar
                  const SizedBox(height: 100),
                ]),
              ),
          ],
        ),
      ),
    );
  }
}
