import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class UserModel {
  final String id;
  final String email;
  final String? username;
  final String? avatar;
  final String? accessToken;
  final bool isGuest;

  UserModel({
    required this.id,
    required this.email,
    this.username,
    this.avatar,
    this.accessToken,
    this.isGuest = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'username': username,
        'avatar': avatar,
        'accessToken': accessToken,
        'isGuest': isGuest,
      };

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? '',
        email: json['email'] ?? 'guest@bu-chill.pro',
        username: json['username'],
        avatar: json['avatar'],
        accessToken: json['accessToken'],
        isGuest: json['isGuest'] ?? false,
      );
}

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  static const String _supabaseUrl =
      'https://vuzgkwkeyqdinbmsoosg.supabase.co';
  static const String _supabaseKey =
      'sb_publishable_8n51gz88ZUEU-kaiU6W6yg_w_NQiwXS';
  static const String _userPrefsKey = 'buchill_auth_user';

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  Map<String, String> get _headers => {
        'apikey': _supabaseKey,
        'Authorization': 'Bearer $_supabaseKey',
        'Content-Type': 'application/json',
      };

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userPrefsKey);
    if (userJson != null) {
      try {
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
        notifyListeners();
      } catch (_) {}
    }
  }

  Future<bool> signIn(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$_supabaseUrl/auth/v1/token?grant_type=password'),
        headers: _headers,
        body: jsonEncode({'email': email.trim(), 'password': password}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final userMap = data['user'] ?? {};
        final meta = userMap['user_metadata'] as Map<String, dynamic>?;
        final username = meta?['username'] ?? meta?['full_name'] ?? meta?['name'] ?? email.split('@').first;
        final avatar = meta?['avatar'] ?? meta?['avatar_id'] ?? '01';

        _currentUser = UserModel(
          id: userMap['id'] ?? '',
          email: userMap['email'] ?? email,
          username: username?.toString(),
          avatar: avatar?.toString(),
          accessToken: data['access_token'],
          isGuest: false,
        );
        await _saveUser();
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> signUp(String email, String password, {String? username}) async {
    try {
      final cleanUsername = (username != null && username.trim().isNotEmpty)
          ? username.trim()
          : email.split('@').first;

      final res = await http.post(
        Uri.parse('$_supabaseUrl/auth/v1/signup'),
        headers: _headers,
        body: jsonEncode({
          'email': email.trim(),
          'password': password,
          'data': {
            'username': cleanUsername,
            'full_name': cleanUsername,
            'avatar': '01',
            'avatar_id': '01',
          },
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        final userMap = data['user'] ?? data;
        final meta = userMap['user_metadata'] as Map<String, dynamic>?;

        _currentUser = UserModel(
          id: userMap['id'] ?? '',
          email: userMap['email'] ?? email,
          username: meta?['username'] ?? cleanUsername,
          avatar: meta?['avatar'] ?? '01',
          accessToken: data['access_token'],
          isGuest: false,
        );
        await _saveUser();
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> updateAvatar(String newAvatarId) async {
    if (_currentUser == null) return;
    _currentUser = UserModel(
      id: _currentUser!.id,
      email: _currentUser!.email,
      username: _currentUser!.username,
      avatar: newAvatarId,
      accessToken: _currentUser!.accessToken,
      isGuest: _currentUser!.isGuest,
    );
    await _saveUser();
    notifyListeners();

    if (_currentUser!.accessToken != null && !_currentUser!.isGuest) {
      try {
        await http.put(
          Uri.parse('$_supabaseUrl/auth/v1/user'),
          headers: {
            ..._headers,
            'Authorization': 'Bearer ${_currentUser!.accessToken}',
          },
          body: jsonEncode({
            'data': {
              'avatar': newAvatarId,
              'avatar_id': newAvatarId,
            },
          }),
        );
      } catch (_) {}
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      final res = await http.post(
        Uri.parse('$_supabaseUrl/auth/v1/recover'),
        headers: _headers,
        body: jsonEncode({'email': email.trim()}),
      );
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  Future<void> continueAsGuest() async {
    _currentUser = UserModel(
      id: 'guest_${DateTime.now().millisecondsSinceEpoch}',
      email: 'guest@buchill.pro',
      isGuest: true,
    );
    await _saveUser();
    notifyListeners();
  }

  Future<void> signOut() async {
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userPrefsKey);
    notifyListeners();
  }

  Future<void> _saveUser() async {
    if (_currentUser == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userPrefsKey, jsonEncode(_currentUser!.toJson()));
  }
}
