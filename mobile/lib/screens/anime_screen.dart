import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/movies_service.dart';
import '../theme/app_colors.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/movie_tray.dart';

class AnimeScreen extends StatefulWidget {
  final VoidCallback? onNavigateToDiscover;

  const AnimeScreen({super.key, this.onNavigateToDiscover});

  @override
  State<AnimeScreen> createState() => _AnimeScreenState();
}

class _AnimeScreenState extends State<AnimeScreen> {
  final MoviesService _moviesService = MoviesService();

  List<Movie> _animeList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final anime = await _moviesService.fetchAnime();
      if (mounted) {
        setState(() {
          _animeList = anime;
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
                color: AppColors.gold,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'ANIME',
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
              'Anime Vault',
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
        color: AppColors.gold,
        backgroundColor: AppColors.card,
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                ),
              )
            : ListView(
                padding: const EdgeInsets.fromLTRB(0, 0, 0, 100),
                children: [
                  if (_animeList.isNotEmpty)
                    HeroCarousel(movies: _animeList),
                  const SizedBox(height: 16),
                  MovieTray(
                    title: 'Trending Anime Spotlight',
                    movies: _animeList,
                    onSeeAll: widget.onNavigateToDiscover,
                  ),
                  const SizedBox(height: 24),
                  MovieTray(
                    title: 'Fan-Favorite Masterpieces',
                    movies: _animeList.reversed.toList(),
                    onSeeAll: widget.onNavigateToDiscover,
                  ),
                ],
              ),
      ),
    );
  }
}
