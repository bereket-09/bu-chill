import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/api_config.dart';
import '../theme/app_colors.dart';
import '../utils/ad_shield.dart';

class MoviePlayerScreen extends StatefulWidget {
  final int id;
  final String title;
  final bool isTv;
  final int season;
  final int episode;

  const MoviePlayerScreen({
    super.key,
    required this.id,
    required this.title,
    this.isTv = false,
    this.season = 1,
    this.episode = 1,
  });

  @override
  State<MoviePlayerScreen> createState() => _MoviePlayerScreenState();
}

class _MoviePlayerScreenState extends State<MoviePlayerScreen> {
  late final WebViewController _webViewController;
  late List<Map<String, String>> _servers;
  int _selectedServerIndex = 0;
  bool _isLoading = true;
  bool _isLandscape = false;
  String _activeEmbedUrl = '';

  @override
  void initState() {
    super.initState();
    _servers = widget.isTv
        ? ApiConfig.getTvServers(widget.id, widget.season, widget.episode)
        : ApiConfig.getMovieServers(widget.id);

    _initWebView();
  }

  void _initWebView() {
    _activeEmbedUrl = _servers[_selectedServerIndex]['url'] ?? '';

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
            // Inject AdShield immediately upon document load
            _webViewController.runJavaScript(MobileAdShield.injectionScript);
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            // Re-enforce AdShield after full DOM ready
            _webViewController.runJavaScript(MobileAdShield.injectionScript);
          },
          onNavigationRequest: (NavigationRequest request) {
            if (!request.isMainFrame) {
              return NavigationDecision.navigate;
            }
            final isAllowed = MobileAdShield.isAllowedUrl(
              request.url,
              initialEmbedUrl: _activeEmbedUrl,
            );

            if (isAllowed) {
              return NavigationDecision.navigate;
            }

            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(Uri.parse(_activeEmbedUrl));
  }

  void _switchServer(int index) {
    if (index == _selectedServerIndex) return;
    final newUrl = _servers[index]['url'] ?? '';
    setState(() {
      _selectedServerIndex = index;
      _activeEmbedUrl = newUrl;
      _isLoading = true;
    });
    _webViewController.loadRequest(Uri.parse(newUrl));
  }

  void _toggleOrientation() {
    if (_isLandscape) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);
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
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
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
                    const SizedBox(width: 4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
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
                                color: AppColors.textMuted,
                                fontSize: 12,
                              ),
                            ),
                        ],
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

            // Video / WebView Area
            Expanded(
              child: Stack(
                children: [
                  WebViewWidget(controller: _webViewController),
                  if (_isLoading)
                    Container(
                      color: Colors.black,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryRed),
                            ),
                            SizedBox(height: 16),
                            Text(
                              'Connecting to streaming server...',
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (_isLandscape)
                    Positioned(
                      top: 16,
                      left: 16,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.fullscreen_exit_rounded, color: Colors.white),
                          onPressed: _toggleOrientation,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Bottom Server Picker Bar
            if (!_isLandscape)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: AppColors.surface,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text(
                          'Streaming Servers',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Switch if video buffers',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: List.generate(_servers.length, (index) {
                          final isSelected = index == _selectedServerIndex;
                          final server = _servers[index];

                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(server['name'] ?? 'Server ${index + 1}'),
                              selected: isSelected,
                              selectedColor: AppColors.primaryRed,
                              backgroundColor: AppColors.card,
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
                                      : Colors.white.withOpacity(0.08),
                                ),
                              ),
                              onSelected: (_) => _switchServer(index),
                            ),
                          );
                        }),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
