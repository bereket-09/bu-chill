import 'package:flutter/material.dart';
import '../models/live_channel.dart';
import '../services/live_tv_service.dart';
import '../theme/app_colors.dart';
import '../widgets/live_channel_card.dart';

class LiveTvScreen extends StatefulWidget {
  const LiveTvScreen({super.key});

  @override
  State<LiveTvScreen> createState() => _LiveTvScreenState();
}

class _LiveTvScreenState extends State<LiveTvScreen> {
  final LiveTvService _service = LiveTvService();

  List<LiveChannel> _allChannels = [];
  List<String> _categories = ['All'];
  List<String> _countries = ['All'];

  String _selectedCategory = 'All';
  String _selectedCountry = 'All';
  String _searchQuery = '';
  bool _isLoading = true;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadChannels();
  }

  Future<void> _loadChannels() async {
    setState(() => _isLoading = true);
    final channels = await _service.fetchChannels();
    if (mounted) {
      setState(() {
        _allChannels = channels;
        _categories = _service.extractCategories(channels);
        _countries = _service.extractCountries(channels);
        _isLoading = false;
      });
    }
  }

  List<LiveChannel> get _filteredChannels {
    return _allChannels.where((ch) {
      if (_selectedCategory != 'All' && ch.group.toLowerCase() != _selectedCategory.toLowerCase()) {
        return false;
      }
      if (_selectedCountry != 'All' && ch.country?.toLowerCase() != _selectedCountry.toLowerCase()) {
        return false;
      }
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchName = ch.name.toLowerCase().contains(query);
        final matchGroup = ch.group.toLowerCase().contains(query);
        final matchCountry = (ch.country ?? '').toLowerCase().contains(query);
        if (!matchName && !matchGroup && !matchCountry) return false;
      }
      return true;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredChannels;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundDark,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.emerald,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'IPTV',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Live TV Channels',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryRed),
              ),
            )
          : Column(
              children: [
                // Search Field
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.06)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search 2,900+ live TV channels...',
                        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                        prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, color: AppColors.textMuted),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onChanged: (val) {
                        setState(() => _searchQuery = val);
                      },
                    ),
                  ),
                ),

                // Country & Category Row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.public_rounded, size: 16, color: AppColors.textMuted),
                      const SizedBox(width: 6),
                      DropdownButton<String>(
                        value: _selectedCountry,
                        dropdownColor: AppColors.surface,
                        underline: const SizedBox.shrink(),
                        icon: const Icon(Icons.arrow_drop_down, color: AppColors.primaryRed),
                        items: _countries.take(25).map((country) {
                          return DropdownMenuItem<String>(
                            value: country,
                            child: Text(
                              country,
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedCountry = val);
                          }
                        },
                      ),
                    ],
                  ),
                ),

                // Category Chips
                SizedBox(
                  height: 40,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = cat == _selectedCategory;

                      return ChoiceChip(
                        label: Text(cat),
                        selected: isSelected,
                        selectedColor: AppColors.primaryRed,
                        backgroundColor: AppColors.surface,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textMuted,
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: BorderSide(
                            color: isSelected ? AppColors.primaryRed : Colors.white.withOpacity(0.06),
                          ),
                        ),
                        onSelected: (_) {
                          setState(() => _selectedCategory = cat);
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: 12),

                // Grid View
                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.tv_off_rounded, color: AppColors.textMuted, size: 48),
                              SizedBox(height: 12),
                              Text(
                                'No channels matching filters.',
                                style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                              ),
                            ],
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 90),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 1.25,
                          ),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            return LiveChannelCard(channel: filtered[index]);
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
