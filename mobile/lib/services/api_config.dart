class ApiConfig {
  ApiConfig._();

  // Official Bu-Chill Production Backend
  static const String baseUrl = 'https://be-chill.pro.et';

  // Sports Endpoints
  static const String sportsMatchesAll = '$baseUrl/api/sports/matches?type=all';
  static const String sportsMatchesPopular = '$baseUrl/api/sports/matches?type=popular';
  static const String sportsStream = '$baseUrl/api/sports/stream';
  static const String sportsHlsProxy = '$baseUrl/api/sports/hls-proxy';

  // Live TV Endpoints
  static const String liveChannels = '$baseUrl/api/live/channels';
  static const String liveStreamProxy = '$baseUrl/api/live/stream-proxy';

  // TMDB API Token and Base URL
  static const String tmdbBaseUrl = 'https://api.themoviedb.org/3';
  static const String tmdbReadAccessToken =
      'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhNTVkMTg5MTg3YzRjMjVhNDE2MmRjMjU4OWU1MDlmYiIsIm5iZiI6MTc4OTY3NjI2MC45NTI5OTk4LCJzdWIiOiI2YWFjNGFlNDM4OWM3ZDE0NjkzNWVkYTciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.PrGdZA5Sccz2kwO0Iu4-IRE0SF3SIvL8dF-sYnkOMns';

  // Video Streaming Embeds
  static List<Map<String, String>> getMovieServers(int id) {
    return [
      {'name': 'CineSrc (Fast HD)', 'url': 'https://cinesrc.st/embed/movie/$id?color=f5a524&autoplay=true'},
      {'name': 'VidLink (English HD)', 'url': 'https://vidlink.pro/movie/$id?player=jw&primaryColor=f5a524'},
      {'name': 'Videasy (Ad-Light)', 'url': 'https://player.videasy.to/movie/$id?color=f5a524'},
      {'name': 'Cinezo (English HD)', 'url': 'https://player.cinezo.live/embed/movie/$id'},
      {'name': 'AutoEmbed (Multi-Server)', 'url': 'https://autoembed.co/movie/tmdb/$id'},
      {'name': 'VidSrc (Backup)', 'url': 'https://vidsrc.sbs/embed/movie/$id/'},
    ];
  }

  static List<Map<String, String>> getTvServers(int id, int season, int episode) {
    return [
      {'name': 'CineSrc (Fast HD)', 'url': 'https://cinesrc.st/embed/tv/$id?s=$season&e=$episode&color=f5a524&autoplay=true&autonext=true'},
      {'name': 'VidLink (English HD)', 'url': 'https://vidlink.pro/tv/$id/$season/$episode?player=jw&primaryColor=f5a524'},
      {'name': 'Videasy (Ad-Light)', 'url': 'https://player.videasy.to/tv/$id/$season/$episode?color=f5a524'},
      {'name': 'Cinezo (English HD)', 'url': 'https://player.cinezo.live/embed/tv/$id/$season/$episode'},
      {'name': 'AutoEmbed (Multi-Server)', 'url': 'https://autoembed.co/tv/tmdb/$id-$season-$episode'},
      {'name': 'VidSrc (Backup)', 'url': 'https://vidsrc.sbs/embed/tv/$id/$season/$episode'},
    ];
  }
}
