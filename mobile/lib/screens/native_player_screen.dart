import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import '../services/api_config.dart';
import '../services/storage_service.dart';
import '../theme/app_colors.dart';
import '../utils/ad_shield.dart';

class NativePlayerScreen extends StatefulWidget {
  final int id;
  final String title;
  final bool isTv;
  final int season;
  final int episode;

  const NativePlayerScreen({
    super.key,
    required this.id,
    required this.title,
    this.isTv = false,
    this.season = 1,
    this.episode = 1,
  });

  @override
  State<NativePlayerScreen> createState() => _NativePlayerScreenState();
}

class _NativePlayerScreenState extends State<NativePlayerScreen> {
  WebViewController? _webViewController;
  late List<Map<String, String>> _servers;
  int _currentServerIndex = 0;

  bool _isLoading = true;
  bool _showControls = true;
  Timer? _hideTimer;
  Timer? _loadingTimeoutTimer;

  @override
  void initState() {
    super.initState();
    // 1. Always lock into immersive landscape mode
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    _servers = widget.isTv
        ? ApiConfig.getTvServers(widget.id, widget.season, widget.episode)
        : ApiConfig.getMovieServers(widget.id);

    StorageService().recordWatchHistory(
      mediaId: widget.id,
      type: widget.isTv ? 'tv' : 'movie',
      title: widget.title,
      season: widget.isTv ? widget.season : null,
      episode: widget.isTv ? widget.episode : null,
    );

    _initPlayer();
  }

  void _initPlayer() {
    final activeUrl = _servers[_currentServerIndex]['url'] ?? '';

    _loadingTimeoutTimer?.cancel();
    _loadingTimeoutTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _isLoading) {
        setState(() => _isLoading = false);
      }
    });

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..enableZoom(false)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            _webViewController?.runJavaScript(MobileAdShield.injectionScript);
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() => _isLoading = false);
            }
            _webViewController?.runJavaScript(MobileAdShield.injectionScript);
            _startHideTimer();
          },
          onNavigationRequest: (NavigationRequest request) {
            // Allow sub-frame / iframe requests so inner streaming players load seamlessly
            if (!request.isMainFrame) {
              return NavigationDecision.navigate;
            }
            if (MobileAdShield.isAllowedUrl(request.url, initialEmbedUrl: activeUrl)) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
        ),
      );

    // Enable media playback without requiring prior gestures on Android
    if (_webViewController!.platform is AndroidWebViewController) {
      (_webViewController!.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);
    }

    _webViewController!.loadRequest(Uri.parse(activeUrl));
  }

  void _switchServer(int index) {
    if (index == _currentServerIndex) return;
    setState(() {
      _currentServerIndex = index;
      _isLoading = true;
    });

    _loadingTimeoutTimer?.cancel();
    _loadingTimeoutTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _isLoading) {
        setState(() => _isLoading = false);
      }
    });

    final newUrl = _servers[index]['url'] ?? '';
    _webViewController?.loadRequest(Uri.parse(newUrl));
    _startHideTimer();
  }

  void _startHideTimer() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _showControls) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
    if (_showControls) {
      _startHideTimer();
    }
  }

  Future<bool> _showExitConfirmationDialog() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext ctx) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppColors.border, width: 1.2),
          ),
          title: Row(
            children: const [
              Icon(Icons.live_tv_rounded, color: AppColors.lightBlue, size: 24),
              SizedBox(width: 10),
              Text(
                'Exit Player?',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ],
          ),
          content: Text(
            'Are you sure you want to stop watching "${widget.title}"?',
            style: const TextStyle(color: AppColors.textLight, fontSize: 14, height: 1.4),
          ),
          actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Resume Playback'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.lightBlue,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Exit Player', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
    return result ?? false;
  }

  void _handleBackPress() async {
    final shouldExit = await _showExitConfirmationDialog();
    if (shouldExit && mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _loadingTimeoutTimer?.cancel();
    // Restore portrait and edge-to-edge system navigation upon exit
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentServerName = _servers[_currentServerIndex]['name'] ?? 'Server';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldExit = await _showExitConfirmationDialog();
        if (shouldExit && context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // 1. FULL UNINTERRUPTED WEBVIEW WITH EAGER GESTURE RECOGNIZERS (Immediate touch response)
            if (_webViewController != null)
              WebViewWidget(
                controller: _webViewController!,
                gestureRecognizers: {
                  Factory<OneSequenceGestureRecognizer>(
                    () => EagerGestureRecognizer(),
                  ),
                },
              ),

            // 2. Loading Indicator (Non-blocking IgnorePointer)
            if (_isLoading)
              IgnorePointer(
                child: Container(
                  color: Colors.black.withValues(alpha: 0.6),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Connecting to $currentServerName...',
                          style: const TextStyle(color: AppColors.textLight, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // 3. Floating Top Bar with auto-fade
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: AnimatedOpacity(
                opacity: _showControls ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 250),
                child: IgnorePointer(
                  ignoring: !_showControls,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.85),
                          Colors.transparent,
                        ],
                      ),
                    ),
                    child: SafeArea(
                      bottom: false,
                      child: Row(
                        children: [
                          // Back Button (with Confirmation Guard)
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.5),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                              tooltip: 'Exit Player',
                              onPressed: _handleBackPress,
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Title & Episode details
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  widget.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (widget.isTv)
                                  Text(
                                    'Season ${widget.season} • Episode ${widget.episode}',
                                    style: const TextStyle(
                                      color: AppColors.gold,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                              ],
                            ),
                          ),

                          // Server Switcher Menu
                          PopupMenuButton<int>(
                            initialValue: _currentServerIndex,
                            tooltip: 'Switch Streaming Server',
                            color: AppColors.surface,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: AppColors.border, width: 1),
                            ),
                            onSelected: _switchServer,
                            itemBuilder: (context) {
                              return List.generate(_servers.length, (idx) {
                                final s = _servers[idx];
                                final isSelected = idx == _currentServerIndex;
                                return PopupMenuItem<int>(
                                  value: idx,
                                  child: Row(
                                    children: [
                                      Icon(
                                        isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                        color: isSelected ? AppColors.lightBlue : AppColors.textMuted,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        s['name'] ?? 'Server $idx',
                                        style: TextStyle(
                                          color: isSelected ? Colors.white : AppColors.textLight,
                                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.lightBlue.withValues(alpha: 0.4)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.dns_rounded, color: AppColors.lightBlue, size: 14),
                                  const SizedBox(width: 5),
                                  Text(
                                    currentServerName.split(' ').first,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Refresh Stream Button
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.5),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 18),
                              tooltip: 'Reload Stream',
                              onPressed: () {
                                final url = _servers[_currentServerIndex]['url'] ?? '';
                                setState(() => _isLoading = true);
                                _webViewController?.loadRequest(Uri.parse(url));
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // 4. Subtle Floating Controls Toggle Pill (in top-right corner)
            Positioned(
              top: 10,
              right: 10,
              child: AnimatedOpacity(
                opacity: _showControls ? 0.0 : 0.65,
                duration: const Duration(milliseconds: 200),
                child: GestureDetector(
                  onTap: _toggleControls,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    ),
                    child: const Icon(Icons.settings_rounded, color: Colors.white, size: 18),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
