import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/live_channel.dart';
import 'api_config.dart';

class LiveTvService {
  static final LiveTvService _instance = LiveTvService._internal();
  factory LiveTvService() => _instance;
  LiveTvService._internal();

  List<LiveChannel> _cachedChannels = [];

  Future<List<LiveChannel>> fetchChannels({bool forceRefresh = false}) async {
    if (_cachedChannels.isNotEmpty && !forceRefresh) {
      return _cachedChannels;
    }

    try {
      final response = await http.get(
        Uri.parse(ApiConfig.liveChannels),
        headers: {'Accept': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final list = (data['channels'] as List?) ?? [];
        _cachedChannels = list.map((item) => LiveChannel.fromJson(item)).toList();
        return _cachedChannels;
      }
      return [];
    } catch (e) {
      return _cachedChannels;
    }
  }

  List<String> extractCategories(List<LiveChannel> channels) {
    final set = <String>{'All'};
    for (var ch in channels) {
      if (ch.group.isNotEmpty) {
        set.add(ch.group);
      }
    }
    return set.toList();
  }

  List<String> extractCountries(List<LiveChannel> channels) {
    final set = <String>{'All'};
    for (var ch in channels) {
      if (ch.country != null && ch.country!.isNotEmpty) {
        set.add(ch.country!);
      }
    }
    return set.toList();
  }

  String getStreamUrl(String rawUrl) {
    // If rawUrl is direct HLS, we can play it, or proxy if blocked by CORS / protocol
    return rawUrl;
  }

  String getProxiedStreamUrl(String rawUrl) {
    return '${ApiConfig.liveStreamProxy}?url=${Uri.encodeComponent(rawUrl)}';
  }
}
