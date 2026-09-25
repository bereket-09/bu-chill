import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/movie.dart';
import '../models/user_profile.dart';
import '../models/watch_history_item.dart';
import '../constants/avatar_constants.dart';
import 'auth_service.dart';

class StorageService extends ChangeNotifier {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  static const String _keyProfiles = 'buchill_profiles_v2';
  static const String _keyActiveProfileId = 'buchill_active_profile_id_v2';
  static const String _keyWatchlistPrefix = 'buchill_watchlist_';
  static const String _keyLegacyWatchlist = 'buchill_watchlist';
  static const String _keyHistory = 'buchill_history';
  static const String _keyHistoryPrefix = 'buchill_history_';

  static const String _supabaseUrl = 'https://vuzgkwkeyqdinbmsoosg.supabase.co';
  static const String _supabaseKey = 'sb_publishable_8n51gz88ZUEU-kaiU6W6yg_w_NQiwXS';

  late SharedPreferences _prefs;
  bool _isInitialized = false;

  final List<UserProfile> _profiles = [];
  String _activeProfileId = 'main';
  final List<Movie> _watchlist = [];
  final List<WatchHistoryItem> _history = [];

  List<UserProfile> get profiles => List.unmodifiable(_profiles);
  UserProfile get activeProfile {
    return _profiles.firstWhere(
      (p) => p.id == _activeProfileId,
      orElse: () => _profiles.isNotEmpty
          ? _profiles.first
          : UserProfile(id: 'main', name: 'Main Profile', avatarId: '01', isMain: true),
    );
  }

  bool get isKidsMode => activeProfile.isKid;
  List<Movie> get watchlist => List.unmodifiable(_watchlist);
  List<WatchHistoryItem> get history => List.unmodifiable(_history);

  Future<void> init() async {
    if (_isInitialized) return;
    _prefs = await SharedPreferences.getInstance();
    _loadProfiles();
    _loadActiveWatchlist();
    _loadActiveHistory();
    _isInitialized = true;
    syncHistoryWithSupabase();
  }

  void _loadProfiles() {
    final rawProfiles = _prefs.getStringList(_keyProfiles);
    _profiles.clear();

    if (rawProfiles != null && rawProfiles.isNotEmpty) {
      for (final jsonStr in rawProfiles) {
        try {
          _profiles.add(UserProfile.fromJson(json.decode(jsonStr)));
        } catch (_) {}
      }
    }

    if (_profiles.isEmpty) {
      // Default initial profiles matching website setup
      _profiles.addAll([
        UserProfile(id: 'main', name: 'Main Profile', avatarId: AvatarConstants.defaultAvatarId, isMain: true),
        UserProfile(id: 'kids', name: 'Kids Safe', avatarId: '08', isKid: true),
      ]);
      _saveProfiles();
    }

    _activeProfileId = _prefs.getString(_keyActiveProfileId) ?? _profiles.first.id;
  }

  Future<void> _saveProfiles() async {
    final list = _profiles.map((p) => json.encode(p.toJson())).toList();
    await _prefs.setStringList(_keyProfiles, list);
    await _prefs.setString(_keyActiveProfileId, _activeProfileId);
  }

  void _loadActiveWatchlist() {
    _watchlist.clear();
    // Try profile-specific list first, fallback to legacy
    final profileKey = '$_keyWatchlistPrefix$_activeProfileId';
    List<String>? listJson = _prefs.getStringList(profileKey);

    if (listJson == null || listJson.isEmpty) {
      listJson = _prefs.getStringList(_keyLegacyWatchlist) ?? [];
    }

    for (var str in listJson) {
      try {
        final map = json.decode(str);
        _watchlist.add(Movie.fromJson(map));
      } catch (_) {}
    }
  }

  Future<void> _saveWatchlist() async {
    final listJson = _watchlist.map((m) => json.encode(m.toJson())).toList();
    final profileKey = '$_keyWatchlistPrefix$_activeProfileId';
    await _prefs.setStringList(profileKey, listJson);
    await _prefs.setStringList(_keyLegacyWatchlist, listJson);
  }

