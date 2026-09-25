class CastMember {
  final int id;
  final String name;
  final String character;
  final String? profilePath;

  const CastMember({
    required this.id,
    required this.name,
    required this.character,
    this.profilePath,
  });

  String get profileUrl => profilePath != null && profilePath!.isNotEmpty
      ? 'https://image.tmdb.org/t/p/w185$profilePath'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80';

  factory CastMember.fromJson(Map<String, dynamic> json) {
    return CastMember(
      id: json['id'] ?? 0,
      name: json['name'] ?? json['original_name'] ?? 'Unknown',
      character: json['character'] ?? '',
      profilePath: json['profile_path'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'character': character,
        'profile_path': profilePath,
      };
}

class Movie {
  final int id;
  final String title;
  final String? overview;
  final String? posterPath;
  final String? backdropPath;
  final double voteAverage;
  final String? releaseDate;
  final String mediaType; // 'movie' or 'tv'
  final List<String> genres;
  final String? tagline;
  final int? runtime;
  final String? status;
  final String? originalLanguage;
  final int? budget;
  final int? revenue;
  final String? trailerKey;
  final List<String> productionCompanies;
  final int? numberOfSeasons;
  final int? numberOfEpisodes;
  final List<CastMember> cast;

  const Movie({
    required this.id,
    required this.title,
    this.overview,
    this.posterPath,
    this.backdropPath,
    this.voteAverage = 0.0,
    this.releaseDate,
    this.mediaType = 'movie',
    this.genres = const [],
    this.tagline,
    this.runtime,
    this.status,
    this.originalLanguage,
    this.budget,
    this.revenue,
    this.trailerKey,
    this.productionCompanies = const [],
    this.numberOfSeasons,
    this.numberOfEpisodes,
    this.cast = const [],
  });

  bool get isTv => mediaType == 'tv';

  String get formattedRating => voteAverage.toStringAsFixed(1);

  String get posterUrl => posterPath != null && posterPath!.isNotEmpty
      ? (posterPath!.startsWith('http')
          ? posterPath!
          : 'https://image.tmdb.org/t/p/w500$posterPath')
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';

  String get backdropUrl => backdropPath != null && backdropPath!.isNotEmpty
      ? (backdropPath!.startsWith('http')
          ? backdropPath!
          : 'https://image.tmdb.org/t/p/w1280$backdropPath')
      : posterUrl;

  String get year {
    if (releaseDate == null || releaseDate!.isEmpty) return '';
    try {
      return DateTime.parse(releaseDate!).year.toString();
    } catch (_) {
      return releaseDate!.split('-').first;
    }
  }

  String get formattedRuntime {
    if (runtime == null || runtime! <= 0) return '';
    final h = runtime! ~/ 60;
    final m = runtime! % 60;
    if (h > 0) {
      return m > 0 ? '${h}h ${m}m' : '${h}h';
    }
    return '${m}m';
  }

  factory Movie.fromJson(Map<String, dynamic> json, {String defaultType = 'movie'}) {
    final title = json['title'] ?? json['name'] ?? json['original_title'] ?? 'Untitled';
    final rawVote = json['vote_average'];
    double vote = 0.0;
    if (rawVote is num) {
      vote = rawVote.toDouble();
    }

    final date = json['release_date'] ?? json['first_air_date'] ?? '';
    final type = json['media_type'] ?? (json['first_air_date'] != null || json['name'] != null ? 'tv' : defaultType);

    // Extract genres list (handles both {"id": 28, "name": "Action"} and list of strings)
    List<String> parsedGenres = [];
    if (json['genres'] is List) {
      for (final g in json['genres']) {
        if (g is Map && g['name'] != null) {
          parsedGenres.add(g['name'].toString());
        } else if (g is String) {
          parsedGenres.add(g);
        }
      }
    }

    // Extract Cast
    List<CastMember> parsedCast = [];
    if (json['credits']?['cast'] is List) {
      final castList = json['credits']['cast'] as List;
      parsedCast = castList.take(15).map((c) => CastMember.fromJson(c)).toList();
    }

    // Extract YouTube Trailer Key
    String? trailer;
    if (json['videos']?['results'] is List) {
      final vList = json['videos']['results'] as List;
      for (final v in vList) {
        if (v['site'] == 'YouTube' && (v['type'] == 'Trailer' || v['type'] == 'Teaser')) {
          trailer = v['key']?.toString();
          break;
        }
      }
      if (trailer == null && vList.isNotEmpty) {
        for (final v in vList) {
          if (v['site'] == 'YouTube') {
            trailer = v['key']?.toString();
            break;
          }
        }
      }
    }

    // Production Companies
    List<String> prodCos = [];
    if (json['production_companies'] is List) {
      for (final c in json['production_companies']) {
        if (c is Map && c['name'] != null) {
          prodCos.add(c['name'].toString());
        }
      }
    }

    int? movieRuntime = json['runtime'] is num ? (json['runtime'] as num).toInt() : null;
    if (movieRuntime == null && json['episode_run_time'] is List && (json['episode_run_time'] as List).isNotEmpty) {
      final first = (json['episode_run_time'] as List).first;
      if (first is num) movieRuntime = first.toInt();
    }

    return Movie(
      id: json['id'] ?? 0,
      title: title,
      overview: json['overview'] ?? '',
      posterPath: json['poster_path'],
      backdropPath: json['backdrop_path'],
      voteAverage: vote,
      releaseDate: date,
      mediaType: type,
      genres: parsedGenres,
      tagline: json['tagline'] as String?,
      runtime: movieRuntime,
      status: json['status'] as String?,
      originalLanguage: (json['original_language'] as String?)?.toUpperCase(),
      budget: json['budget'] is num ? (json['budget'] as num).toInt() : null,
      revenue: json['revenue'] is num ? (json['revenue'] as num).toInt() : null,
      trailerKey: trailer,
      productionCompanies: prodCos,
      numberOfSeasons: json['number_of_seasons'] is num ? (json['number_of_seasons'] as num).toInt() : null,
      numberOfEpisodes: json['number_of_episodes'] is num ? (json['number_of_episodes'] as num).toInt() : null,
      cast: parsedCast,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'overview': overview,
        'poster_path': posterPath,
        'backdrop_path': backdropPath,
        'vote_average': voteAverage,
        'release_date': releaseDate,
        'media_type': mediaType,
        'genres': genres,
        'tagline': tagline,
        'runtime': runtime,
        'status': status,
        'original_language': originalLanguage,
        'budget': budget,
        'revenue': revenue,
        'trailer_key': trailerKey,
        'production_companies': productionCompanies,
        'number_of_seasons': numberOfSeasons,
        'number_of_episodes': numberOfEpisodes,
      };
}
