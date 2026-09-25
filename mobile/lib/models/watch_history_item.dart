class WatchHistoryItem {
  final String id;
  final int mediaId;
  final String type; // 'movie' or 'tv'
  final String title;
  final String? posterPath;
  final String? backdropPath;
  final int duration;
  final int lastPosition;
  final bool completed;
  final int? season;
  final int? episode;
  final String? updatedAt;
  final double voteAverage;

  const WatchHistoryItem({
    required this.id,
    required this.mediaId,
    required this.type,
    required this.title,
    this.posterPath,
    this.backdropPath,
    this.duration = 0,
    this.lastPosition = 0,
    this.completed = false,
    this.season,
    this.episode,
    this.updatedAt,
    this.voteAverage = 0.0,
  });

  String get posterUrl => posterPath != null && posterPath!.isNotEmpty
      ? 'https://image.tmdb.org/t/p/w500$posterPath'
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';

  String get backdropUrl => backdropPath != null && backdropPath!.isNotEmpty
      ? 'https://image.tmdb.org/t/p/w780$backdropPath'
      : posterUrl;

  double get progress {
    if (duration <= 0) return 0.0;
    return (lastPosition / duration).clamp(0.0, 1.0);
  }

  bool get isTv => type == 'tv';

  Map<String, dynamic> toJson() => {
        'id': id,
        'media_id': mediaId,
        'type': type,
        'title': title,
        'poster_path': posterPath,
        'backdrop_path': backdropPath,
        'duration': duration,
        'last_position': lastPosition,
        'completed': completed,
        'season': season ?? 0,
        'episode': episode ?? 0,
        'updated_at': updatedAt ?? DateTime.now().toIso8601String(),
        'vote_average': voteAverage,
      };

  factory WatchHistoryItem.fromJson(Map<String, dynamic> json) {
    return WatchHistoryItem(
      id: (json['id'] ?? json['media_id']).toString(),
      mediaId: json['media_id'] is int ? json['media_id'] : int.tryParse(json['media_id']?.toString() ?? '0') ?? 0,
      type: json['type']?.toString().toLowerCase() == 'tv' ? 'tv' : 'movie',
      title: json['title'] ?? 'Unknown Title',
      posterPath: json['poster_path'],
      backdropPath: json['backdrop_path'],
      duration: json['duration'] is int ? json['duration'] : int.tryParse(json['duration']?.toString() ?? '0') ?? 0,
      lastPosition: json['last_position'] is int
          ? json['last_position']
          : int.tryParse(json['last_position']?.toString() ?? '0') ?? 0,
      completed: json['completed'] == true,
      season: json['season'] is int ? json['season'] : int.tryParse(json['season']?.toString() ?? '0'),
      episode: json['episode'] is int ? json['episode'] : int.tryParse(json['episode']?.toString() ?? '0'),
      updatedAt: json['updated_at']?.toString(),
      voteAverage: (json['vote_average'] is num) ? (json['vote_average'] as num).toDouble() : 0.0,
    );
  }
}
