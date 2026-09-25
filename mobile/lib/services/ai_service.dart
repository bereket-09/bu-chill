import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class AiMessage {
  final String role; // 'user', 'assistant', 'system'
  final String content;

  AiMessage({required this.role, required this.content});

  Map<String, dynamic> toJson() => {'role': role, 'content': content};
  factory AiMessage.fromJson(Map<String, dynamic> json) =>
      AiMessage(role: json['role'] ?? 'assistant', content: json['content'] ?? '');
}

class AiService {
  static final AiService _instance = AiService._internal();
  factory AiService() => _instance;
  AiService._internal();

  static const String _groqApiKey =
      String.fromEnvironment('GROQ_API_KEY', defaultValue: '');
  static const String _endpoint =
      'https://api.groq.com/openai/v1/chat/completions';

  static const String _systemPrompt = '''
You are Bu-Chill AI, the intelligent cinematic concierge for Bu-Chill (be-chill.pro.et).
You help users discover movies, TV series, anime, and live sports fixtures with style, warmth, and encyclopedic film knowledge.
Be concise, vibrant, and recommend exact movie and series titles with release years.
Format titles in **bold** with year, e.g. **Inception (2010)** or **Attack on Titan (2013)**.
''';

  Future<String> sendMessage(List<AiMessage> history, String userPrompt) async {
    try {
      final messages = [
        {'role': 'system', 'content': _systemPrompt},
        ...history.map((m) => m.toJson()),
        {'role': 'user', 'content': userPrompt},
      ];

      if (_groqApiKey.isNotEmpty) {
        final response = await http.post(
          Uri.parse(_endpoint),
          headers: {
            'Authorization': 'Bearer $_groqApiKey',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'model': 'llama-3.3-70b-versatile',
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 600,
          }),
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final reply = data['choices']?[0]?['message']?['content'] ??
              'I couldn\'t fetch recommendations right now.';
          return reply.trim();
        }
      }

      // Fallback to official Bu-Chill backend AI proxy
      final proxyResponse = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/ai/chat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'messages': [
            ...history.map((m) => m.toJson()),
            {'role': 'user', 'content': userPrompt},
          ],
        }),
      );

      if (proxyResponse.statusCode == 200) {
        final data = jsonDecode(proxyResponse.body);
        final reply = data['message'] ?? '';
        if (reply.isNotEmpty) return reply.trim();
      }

      return "🍿 **Bu-Chill Recommendations**:\nHere are top picks you'll love:\n- **Dune: Part Two (2024)** - Sci-Fi masterpiece\n- **Severance (2022)** - Thrilling mystery\n- **The Bear (2022)** - High-voltage culinary drama";
    } catch (e) {
      return 'Network connection error. Please ensure you are connected to the internet.';
    }
  }
}
