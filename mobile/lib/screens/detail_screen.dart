import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../models/movie.dart';
import '../services/movies_service.dart';
import '../services/storage_service.dart';
import '../theme/app_colors.dart';
import '../widgets/movie_tray.dart';
import 'native_player_screen.dart';

class DetailScreen extends StatefulWidget {
  final Movie movie;

  const DetailScreen({
    super.key,
    required this.movie,
  });

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  final MoviesService _moviesService = MoviesService();
  final StorageService _storageService = StorageService();

  Movie? _fullDetails;
  List<Movie> _similarMovies = [];
  List<Map<String, dynamic>> _episodes = [];
  int _selectedSeason = 1;
  int _selectedEpisode = 1;
  bool _isLoadingEpisodes = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final details = await _moviesService.fetchDetails(widget.movie.id, isTv: widget.movie.isTv);
      final similar = await _moviesService.fetchSimilar(widget.movie.id, isTv: widget.movie.isTv);

      if (mounted) {
        setState(() {
          _fullDetails = details ?? widget.movie;
          _similarMovies = similar;
        });

        if (widget.movie.isTv) {
          _loadEpisodes(_selectedSeason);
        }
      }
    } catch (_) {}
  }

  Future<void> _loadEpisodes(int season) async {
    setState(() => _isLoadingEpisodes = true);
    final eps = await _moviesService.fetchEpisodes(widget.movie.id, season);
    if (mounted) {
      setState(() {
        _episodes = eps;
        _selectedSeason = season;
        _isLoadingEpisodes = false;
      });
    }
  }

  void _playMedia({int season = 1, int episode = 1}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => NativePlayerScreen(
          id: widget.movie.id,
          title: widget.movie.title,
          isTv: widget.movie.isTv,
          season: season,
          episode: episode,
        ),
      ),
    );
  }

  void _showTrailerModal(String trailerKey) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.black,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final trailerController = WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..loadRequest(Uri.parse('https://www.youtube-nocookie.com/embed/$trailerKey?autoplay=1'));

        return SafeArea(
          child: SizedBox(
            height: MediaQuery.of(ctx).size.height * 0.45,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Official Trailer',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: Colors.white),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: WebViewWidget(controller: trailerController),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatCurrency(int? amount) {
    if (amount == null || amount <= 0) return 'Undisclosed';
    if (amount >= 1000000000) {
      return '\$${(amount / 1000000000).toStringAsFixed(1)}B';
    } else if (amount >= 1000000) {
      return '\$${(amount / 1000000).toStringAsFixed(1)}M';
    }
    return '\$${amount.toString()}';
  }

  @override
  Widget build(BuildContext context) {
    final movie = _fullDetails ?? widget.movie;
    final isInWatchlist = _storageService.isInWatchlist(movie.id);

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: CustomScrollView(
        slivers: [
          // 1. Collapsible Cinematic Backdrop App Bar
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: AppColors.backgroundDark,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                ),
                child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isInWatchlist ? AppColors.gold : Colors.white.withValues(alpha: 0.15),
                    ),
                  ),
                  child: Icon(
                    isInWatchlist ? Icons.bookmark_added_rounded : Icons.bookmark_add_outlined,
                    color: isInWatchlist ? AppColors.gold : Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: () async {
                  await _storageService.toggleWatchlist(movie);
                  setState(() {});
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: movie.backdropUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: AppColors.surface),
                    errorWidget: (_, __, ___) => CachedNetworkImage(
                      imageUrl: movie.posterUrl,
                      fit: BoxFit.cover,
                    ),
                  ),
                  // Dark Vignette & Brand Gradient
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.4),
                          Colors.transparent,
                          AppColors.backgroundDark.withValues(alpha: 0.85),
                          AppColors.backgroundDark,
                        ],
                        stops: const [0.0, 0.35, 0.8, 1.0],
                      ),
                    ),
                  ),
                  // Trailer Overlay Button on Backdrop
                  if (movie.trailerKey != null)
                    Center(
                      child: GestureDetector(
                        onTap: () => _showTrailerModal(movie.trailerKey!),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.lightBlue.withValues(alpha: 0.8), width: 1.5),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.lightBlue.withValues(alpha: 0.3),
                                blurRadius: 15,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.play_arrow_rounded, color: AppColors.lightBlue, size: 36),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // 2. Main Content Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    movie.title,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),

                  // Tagline
                  if (movie.tagline != null && movie.tagline!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      '"${movie.tagline!}"',
                      style: TextStyle(
                        fontSize: 13,
                        fontStyle: FontStyle.italic,
                        color: AppColors.gold.withValues(alpha: 0.9),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],

                  const SizedBox(height: 12),

                  // Metadata Badges Row (Rating, Year, Duration, 4K, Status)
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      // Star Rating
                      if (movie.voteAverage > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.6),
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded, color: AppColors.gold, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                movie.formattedRating,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Year
                      if (movie.year.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            movie.year,
                            style: const TextStyle(color: AppColors.textLight, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),

                      // Runtime
                      if (movie.formattedRuntime.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.schedule_rounded, color: AppColors.textMuted, size: 12),
                              const SizedBox(width: 4),
                              Text(
                                movie.formattedRuntime,
                                style: const TextStyle(color: AppColors.textLight, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),

                      // Quality Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.lightBlue.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: AppColors.lightBlue.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          movie.isTv ? 'SERIES' : '4K ULTRA HD',
                          style: const TextStyle(
                            color: AppColors.lightBlue,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),

                      // Status Badge
                      if (movie.status != null && movie.status!.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            movie.status!,
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                          ),
                        ),
                    ],
                  ),

                  // Genres Badges
                  if (movie.genres.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: movie.genres.map((g) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                          ),
                          child: Text(
                            g,
                            style: const TextStyle(
                              color: AppColors.textLight,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  const SizedBox(height: 18),

                  // Primary Action Buttons
                  Row(
                    children: [
                      // Watch Now Button
                      Expanded(
                        child: SizedBox(
                          height: 48,
                          child: ElevatedButton.icon(
                            onPressed: () => _playMedia(season: _selectedSeason, episode: _selectedEpisode),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.lightBlue,
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                              elevation: 6,
                              shadowColor: AppColors.lightBlue.withValues(alpha: 0.4),
                            ),
                            icon: const Icon(Icons.play_arrow_rounded, size: 26, color: Colors.black),
                            label: Text(
                              movie.isTv
                                  ? 'Play S$_selectedSeason : Ep $_selectedEpisode'
                                  : 'Watch Movie Now',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.black),
                            ),
                          ),
                        ),
                      ),

                      // Trailer Button
                      if (movie.trailerKey != null) ...[
                        const SizedBox(width: 10),
                        Container(
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.movie_filter_rounded, color: AppColors.lightBlue),
                            tooltip: 'Watch Trailer',
                            onPressed: () => _showTrailerModal(movie.trailerKey!),
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Storyline Section
                  Row(
                    children: [
                      Container(
                        width: 3.5,
                        height: 16,
                        decoration: BoxDecoration(
                          color: AppColors.lightBlue,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Storyline',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    (movie.overview != null && movie.overview!.isNotEmpty)
                        ? movie.overview!
                        : 'No detailed storyline available.',
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.6,
                      color: AppColors.textLight,
                    ),
                  ),

                  // Top Cast Section
                  if (movie.cast.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Row(
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
                          'Top Cast & Crew',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      height: 125,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: movie.cast.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final actor = movie.cast[index];
                          return SizedBox(
                            width: 80,
                            child: Column(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(40),
                                  child: Container(
                                    width: 68,
                                    height: 68,
                                    color: AppColors.surface,
                                    child: CachedNetworkImage(
                                      imageUrl: actor.profileUrl,
                                      fit: BoxFit.cover,
                                      placeholder: (_, __) => Container(color: AppColors.surface),
                                      errorWidget: (_, __, ___) => const Icon(
                                        Icons.person_rounded,
                                        color: AppColors.textMuted,
                                        size: 32,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  actor.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  actor.character,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  // Movie Facts Card
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Container(
                        width: 3.5,
                        height: 16,
                        decoration: BoxDecoration(
                          color: AppColors.lightBlue,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Information & Facts',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        _buildFactRow('Type', movie.isTv ? 'Television Series' : 'Feature Film'),
                        const Divider(color: Colors.white10, height: 16),
                        _buildFactRow('Status', movie.status ?? 'Released'),
                        const Divider(color: Colors.white10, height: 16),
                        _buildFactRow('Original Language', movie.originalLanguage ?? 'English'),
                        if (movie.budget != null && movie.budget! > 0) ...[
                          const Divider(color: Colors.white10, height: 16),
                          _buildFactRow('Budget', _formatCurrency(movie.budget)),
                        ],
                        if (movie.revenue != null && movie.revenue! > 0) ...[
                          const Divider(color: Colors.white10, height: 16),
                          _buildFactRow('Box Office Revenue', _formatCurrency(movie.revenue)),
                        ],
                        if (movie.productionCompanies.isNotEmpty) ...[
                          const Divider(color: Colors.white10, height: 16),
                          _buildFactRow('Studio / Production', movie.productionCompanies.take(3).join(', ')),
                        ],
                      ],
                    ),
                  ),

                  // TV Show Episodes Section
                  if (movie.isTv) ...[
                    const SizedBox(height: 28),
                    Row(
                      children: [
                        Container(
                          width: 3.5,
                          height: 16,
                          decoration: BoxDecoration(
                            color: AppColors.lightBlue,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Seasons & Episodes',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Season Chips selector
                    SizedBox(
                      height: 38,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: movie.numberOfSeasons ?? 5,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, idx) {
                          final seasonNum = idx + 1;
                          final isSelected = seasonNum == _selectedSeason;
                          return ChoiceChip(
                            label: Text('Season $seasonNum'),
                            selected: isSelected,
                            selectedColor: AppColors.lightBlue,
                            backgroundColor: AppColors.card,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            side: BorderSide(
                              color: isSelected ? AppColors.lightBlue : Colors.white12,
                            ),
                            onSelected: (_) => _loadEpisodes(seasonNum),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 14),

                    if (_isLoadingEpisodes)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
                          ),
                        ),
                      )
                    else if (_episodes.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Text('No episodes listed for this season.', style: TextStyle(color: AppColors.textMuted)),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _episodes.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final ep = _episodes[index];
                          final epNum = ep['episode_number'] ?? (index + 1);
                          final epName = ep['name'] ?? 'Episode $epNum';
                          final stillPath = ep['still_path'];
                          final stillUrl = stillPath != null ? 'https://image.tmdb.org/t/p/w300$stillPath' : '';
                          final isSelected = _selectedEpisode == epNum;

                          return GestureDetector(
                            onTap: () {
                              setState(() => _selectedEpisode = epNum);
                              _playMedia(season: _selectedSeason, episode: epNum);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? AppColors.lightBlue : AppColors.border,
                                  width: isSelected ? 1.5 : 0.8,
                                ),
                              ),
                              child: Row(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: SizedBox(
                                      width: 90,
                                      height: 56,
                                      child: stillUrl.isNotEmpty
                                          ? CachedNetworkImage(
                                              imageUrl: stillUrl,
                                              fit: BoxFit.cover,
                                              errorWidget: (_, __, ___) => Container(
                                                color: AppColors.surface,
                                                child: const Icon(Icons.tv_rounded, color: AppColors.textMuted),
                                              ),
                                            )
                                          : Container(
                                              color: AppColors.surface,
                                              child: const Icon(Icons.tv_rounded, color: AppColors.textMuted),
                                            ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'E$epNum. $epName',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${ep['runtime'] ?? 45} mins • Season $_selectedSeason',
                                          style: const TextStyle(
                                            color: AppColors.textMuted,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isSelected ? AppColors.lightBlue : Colors.white.withValues(alpha: 0.05),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.play_arrow_rounded,
                                      color: isSelected ? Colors.black : Colors.white,
                                      size: 18,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                  ],

                  // More Like This Tray
                  if (_similarMovies.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    MovieTray(
                      title: 'More Like This',
                      movies: _similarMovies,
                    ),
                  ],

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFactRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ),
      ],
    );
  }
}
