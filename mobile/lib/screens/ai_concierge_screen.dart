import 'package:flutter/material.dart';
import '../services/ai_service.dart';
import '../services/movies_service.dart';
import '../theme/app_colors.dart';
import 'detail_screen.dart';

class AiConciergeScreen extends StatefulWidget {
  const AiConciergeScreen({super.key});

  @override
  State<AiConciergeScreen> createState() => _AiConciergeScreenState();
}

class _AiConciergeScreenState extends State<AiConciergeScreen> {
  final AiService _aiService = AiService();
  final MoviesService _moviesService = MoviesService();

  final List<AiMessage> _messages = [
    AiMessage(
      role: 'assistant',
      content:
          '👋 Hello! I am **Bu-Chill AI**, your personal streaming concierge.\n\nTell me your mood, favorite actors, or what kind of movie or anime you feel like watching, and I\'ll find the perfect match right now!',
    ),
  ];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;

  final List<Map<String, String>> _vibeChips = [
    {'label': '🔥 Trending Now', 'prompt': 'What are the top 3 trending must-watch movies or shows right now?'},
    {'label': '🪐 Mind-Bending Sci-Fi', 'prompt': 'Recommend 3 mind-bending sci-fi movies like Interstellar or Inception.'},
    {'label': '⚔️ Epic Action Anime', 'prompt': 'What are the best fast-paced action anime series to binge watch?'},
    {'label': '🍿 Feel-Good Comedy', 'prompt': 'Give me 3 hilarious feel-good comedies to lift my spirits.'},
    {'label': '🕵️ Plot-Twist Mystery', 'prompt': 'Recommend 3 gripping detective or mystery thrillers with crazy plot twists.'},
    {'label': '🩸 Dark Psychological', 'prompt': 'Recommend 3 intense psychological thrillers or dark mysteries.'},
    {'label': '🏆 Award Blockbusters', 'prompt': 'What are 3 critically acclaimed cinema masterpieces from recent years?'},
  ];

  void _sendMessage(String text) async {
    final clean = text.trim();
    if (clean.isEmpty || _isSending) return;

    _textController.clear();
    setState(() {
      _messages.add(AiMessage(role: 'user', content: clean));
      _isSending = true;
    });

    _scrollToBottom();

    final response = await _aiService.sendMessage(_messages, clean);

    if (mounted) {
      setState(() {
        _messages.add(AiMessage(role: 'assistant', content: response));
        _isSending = false;
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  void _openMovieDetail(String query) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
        ),
      ),
    );

    final results = await _moviesService.searchMedia(query);
    if (mounted) {
      Navigator.of(context).pop(); // dismiss loading
      if (results.isNotEmpty) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => DetailScreen(movie: results.first)),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not find "$query" on Bu-Chill catalog.'),
            backgroundColor: AppColors.card,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _clearChat() {
    setState(() {
      _messages.clear();
      _messages.add(
        AiMessage(
          role: 'assistant',
          content:
              '✨ Conversation refreshed! Tell me what you\'d like to stream today, or pick a vibe chip above.',
        ),
      );
    });
  }

  List<String> _extractSuggestedTitles(String content) {
    final List<String> titles = [];
    final boldRegex = RegExp(r'\*\*([^*]+)\*\*');
    final matches = boldRegex.allMatches(content);
    for (final m in matches) {
      final title = m.group(1)?.trim();
      if (title != null &&
          title.length > 2 &&
          title.length < 40 &&
          !title.contains('Bu-Chill') &&
          !title.contains('Why watch') &&
          !title.contains('Genre') &&
          !title.contains('Rating')) {
        titles.add(title);
      }
    }
    return titles.take(3).toList();
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.lightBlue, AppColors.gold],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome_rounded, color: Colors.black, size: 18),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Bu-Chill AI Concierge',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '🟢 Live Assistant • Groq LLaMA 3.3',
                  style: TextStyle(
                    color: AppColors.lightBlue,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white70, size: 20),
            tooltip: 'Clear Chat',
            onPressed: _clearChat,
          ),
        ],
      ),
      body: Column(
        children: [
          // Vibe Prompt Chips Bar
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: const BoxDecoration(
              color: AppColors.background,
              border: Border(bottom: BorderSide(color: AppColors.border, width: 0.8)),
            ),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: _vibeChips.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final chip = _vibeChips[index];
                return ActionChip(
                  label: Text(
                    chip['label']!,
                    style: const TextStyle(color: AppColors.textLight, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                  backgroundColor: AppColors.card,
                  side: const BorderSide(color: AppColors.border, width: 0.8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  onPressed: () => _sendMessage(chip['prompt']!),
                );
              },
            ),
          ),

          // Message Stream
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: _messages.length + (_isSending ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isSending) {
                  return Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
                            ),
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Bu-Chill AI is searching stream catalog...',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final msg = _messages[index];
                final isUser = msg.role == 'user';
                final suggestedTitles = !isUser ? _extractSuggestedTitles(msg.content) : <String>[];

                return Column(
                  crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.84,
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isUser ? AppColors.lightBlue : AppColors.card,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
                            bottomRight: isUser ? Radius.zero : const Radius.circular(16),
                          ),
                          border: isUser ? null : Border.all(color: AppColors.border),
                          boxShadow: [
                            if (isUser)
                              BoxShadow(
                                color: AppColors.lightBlue.withValues(alpha: 0.25),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                          ],
                        ),
                        child: Text(
                          msg.content,
                          style: TextStyle(
                            color: isUser ? Colors.black : Colors.white,
                            fontSize: 13.5,
                            height: 1.5,
                            fontWeight: isUser ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ),
                    ),

                    // Quick-Action Title Chips (tap to open detail page immediately)
                    if (suggestedTitles.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12, left: 4),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: suggestedTitles.map((title) {
                            return ActionChip(
                              avatar: const Icon(Icons.play_circle_fill_rounded, color: AppColors.lightBlue, size: 16),
                              label: Text(
                                'View "$title"',
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              backgroundColor: AppColors.surface,
                              side: const BorderSide(color: AppColors.border),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              onPressed: () => _openMovieDetail(title),
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),

          // Bottom Input Capsule
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: const Border(top: BorderSide(color: AppColors.border, width: 0.8)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.border),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: TextField(
                        controller: _textController,
                        style: const TextStyle(color: Colors.white, fontSize: 13.5),
                        textInputAction: TextInputAction.send,
                        onSubmitted: _sendMessage,
                        decoration: const InputDecoration(
                          hintText: 'Ask for recommendations, movies, or anime...',
                          hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 12.5),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.lightBlue, Color(0xFF0284C7)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send_rounded, color: Colors.black, size: 18),
                      onPressed: () => _sendMessage(_textController.text),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