  void _loadActiveHistory() {
    _history.clear();
    final profileKey = '$_keyHistoryPrefix$_activeProfileId';
    List<String>? listJson = _prefs.getStringList(profileKey);
    if (listJson == null || listJson.isEmpty) {
      listJson = _prefs.getStringList(_keyHistory) ?? [];
    }

    for (var str in listJson) {
      try {
        final map = json.decode(str);
        _history.add(WatchHistoryItem.fromJson(map));
      } catch (_) {}
    }
  }

  Future<void> _saveHistory() async {
    final listJson = _history.map((h) => json.encode(h.toJson())).toList();
    final profileKey = '$_keyHistoryPrefix$_activeProfileId';
    await _prefs.setStringList(profileKey, listJson);
    await _prefs.setStringList(_keyHistory, listJson);
  }

  // --- Profile Switcher & Management Methods ---
  Future<void> switchProfile(String profileId) async {
    if (_activeProfileId == profileId) return;
    _activeProfileId = profileId;
    await _prefs.setString(_keyActiveProfileId, _activeProfileId);
    _loadActiveWatchlist();
    _loadActiveHistory();
    notifyListeners();
    syncHistoryWithSupabase();
  }

  Future<void> addProfile({required String name, String avatarId = '01', bool isKid = false}) async {
    if (_profiles.length >= 5) return;
    final newId = 'profile_${DateTime.now().millisecondsSinceEpoch}';
    final profile = UserProfile(id: newId, name: name, avatarId: avatarId, isKid: isKid);
    _profiles.add(profile);
    await _saveProfiles();
    await switchProfile(newId);
  }

  Future<void> updateProfile(String id, {String? name, String? avatarId, bool? isKid}) async {
    final idx = _profiles.indexWhere((p) => p.id == id);
    if (idx != -1) {
      if (name != null && name.trim().isNotEmpty) _profiles[idx].name = name.trim();
      if (avatarId != null) _profiles[idx].avatarId = avatarId;
      if (isKid != null) _profiles[idx].isKid = isKid;
      await _saveProfiles();
      notifyListeners();
    }
  }

  Future<void> deleteProfile(String id) async {
    if (_profiles.length <= 1) return; // Cannot delete the last profile
    _profiles.removeWhere((p) => p.id == id);
    if (_activeProfileId == id) {
      _activeProfileId = _profiles.first.id;
      _loadActiveWatchlist();
    }
    await _saveProfiles();
    notifyListeners();
  }

  Future<void> toggleKidsMode(bool enabled) async {
    await updateProfile(_activeProfileId, isKid: enabled);
  }

  // --- Watchlist Filtering & Sorting ---
  bool isInWatchlist(int id) {
    return _watchlist.any((m) => m.id == id);
  }

  Future<void> addToWatchlist(Movie movie) async {
    if (!isInWatchlist(movie.id)) {
      _watchlist.insert(0, movie);
      await _saveWatchlist();
      notifyListeners();
    }
  }

  Future<void> removeFromWatchlist(int id) async {
    _watchlist.removeWhere((m) => m.id == id);
    await _saveWatchlist();
    notifyListeners();
  }

  Future<void> toggleWatchlist(Movie movie) async {
    if (isInWatchlist(movie.id)) {
      await removeFromWatchlist(movie.id);
    } else {
      await addToWatchlist(movie);
    }
  }

  List<Movie> getFilteredWatchlist({String type = 'all', String sort = 'dateAdded'}) {
    List<Movie> list = List.from(_watchlist);

    // Filter by type: 'all' | 'movie' | 'tv' | 'anime'
    if (type == 'movie') {
      list = list.where((m) => !m.isTv && !m.genres.contains('Animation')).toList();
    } else if (type == 'tv') {
      list = list.where((m) => m.isTv && !m.genres.contains('Animation')).toList();
    } else if (type == 'anime') {
      list = list.where((m) => m.genres.contains('Animation') || m.title.toLowerCase().contains('anime')).toList();
    }

    // Sort by: 'dateAdded' | 'rating' | 'title'
    if (sort == 'rating') {
      list.sort((a, b) => b.voteAverage.compareTo(a.voteAverage));
    } else if (sort == 'title') {
      list.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
    }

    return list;
  }

