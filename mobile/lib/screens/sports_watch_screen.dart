import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/sports_match.dart';
import '../services/sports_service.dart';
import '../services/api_config.dart';
import '../theme/app_colors.dart';

class SportsWatchScreen extends StatefulWidget {
  final SportsMatch match;

  const SportsWatchScreen({
    super.key,
    required this.match,
  });

  @override
  State<SportsWatchScreen> createState() => _SportsWatchScreenState();
}

class _SportsWatchScreenState extends State<SportsWatchScreen> {
  final SportsService _sportsService = SportsService();
  List<SportsStream> _streams = [];
  int _selectedStreamIndex = 0;
  bool _isLoading = true;
  String? _errorMessage;

  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isPlaying = false;
  bool _isLandscape = false;
  bool _showControls = true;

  @override
  void initState() {
    super.initState();
    _loadStreams();
  }

  Future<void> _loadStreams() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final streams = await _sportsService.fetchStreams(widget.match.id, match: widget.match);
      // Strictly keep only verified HLS streams (ExoPlayer native playback)
      final hlsStreams = streams
          .where((s) => s.isDirectHls || s.embedUrl.contains('.m3u8') || s.embedUrl.contains('hls-proxy'))
          .toList();

      if (mounted) {
        if (hlsStreams.isEmpty) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'No verified HLS streams found for this match yet. Live streams appear before kickoff.';
          });
        } else {
          setState(() {
            _streams = hlsStreams;
            _selectedStreamIndex = 0;
            _isLoading = false;
          });
          _setupActiveStream();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Failed to load match streams. Please check your network connection.';
        });
      }
    }
  }

  void _setupActiveStream() {
    _disposeVideo();

    if (_streams.isEmpty) return;
    final stream = _streams[_selectedStreamIndex];

    // Determine clean HLS playback URL
    String playUrl = stream.embedUrl;
    if (!playUrl.contains('/hls-proxy') && !playUrl.contains('/stream-proxy')) {
      playUrl = '${ApiConfig.sportsHlsProxy}?url=${Uri.encodeComponent(playUrl)}';
    }

    // Native ExoPlayer direct playback - ZERO webview, ZERO ads, ZERO redirects!
    _videoController = VideoPlayerController.networkUrl(
      Uri.parse(playUrl),
    )..initialize().then((_) {
        if (mounted) {
          setState(() {
            _isVideoInitialized = true;
            _isPlaying = true;
          });
          _videoController?.play();
        }
      }).catchError((error) {
        // Fallback to raw direct stream without proxy
        _videoController = VideoPlayerController.networkUrl(
          Uri.parse(stream.embedUrl),
        )..initialize().then((_) {
            if (mounted) {
              setState(() {
                _isVideoInitialized = true;
                _isPlaying = true;
              });
              _videoController?.play();
            }
          });
      });
  }

  void _disposeVideo() {
    _videoController?.pause();
    _videoController?.dispose();
    _videoController = null;
    _isVideoInitialized = false;
  }

  void _togglePlayPause() {
    if (_videoController == null || !_isVideoInitialized) return;
    setState(() {
      if (_videoController!.value.isPlaying) {
        _videoController!.pause();
        _isPlaying = false;
      } else {
        _videoController!.play();
        _isPlaying = true;
      }
    });
  }

  void _toggleOrientation() {
    if (_isLandscape) {
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    } else {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
    setState(() {
      _isLandscape = !_isLandscape;
    });
  }

  @override
  void dispose() {
    _disposeVideo();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        top: !_isLandscape,
        bottom: !_isLandscape,
        child: Column(
          children: [
            // Top Bar
            if (!_isLandscape)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                color: AppColors.surface,
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.match.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        _isLandscape ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                        color: Colors.white,
                      ),
                      onPressed: _toggleOrientation,
                    ),
                  ],
                ),
              ),

            // Video Player Container
            Expanded(
              flex: _isLandscape ? 1 : 0,
              child: SizedBox(
                height: _isLandscape ? double.infinity : 240,
                width: double.infinity,
                child: _buildPlayerArea(),
              ),
            ),

            // Match Info & Stream Switcher
            if (!_isLandscape)
              Expanded(
                child: Container(
                  color: AppColors.backgroundDark,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Teams Banner
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.06)),
                        ),
                        child: Row(
                          children: [
                            // Home Team
                            Expanded(
                              child: Column(
                                children: [
                                  _buildTeamBadge(widget.match.homeTeam.badge),
                                  const SizedBox(height: 8),
                                  Text(
                                    widget.match.homeTeam.name,
                                    textAlign: TextAlign.center,
                                    maxLines: 2,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // VS / Live Badge
                            Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: widget.match.isLive
                                        ? AppColors.liveRed
                                        : AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    widget.match.isLive ? 'LIVE' : 'VS',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  widget.match.timeFormatted,
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),

                            // Away Team
                            Expanded(
                              child: Column(
                                children: [
                                  _buildTeamBadge(widget.match.awayTeam.badge),
                                  const SizedBox(height: 8),
                                  Text(
                                    widget.match.awayTeam.name,
                                    textAlign: TextAlign.center,
                                    maxLines: 2,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Stream Selector Section
                      const Text(
                        'Available Broadcast Streams',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),

                      if (_streams.isEmpty && !_isLoading)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'No alternative feeds currently broadcast.',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                          ),
                        )
                      else
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: List.generate(_streams.length, (index) {
                            final stream = _streams[index];
                            final isSelected = index == _selectedStreamIndex;

                            return ChoiceChip(
                              label: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.play_circle_filled_rounded,
                                    size: 16,
                                    color: isSelected ? Colors.white : AppColors.primaryRed,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Feed ${stream.streamNo} (${stream.language})',
                                  ),
                                  if (stream.hd) ...[
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: isSelected ? Colors.white24 : AppColors.surface,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'HD',
                                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              selected: isSelected,
                              selectedColor: AppColors.primaryRed,
                              backgroundColor: AppColors.card,
                              labelStyle: TextStyle(
                                color: isSelected ? Colors.white : AppColors.textLight,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                fontSize: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(
                                  color: isSelected
                                      ? AppColors.primaryRed
                                      : Colors.white.withOpacity(0.08),
                                ),
                              ),
                              onSelected: (_) {
                                setState(() {
                                  _selectedStreamIndex = index;
                                });
                                _setupActiveStream();
                              },
                            );
                          }),
                        ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerArea() {
    if (_isLoading) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryRed),
              ),
              SizedBox(height: 12),
              Text(
                'Searching live sports broadcast streams...',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Container(
        color: Colors.black,
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.sports_soccer_rounded, color: AppColors.primaryRed, size: 48),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadStreams,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    if (_videoController != null) {
      return GestureDetector(
        onTap: () {
          setState(() {
            _showControls = !_showControls;
          });
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            AspectRatio(
              aspectRatio: _isVideoInitialized
                  ? _videoController!.value.aspectRatio
                  : 16 / 9,
              child: VideoPlayer(_videoController!),
            ),
            if (_showControls || !_isPlaying)
              Container(
                color: Colors.black.withOpacity(0.4),
                child: Center(
                  child: IconButton(
                    iconSize: 56,
                    icon: Icon(
                      _isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_filled_rounded,
                      color: Colors.white,
                    ),
                    onPressed: _togglePlayPause,
                  ),
                ),
              ),
            if (_isLandscape)
              Positioned(
                top: 16,
                right: 16,
                child: IconButton(
                  icon: const Icon(Icons.fullscreen_exit_rounded, color: Colors.white),
                  onPressed: _toggleOrientation,
                ),
              ),
          ],
        ),
      );
    }

    return Container(color: Colors.black);
  }

  Widget _buildTeamBadge(String badgeUrl) {
    if (badgeUrl.isEmpty) {
      return Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.surface,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.shield_outlined, color: AppColors.textMuted, size: 24),
      );
    }
    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: badgeUrl,
        width: 48,
        height: 48,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(width: 48, height: 48, color: AppColors.surface),
        errorWidget: (_, __, ___) => const Icon(Icons.shield_outlined, color: AppColors.textMuted, size: 24),
      ),
    );
  }
}
