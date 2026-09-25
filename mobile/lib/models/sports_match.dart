class SportsTeam {
  final String name;
  final String badge;

  const SportsTeam({
    required this.name,
    this.badge = '',
  });

  factory SportsTeam.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const SportsTeam(name: '');
    return SportsTeam(
      name: json['name'] ?? '',
      badge: json['badge'] ?? '',
    );
  }
}

class SportsStreamSource {
  final String source;
  final String id;

  const SportsStreamSource({
    required this.source,
    required this.id,
  });

  factory SportsStreamSource.fromJson(Map<String, dynamic> json) {
    return SportsStreamSource(
      source: json['source'] ?? '',
      id: json['id'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'source': source,
        'id': id,
      };
}

class SportsStream {
  final String id;
  final int streamNo;
  final String language;
  final bool hd;
  final String embedUrl;
  final String source;
  final bool isBackup;

  const SportsStream({
    required this.id,
    required this.streamNo,
    required this.language,
    required this.hd,
    required this.embedUrl,
    required this.source,
    this.isBackup = false,
  });

  bool get isDirectHls =>
      embedUrl.contains('.m3u8') ||
      embedUrl.contains('/hls-proxy') ||
      embedUrl.contains('/stream-proxy');

  factory SportsStream.fromJson(Map<String, dynamic> json) {
    String url = json['embedUrl'] ?? '';
    if (url.startsWith('/')) {
      url = 'https://be-chill.pro.et$url';
    }
    return SportsStream(
      id: json['id']?.toString() ?? '',
      streamNo: json['streamNo'] ?? 1,
      language: json['language'] ?? 'English',
      hd: json['hd'] ?? true,
      embedUrl: url,
      source: json['source'] ?? '',
      isBackup: json['isBackup'] ?? false,
    );
  }
}

class SportsChannelStream {
  final String id;
  final String channelName;
  final String channelCode;
  final String url;
  final String image;

  const SportsChannelStream({
    this.id = '',
    required this.channelName,
    this.channelCode = '',
    required this.url,
    this.image = '',
  });

  factory SportsChannelStream.fromJson(Map<String, dynamic> json) {
    return SportsChannelStream(
      id: json['id']?.toString() ?? '',
      channelName: json['channel_name'] ?? json['name'] ?? 'Stream',
      channelCode: json['channel_code'] ?? json['code'] ?? '',
      url: json['url'] ?? '',
      image: json['image'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'channel_name': channelName,
        'channel_code': channelCode,
        'url': url,
        'image': image,
      };
}

class SportsMatch {
  final String id;
  final String title;
  final String category;
  final int date; // Epoch ms
  final String poster;
  final bool popular;
  final SportsTeam homeTeam;
  final SportsTeam awayTeam;
  final List<SportsStreamSource> sources;
  final List<SportsChannelStream> channels;

  const SportsMatch({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    required this.poster,
    this.popular = false,
    required this.homeTeam,
    required this.awayTeam,
    this.sources = const [],
    this.channels = const [],
  });

  bool get isLive {
    if (category == 'upcoming') return false;
    final now = DateTime.now().millisecondsSinceEpoch;
    // Started within last 3.5h up to 15m in advance
    return date >= now - (3.5 * 3600 * 1000) && date <= now + (15 * 60 * 1000);
  }

  String get timeFormatted {
    final dt = DateTime.fromMillisecondsSinceEpoch(date);
    final hour = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '$hour:$min';
  }

  factory SportsMatch.fromJson(Map<String, dynamic> json) {
    final teamsJson = json['teams'] as Map<String, dynamic>?;
    final rawSources = json['sources'] as List<dynamic>? ?? [];
    final rawChannels = json['channels'] as List<dynamic>? ?? [];

    return SportsMatch(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Sports Match',
      category: json['category'] ?? 'football',
      date: json['date'] is num ? (json['date'] as num).toInt() : 0,
      poster: json['poster'] ?? '',
      popular: json['popular'] ?? false,
      homeTeam: SportsTeam.fromJson(teamsJson?['home']),
      awayTeam: SportsTeam.fromJson(teamsJson?['away']),
      sources: rawSources
          .map((s) => SportsStreamSource.fromJson(s as Map<String, dynamic>))
          .toList(),
      channels: rawChannels
          .map((c) => SportsChannelStream.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }
}
