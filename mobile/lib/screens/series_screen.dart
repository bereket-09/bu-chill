import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/movies_service.dart';
import '../theme/app_colors.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/movie_tray.dart';

class SeriesScreen extends StatefulWidget {
  final VoidCallback? onNavigateToDiscover;

  const SeriesScreen({super.key, this.onNavigateToDiscover});

  @override
  State<SeriesScreen> createState() => _SeriesScreenState();
}

class _SeriesScreenState extends State<SeriesScreen> {
  final MoviesService _moviesService = MoviesService();

  List<Movie> _trendingTv = [];
  List<Movie> _popularTv = [];
  List<Movie> _topRatedTv = [];
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
        _moviesService.fetchTrendingTv(),
        _moviesService.fetchPopularTv(),
        _moviesService.fetchTopRatedTv(),
      ]);

      if (mounted) {
        setState(() {
          _trendingTv = results[0];
          _popularTv = results[1];
          _topRatedTv = results[2];
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
      appBar: AppBar(
        backgroundColor: AppColors.background.withOpacity(0.9),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.lightBlue,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'SERIES',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'TV Shows & Drama',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: Colors.white),
            onPressed: widget.onNavigateToDiscover,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.lightBlue,
        backgroundColor: AppColors.card,
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
                ),
              )
            : ListView(
                padding: const EdgeInsets.fromLTRB(0, 0, 0, 100),
                children: [
                  if (_trendingTv.isNotEmpty)
                    HeroCarousel(movies: _trendingTv),
                  const SizedBox(height: 16),
                  MovieTray(
                    title: 'Trending Series This Week',
                    movies: _trendingTv,
                    onSeeAll: widget.onNavigateToDiscover,
                  ),
                  const SizedBox(height: 24),
                  MovieTray(
                    title: 'Binge-Worthy Popular Shows',
                    movies: _popularTv,
                    onSeeAll: widget.onNavigateToDiscover,
                  ),
                  const SizedBox(height: 24),
                  MovieTray(
                    title: 'Critically Acclaimed & Top Rated',
                    movies: _topRatedTv,
                    onSeeAll: widget.onNavigateToDiscover,
                  ),
                ],
              ),
      ),
    );
  }
}