  // --- Cross-Platform Watch History Methods ---
  Future<void> syncHistoryWithSupabase() async {
    final user = AuthService().currentUser;
    if (user == null || user.isGuest) return;

    try {
      final res = await http.get(
        Uri.parse('$_supabaseUrl/rest/v1/histories?user_id=eq.${user.id}&order=updated_at.desc&limit=50'),
        headers: {
          'apikey': _supabaseKey,
          'Authorization': 'Bearer ${user.accessToken ?? _supabaseKey}',
          'Content-Type': 'application/json',
        },
      );

      if (res.statusCode == 200) {
        final List<dynamic> data = json.decode(res.body);
        if (data.isNotEmpty) {
          final Map<String, WatchHistoryItem> map = {};
          // Preserve local records
          for (final h in _history) {
            final key = '${h.type}_${h.mediaId}_${h.season ?? 0}_${h.episode ?? 0}';
            map[key] = h;
          }
          // Merge server records
          for (final item in data) {
            final h = WatchHistoryItem.fromJson(item);
            final key = '${h.type}_${h.mediaId}_${h.season ?? 0}_${h.episode ?? 0}';
            map[key] = h;
          }

          _history.clear();
          _history.addAll(map.values);
          _history.sort((a, b) => (b.updatedAt ?? '').compareTo(a.updatedAt ?? ''));
          await _saveHistory();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<void> recordWatchHistory({
    required int mediaId,
    required String type,
    required String title,
    String? posterPath,
    String? backdropPath,
    int duration = 0,
    int lastPosition = 0,
    int? season,
    int? episode,
    bool completed = false,
    double voteAverage = 0.0,
  }) async {
    final key = '${type}_${mediaId}_${season ?? 0}_${episode ?? 0}';
    final existingIdx = _history.indexWhere(
      (h) => '${h.type}_${h.mediaId}_${h.season ?? 0}_${h.episode ?? 0}' == key,
    );

    final item = WatchHistoryItem(
      id: key,
      mediaId: mediaId,
      type: type,
      title: title,
      posterPath: posterPath,
      backdropPath: backdropPath,
      duration: duration,
      lastPosition: lastPosition,
      completed: completed,
      season: season,
      episode: episode,
      updatedAt: DateTime.now().toIso8601String(),
      voteAverage: voteAverage,
    );

    if (existingIdx != -1) {
      _history[existingIdx] = item;
    } else {
      _history.insert(0, item);
    }

    await _saveHistory();
    notifyListeners();

    // Cross-platform sync to Supabase histories table
    final user = AuthService().currentUser;
    if (user != null && !user.isGuest) {
      try {
        await http.post(
          Uri.parse('$_supabaseUrl/rest/v1/histories'),
          headers: {
            'apikey': _supabaseKey,
            'Authorization': 'Bearer ${user.accessToken ?? _supabaseKey}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: json.encode({
            'user_id': user.id,
            'media_id': mediaId,
            'type': type,
            'season': season ?? 0,
            'episode': episode ?? 0,
            'duration': duration,
            'last_position': lastPosition,
            'completed': completed,
            'title': title,
            'poster_path': posterPath,
            'backdrop_path': backdropPath,
            'vote_average': voteAverage,
            'updated_at': DateTime.now().toIso8601String(),
          }),
        );
      } catch (_) {}
    }
  }

  Future<void> deleteFromHistory(String id) async {
    final idx = _history.indexWhere((h) => h.id == id);
    if (idx != -1) {
      final item = _history.removeAt(idx);
      await _saveHistory();
      notifyListeners();

      final user = AuthService().currentUser;
      if (user != null && !user.isGuest) {
        try {
          await http.delete(
            Uri.parse('$_supabaseUrl/rest/v1/histories?user_id=eq.${user.id}&media_id=eq.${item.mediaId}&type=eq.${item.type}&season=eq.${item.season ?? 0}&episode=eq.${item.episode ?? 0}'),
            headers: {
              'apikey': _supabaseKey,
              'Authorization': 'Bearer ${user.accessToken ?? _supabaseKey}',
            },
          );
        } catch (_) {}
      }
    }
  }

  Future<void> clearAll() async {
    _watchlist.clear();
    _history.clear();
    await _prefs.remove(_keyLegacyWatchlist);
    await _prefs.remove('$_keyWatchlistPrefix$_activeProfileId');
    await _prefs.remove(_keyHistory);
    await _prefs.remove('$_keyHistoryPrefix$_activeProfileId');
    notifyListeners();
  }
}
