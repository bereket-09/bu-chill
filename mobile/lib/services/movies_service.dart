import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/movie.dart';
import 'api_config.dart';

class MoviesService {
  static final MoviesService _instance = MoviesService._internal();
  factory MoviesService() => _instance;
  MoviesService._internal();

  Map<String, String> get _headers => {
        'Authorization': 'Bearer ${ApiConfig.tmdbReadAccessToken}',
        'Content-Type': 'application/json;charset=utf-8',
      };

  Future<List<Movie>> _getMoviesList(String endpoint, {Map<String, String>? queryParams}) async {
    try {
      final uri = Uri.parse('${ApiConfig.tmdbBaseUrl}$endpoint').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final results = (data['results'] as List?) ?? [];
        return results.map((item) => Movie.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Movie>> fetchTrendingMovies({String timeWindow = 'day'}) async {
    return _getMoviesList('/trending/movie/$timeWindow');
  }

  Future<List<Movie>> fetchPopularMovies() async {
    return _getMoviesList('/movie/popular');
  }

  Future<List<Movie>> fetchTopRatedMovies() async {
    return _getMoviesList('/movie/top_rated');
  }

  Future<List<Movie>> fetchTrendingTv({String timeWindow = 'day'}) async {
    return _getMoviesList('/trending/tv/$timeWindow');
  }

  Future<List<Movie>> fetchPopularTv() async {
    return _getMoviesList('/tv/popular');
  }

  Future<List<Movie>> fetchTopRatedTv() async {
    return _getMoviesList('/tv/top_rated');
  }

  Future<List<Movie>> fetchAnime() async {
    return _getMoviesList('/discover/tv', queryParams: {
      'with_genres': '16',
      'with_original_language': 'ja',
      'sort_by': 'popularity.desc',
    });
  }

  Future<List<Movie>> searchMedia(String query) async {
    if (query.trim().isEmpty) return [];
    return _getMoviesList('/search/multi', queryParams: {
      'query': query,
      'include_adult': 'false',
    });
  }

  Future<Movie?> fetchDetails(int id, {bool isTv = false}) async {
    try {
      final endpoint = isTv ? '/tv/$id' : '/movie/$id';
      final uri = Uri.parse('${ApiConfig.tmdbBaseUrl}$endpoint').replace(queryParameters: {
        'append_to_response': 'credits,similar,recommendations,videos',
      });
      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Movie.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<Movie>> fetchSimilar(int id, {bool isTv = false}) async {
    final endpoint = isTv ? '/tv/$id/similar' : '/movie/$id/similar';
    return _getMoviesList(endpoint);
  }

  Future<List<Map<String, dynamic>>> fetchEpisodes(int tvId, int seasonNumber) async {
    try {
      final uri = Uri.parse('${ApiConfig.tmdbBaseUrl}/tv/$tvId/season/$seasonNumber');
      final response = await http.get(uri, headers: _headers);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final episodes = (data['episodes'] as List?) ?? [];
        return episodes.map((e) => e as Map<String, dynamic>).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
