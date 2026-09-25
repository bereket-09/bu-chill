import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/sports_match.dart';
import 'api_config.dart';

class SportsService {
  static final SportsService _instance = SportsService._internal();
  factory SportsService() => _instance;
  SportsService._internal();

  static const List<SportsStream> verified247Channels = [
    SportsStream(
      id: 'live-bein-sports-xtra',
      streamNo: 1,
      language: 'English / International',
      hd: true,
      embedUrl:
          '${ApiConfig.sportsHlsProxy}?url=https%3A%2F%2Fbein-xtra-bein.amagi.tv%2Fplaylist.m3u8',
      source: 'beIN SPORTS XTRA (24/7 Football)',
      isBackup: true,
    ),
    SportsStream(
      id: 'live-espn-ocho',
      streamNo: 2,
      language: 'English',
      hd: true,
      embedUrl:
          '${ApiConfig.sportsHlsProxy}?url=https%3A%2F%2Fd3b6q2ou5kp8ke.cloudfront.net%2FESPNTheOcho.m3u8',
      source: 'ESPN8: The Ocho (Live Sports)',
      isBackup: true,
    ),
    SportsStream(
      id: 'live-redbull-tv',
      streamNo: 3,
      language: 'English',
      hd: true,
      embedUrl:
          '${ApiConfig.sportsHlsProxy}?url=https%3A%2F%2Frbmn-live.akamaized.net%2Fhls%2Flive%2F590964%2FBoRB-AT%2Fmaster.m3u8',
      source: 'Red Bull TV (Extreme Action & Racing)',
      isBackup: true,
    ),
  ];

  Future<List<SportsMatch>> fetchMatches({String type = 'all'}) async {
    if (type == 'popular') {
      return getPopularMatches();
    }
    return getAllMatches();
  }

  Future<List<SportsStream>> fetchStreams(String matchId, {SportsMatch? match}) async {
    final targetMatch = match ?? parseMatchSlug(matchId);
    return getStreamsForMatch(targetMatch);
  }

  static Future<List<SportsMatch>> getAllMatches() async {
    try {
      final res = await http.get(Uri.parse(ApiConfig.sportsMatchesAll)).timeout(
            const Duration(seconds: 10),
          );
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((json) => SportsMatch.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<SportsMatch>> getPopularMatches() async {
    try {
      final res = await http.get(Uri.parse(ApiConfig.sportsMatchesPopular)).timeout(
            const Duration(seconds: 10),
          );
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((json) => SportsMatch.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<SportsStream>> getStreamsForMatch(SportsMatch match) async {
    try {
      final sources = match.sources.isNotEmpty
          ? match.sources.map((s) => s.toJson()).toList()
          : [
              {'source': 'solaris', 'id': match.id}
            ];

      final res = await http
          .post(
            Uri.parse(ApiConfig.sportsStream),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'sources': sources,
              'matchId': match.id,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        final list = data.map((s) => SportsStream.fromJson(s)).toList();

        final List<SportsStream> hlsOnly = [];
        for (final stream in list) {
          if (stream.isDirectHls) {
            hlsOnly.add(stream);
          } else {
            final extracted = await _tryExtractM3u8(stream.embedUrl);
            if (extracted != null && extracted.isNotEmpty) {
              final proxied = '${ApiConfig.sportsHlsProxy}?url=${Uri.encodeComponent(extracted)}';
              hlsOnly.add(SportsStream(
                id: stream.id,
                streamNo: stream.streamNo,
                language: stream.language,
                hd: stream.hd,
                embedUrl: proxied,
                source: stream.source,
                isBackup: stream.isBackup,
              ));
            }
          }
        }

        if (hlsOnly.isNotEmpty) return hlsOnly;
      }
      return verified247Channels;
    } catch (_) {
      return verified247Channels;
    }
  }

  static Future<String?> _tryExtractM3u8(String embedUrl) async {
    try {
      final response = await http.get(
        Uri.parse(embedUrl),
        headers: {
          'User-Agent':
              'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
          'Referer': embedUrl,
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final html = response.body;
        // Search for raw m3u8 pattern
        final pattern = RegExp(
          r'''(?:https?:)?//[^\s'"<>]+\.m3u8(?:\?[^\s'"<>]*)?''',
          caseSensitive: false,
        );
        final match = pattern.firstMatch(html);
        if (match != null) {
          var url = match.group(0)!;
          if (url.startsWith('//')) {
            url = 'https:$url';
          }
          return url;
        }
      }
    } catch (_) {}
    return null;
  }

  static SportsMatch parseMatchSlug(String id) {
    final clean = Uri.decodeComponent(id)
        .replaceAll(RegExp(r'^manual[-_]', caseSensitive: false), '')
        .replaceAll(RegExp(r'\.html?$', caseSensitive: false), '');

    final parts = clean.split(RegExp(r'[-_]?vs[-_]?', caseSensitive: false));
    String homeName = 'Team 1';
    String awayName = 'Team 2';

    if (parts.length >= 2) {
      homeName = parts[0].replaceAll(RegExp(r'[-_]'), ' ').trim();
      awayName = parts[1].replaceAll(RegExp(r'[-_]'), ' ').trim();
    } else {
      homeName = clean.replaceAll(RegExp(r'[-_]'), ' ').trim();
      awayName = 'Live Match';
    }

    String cap(String s) => s
        .split(' ')
        .map((w) => w.isNotEmpty
            ? '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}'
            : '')
        .join(' ');

    final home = cap(homeName);
    final away = cap(awayName);

    return SportsMatch(
      id: id,
      title: '$home vs $away',
      category: 'football',
      date: DateTime.now().millisecondsSinceEpoch,
      poster: '',
      popular: true,
      homeTeam: SportsTeam(name: home),
      awayTeam: SportsTeam(name: away),
      sources: [SportsStreamSource(source: 'solaris', id: id)],
    );
  }
}
