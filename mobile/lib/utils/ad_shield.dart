class MobileAdShield {
  MobileAdShield._();

  static const List<String> trustedDomains = [
    'cinesrc.st',
    'vidlink.pro',
    'videasy.to',
    'cinezo.live',
    'autoembed.co',
    'vidsrc',
    'vidbolt.xyz',
    'bingr.one',
    'multiembed.mov',
    'embed.su',
    'vidy.st',
    'filmu.in',
    'be-chill.pro.et',
    'amagi.tv',
    'akamaized.net',
    'cloudfront.net',
    'cloudflare',
    'googleapis.com',
    'gstatic.com',
    'googlevideo.com',
    'rabbitstream.net',
    'megacloud.tv',
    'dokicloud.one',
    '2embed.cc',
    'playercdn.net',
    'streamwish.to',
    'filelions.to',
    'mixdrop.co',
    'jwplayer.com',
    'themoviedb.org',
    'tmdb.org',
    'youtube.com',
    'youtube-nocookie.com',
  ];

  static bool isAllowedUrl(String url, {String? initialEmbedUrl}) {
    if (url.isEmpty) return false;
    final lower = url.toLowerCase();

    // Allow internal protocols or media chunks
    if (lower.startsWith('about:blank') ||
        lower.startsWith('data:') ||
        lower.startsWith('blob:')) {
      return true;
    }

    // Direct match with initial URL
    if (initialEmbedUrl != null &&
        (url == initialEmbedUrl || lower.startsWith(initialEmbedUrl.toLowerCase()))) {
      return true;
    }

    try {
      final uri = Uri.parse(url);
      final host = uri.host.toLowerCase();

      // Always allow video stream file types
      final path = uri.path.toLowerCase();
      if (path.endsWith('.m3u8') ||
          path.endsWith('.mp4') ||
          path.endsWith('.ts') ||
          path.endsWith('.key')) {
        return true;
      }

      // Check trusted streaming domains
      for (final domain in trustedDomains) {
        if (host == domain || host.endsWith('.$domain') || host.contains(domain)) {
          return true;
        }
      }

      // Check if domain matches the initial embed host
      if (initialEmbedUrl != null && initialEmbedUrl.isNotEmpty) {
        final initialUri = Uri.parse(initialEmbedUrl);
        if (host == initialUri.host.toLowerCase() ||
            host.endsWith('.${initialUri.host.toLowerCase()}')) {
          return true;
        }
      }

      // Block all unknown external ad domains
      return false;
    } catch (_) {
      return false;
    }
  }

  // Pure popup & dialogue protection WITHOUT blocking clicks to HTML5 video players
  static const String injectionScript = '''
(function() {
  try {
    var mockWin = {
      focus: function() {},
      blur: function() {},
      close: function() {},
      closed: false,
      location: { href: '', replace: function() {} },
      document: { write: function() {}, open: function() {}, close: function() {} }
    };
    window.open = function() { return mockWin; };
    window.alert = function() {};
    window.confirm = function() { return false; };
    window.prompt = function() { return null; };
    window.onbeforeunload = null;
  } catch(e) {}
})();
''';
}
