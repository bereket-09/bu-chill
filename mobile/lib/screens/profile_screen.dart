import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/user_profile.dart';
import '../services/storage_service.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../widgets/avatar_selector_modal.dart';
import '../widgets/movie_card.dart';
import 'login_screen.dart';
import 'ai_concierge_screen.dart';
import 'native_player_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final StorageService _storageService = StorageService();
  final AuthService _authService = AuthService();

  String _typeFilter = 'all'; // 'all' | 'movie' | 'tv' | 'anime'
  String _sortOption = 'dateAdded'; // 'dateAdded' | 'rating' | 'title'
  bool _isManageMode = false;

  @override
  void initState() {
    super.initState();
    _storageService.addListener(_onUpdate);
    _authService.addListener(_onUpdate);
  }

  void _onUpdate() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _storageService.removeListener(_onUpdate);
    _authService.removeListener(_onUpdate);
    super.dispose();
  }

  void _clearCache() {
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('App cache and image buffer cleaned successfully!'),
          backgroundColor: AppColors.surface,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  void _showAddProfileDialog() {
    final nameController = TextEditingController();
    String selectedAvatar = '01';
    bool isKid = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: const BorderSide(color: AppColors.border),
              ),
              title: const Text(
                'Add New Profile',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Avatar Preview & Picker
                    GestureDetector(
                      onTap: () {
                        AvatarSelectorModal.show(
                          context,
                          currentAvatarId: selectedAvatar,
                          onAvatarSelected: (id) {
                            setDialogState(() => selectedAvatar = id);
                          },
                        );
                      },
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [AppColors.lightBlue, AppColors.gold],
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 36,
                              backgroundColor: AppColors.card,
                              backgroundImage: CachedNetworkImageProvider(
                                'https://be-chill.pro.et/avatars/$selectedAvatar.png',
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: AppColors.lightBlue,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.edit_rounded, color: Colors.black, size: 14),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Profile Name
                    TextField(
                      controller: nameController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Profile Name',
                        labelStyle: const TextStyle(color: AppColors.textMuted),
                        filled: true,
                        fillColor: AppColors.card,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Kids Mode Switch
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'Kids Experience',
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      subtitle: const Text(
                        'Only show family-friendly content',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                      ),
                      value: isKid,
                      activeColor: AppColors.emerald,
                      onChanged: (val) {
                        setDialogState(() => isKid = val);
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final name = nameController.text.trim();
                    if (name.isNotEmpty) {
                      await _storageService.addProfile(
                        name: name,
                        avatarId: selectedAvatar,
                        isKid: isKid,
                      );
                      if (context.mounted) Navigator.of(ctx).pop();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.lightBlue,
                    foregroundColor: Colors.black,
                  ),
                  child: const Text('Create Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showEditProfileDialog(UserProfile profile) {
    final nameController = TextEditingController(text: profile.name);
    String selectedAvatar = profile.avatarId;
    bool isKid = profile.isKid;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: const BorderSide(color: AppColors.border),
              ),
              title: const Text(
                'Edit Profile',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () {
                        AvatarSelectorModal.show(
                          context,
                          currentAvatarId: selectedAvatar,
                          onAvatarSelected: (id) {
                            setDialogState(() => selectedAvatar = id);
                          },
                        );
                      },
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [AppColors.lightBlue, AppColors.gold],
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 36,
                              backgroundColor: AppColors.card,
                              backgroundImage: CachedNetworkImageProvider(
                                'https://be-chill.pro.et/avatars/$selectedAvatar.png',
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: AppColors.lightBlue,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.edit_rounded, color: Colors.black, size: 14),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: nameController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Profile Name',
                        labelStyle: const TextStyle(color: AppColors.textMuted),
                        filled: true,
                        fillColor: AppColors.card,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'Kids Experience',
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      value: isKid,
                      activeColor: AppColors.emerald,
                      onChanged: (val) {
                        setDialogState(() => isKid = val);
                      },
                    ),
                    if (!profile.isMain && _storageService.profiles.length > 1) ...[
                      const Divider(color: Colors.white10, height: 24),
                      TextButton.icon(
                        icon: const Icon(Icons.delete_outline_rounded, color: AppColors.primaryRed),
                        label: const Text('Delete Profile', style: TextStyle(color: AppColors.primaryRed)),
                        onPressed: () async {
                          Navigator.of(ctx).pop();
                          await _storageService.deleteProfile(profile.id);
                        },
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final name = nameController.text.trim();
                    await _storageService.updateProfile(
                      profile.id,
                      name: name.isNotEmpty ? name : profile.name,
                      avatarId: selectedAvatar,
                      isKid: isKid,
                    );
                    if (context.mounted) Navigator.of(ctx).pop();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.lightBlue,
                    foregroundColor: Colors.black,
                  ),
                  child: const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeProfile = _storageService.activeProfile;
    final profiles = _storageService.profiles;
    final user = _authService.currentUser;
    final isAuthenticated = _authService.isAuthenticated;

    final filteredWatchlist = _storageService.getFilteredWatchlist(
      type: _typeFilter,
      sort: _sortOption,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text(
          'Who\'s Watching & Space',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: -0.3,
          ),
        ),
        actions: [
          TextButton.icon(
            icon: Icon(
              _isManageMode ? Icons.check_rounded : Icons.edit_rounded,
              color: AppColors.lightBlue,
              size: 16,
            ),
            label: Text(
              _isManageMode ? 'Done' : 'Manage',
              style: const TextStyle(color: AppColors.lightBlue, fontWeight: FontWeight.bold, fontSize: 13),
            ),
            onPressed: () {
              setState(() => _isManageMode = !_isManageMode);
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
        children: [
          // 1. Netflix-Style Profile Switcher Circle Tray
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Profiles',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    Text(
                      _isManageMode ? 'Tap pencil to edit' : 'Tap to switch profile',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Horizontal Profile Circles
                SizedBox(
                  height: 105,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      // Active & Available Profiles
                      ...profiles.map((p) {
                        final isActive = p.id == activeProfile.id;
                        return GestureDetector(
                          onTap: () {
                            if (_isManageMode) {
                              _showEditProfileDialog(p);
                            } else {
                              _storageService.switchProfile(p.id);
                            }
                          },
                          child: Container(
                            width: 76,
                            margin: const EdgeInsets.only(right: 12),
                            child: Column(
                              children: [
                                Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(2.5),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: isActive
                                            ? const LinearGradient(
                                                colors: [AppColors.lightBlue, AppColors.gold],
                                              )
                                            : null,
                                        border: !isActive
                                            ? Border.all(color: Colors.white24, width: 1.2)
                                            : null,
                                        boxShadow: isActive
                                            ? [
                                                BoxShadow(
                                                  color: AppColors.lightBlue.withValues(alpha: 0.4),
                                                  blurRadius: 10,
                                                  spreadRadius: 1,
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: CircleAvatar(
                                        radius: 28,
                                        backgroundColor: AppColors.surface,
                                        backgroundImage: CachedNetworkImageProvider(p.avatarUrl),
                                      ),
                                    ),
                                    if (_isManageMode)
                                      Container(
                                        width: 60,
                                        height: 60,
                                        decoration: BoxDecoration(
                                          color: Colors.black.withValues(alpha: 0.65),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.edit_rounded, color: Colors.white, size: 20),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  p.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: isActive ? AppColors.lightBlue : Colors.white,
                                    fontSize: 11,
                                    fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),

                      // Add Profile Button (up to 5 profiles)
                      if (profiles.length < 5)
                        GestureDetector(
                          onTap: _showAddProfileDialog,
                          child: SizedBox(
                            width: 76,
                            child: Column(
                              children: [
                                Container(
                                  width: 60,
                                  height: 60,
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: AppColors.border, width: 1.5),
                                  ),
                                  child: const Icon(Icons.add_rounded, color: AppColors.lightBlue, size: 28),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Add Profile',
                                  maxLines: 1,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Active Profile Details & Avatar Changer Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.card,
                  AppColors.surface,
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    // Avatar with change trigger
                    GestureDetector(
                      onTap: () {
                        AvatarSelectorModal.show(
                          context,
                          currentAvatarId: activeProfile.avatarId,
                          onAvatarSelected: (newAvatarId) {
                            _storageService.updateProfile(activeProfile.id, avatarId: newAvatarId);
                          },
                        );
                      },
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(2.5),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [AppColors.lightBlue, AppColors.gold],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.lightBlue.withValues(alpha: 0.35),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: CircleAvatar(
                              radius: 30,
                              backgroundColor: AppColors.surface,
                              backgroundImage: CachedNetworkImageProvider(activeProfile.avatarUrl),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(3.5),
                            decoration: const BoxDecoration(
                              color: AppColors.lightBlue,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.photo_library_rounded, color: Colors.black, size: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),

                    // User Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                activeProfile.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () => _showEditProfileDialog(activeProfile),
                                child: const Icon(Icons.edit_rounded, color: AppColors.lightBlue, size: 14),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isAuthenticated ? (user!.isGuest ? 'Guest Explorer' : user.email) : 'Bu-Chill Streaming Pass',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.lightBlue.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: AppColors.lightBlue.withValues(alpha: 0.4)),
                                ),
                                child: Text(
                                  isAuthenticated && !user!.isGuest ? 'VIP MEMBER' : 'FREE PASS',
                                  style: const TextStyle(
                                    color: AppColors.lightBlue,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              if (activeProfile.isKid) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.emerald.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: AppColors.emerald.withValues(alpha: 0.4)),
                                  ),
                                  child: const Text(
                                    'KIDS SAFE',
                                    style: TextStyle(
                                      color: AppColors.emerald,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Action Buttons
                Row(
                  children: [
                    // Change Avatar Button
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          AvatarSelectorModal.show(
                            context,
                            currentAvatarId: activeProfile.avatarId,
                            onAvatarSelected: (newAvatarId) {
                              _storageService.updateProfile(activeProfile.id, avatarId: newAvatarId);
                            },
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        icon: const Icon(Icons.face_rounded, size: 16, color: AppColors.lightBlue),
                        label: const Text('Change Avatar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Auth Switch
                    if (!isAuthenticated || user!.isGuest)
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.lightBlue,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          icon: const Icon(Icons.login_rounded, size: 16, color: Colors.black),
                          label: const Text('Sign In', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      )
                    else
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _authService.signOut(),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.textMuted,
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          icon: const Icon(Icons.logout_rounded, size: 16),
                          label: const Text('Sign Out', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // 3. AI Concierge Banner
          GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AiConciergeScreen()),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.lightBlue.withValues(alpha: 0.15),
                    AppColors.gold.withValues(alpha: 0.15),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.lightBlue.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.lightBlue, AppColors.gold],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.auto_awesome_rounded, color: Colors.black, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Bu-Chill AI Concierge',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Personalized mood-based recommendations & search',
                          style: TextStyle(color: AppColors.textLight, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.lightBlue),
                ],
              ),
            ),
          ),
          // 3.5. CONTINUE WATCHING (CROSS-PLATFORM WATCH HISTORY)
          if (_storageService.history.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 3.5,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.lightBlue,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Continue Watching',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                Text(
                  '${_storageService.history.length} titles',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 145,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _storageService.history.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final item = _storageService.history[index];
                  return GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => NativePlayerScreen(
                            id: item.mediaId,
                            title: item.title,
                            isTv: item.isTv,
                            season: item.season ?? 1,
                            episode: item.episode ?? 1,
                          ),
                        ),
                      );
                    },
                    child: Container(
                      width: 200,
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                CachedNetworkImage(
                                  imageUrl: item.backdropUrl,
                                  fit: BoxFit.cover,
                                  placeholder: (_, __) => Container(color: AppColors.surface),
                                  errorWidget: (context, url, error) => Container(
                                    color: AppColors.surface,
                                    child: const Center(
                                      child: Icon(Icons.play_circle_outline, color: Colors.white54, size: 32),
                                    ),
                                  ),
                                ),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        Colors.transparent,
                                        Colors.black.withValues(alpha: 0.7),
                                      ],
                                    ),
                                  ),
                                ),
                                Center(
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.6),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white30),
                                    ),
                                    child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                                  ),
                                ),
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: GestureDetector(
                                    onTap: () => _storageService.deleteFromHistory(item.id),
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.7),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.close_rounded, color: Colors.white70, size: 14),
                                    ),
                                  ),
                                ),
                                if (item.progress > 0)
                                  Positioned(
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    child: LinearProgressIndicator(
                                      value: item.progress,
                                      backgroundColor: Colors.white24,
                                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.lightBlue),
                                      minHeight: 3,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  item.isTv
                                      ? 'S${item.season ?? 1} E${item.episode ?? 1}'
                                      : (item.completed ? 'Finished' : 'In Progress'),
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 22),
          ],

          // 4. MY WATCHLIST SECTION WITH RICH FILTERS (matching website MySpace)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 3.5,
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.gold,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${activeProfile.name}\'s Watchlist',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Text(
                '${filteredWatchlist.length} titles',
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Filter & Sort Bar
          Row(
            children: [
              // Type Filter Chips
              Expanded(
                child: SizedBox(
                  height: 32,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _buildTypeFilterChip('all', 'All'),
                      const SizedBox(width: 6),
                      _buildTypeFilterChip('movie', 'Movies'),
                      const SizedBox(width: 6),
                      _buildTypeFilterChip('tv', 'Series'),
                      const SizedBox(width: 6),
                      _buildTypeFilterChip('anime', 'Anime'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Sort Dropdown
              PopupMenuButton<String>(
                initialValue: _sortOption,
                tooltip: 'Sort Watchlist',
                color: AppColors.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppColors.border),
                ),
                onSelected: (val) {
                  setState(() => _sortOption = val);
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'dateAdded', child: Text('Date Added', style: TextStyle(color: Colors.white, fontSize: 12))),
                  const PopupMenuItem(value: 'rating', child: Text('Rating (High)', style: TextStyle(color: Colors.white, fontSize: 12))),
                  const PopupMenuItem(value: 'title', child: Text('Title (A-Z)', style: TextStyle(color: Colors.white, fontSize: 12))),
                ],
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.sort_rounded, color: AppColors.lightBlue, size: 14),
                      SizedBox(width: 4),
                      Text('Sort', style: TextStyle(color: Colors.white, fontSize: 11)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Watchlist Media Grid
          if (filteredWatchlist.isEmpty)
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: Column(
                  children: [
                    const Icon(Icons.bookmark_border_rounded, color: AppColors.textMuted, size: 38),
                    const SizedBox(height: 10),
                    Text(
                      'No ${_typeFilter == 'all' ? '' : '$_typeFilter '}titles in watchlist',
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Tap the bookmark icon on any movie or series to add it here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 14,
                childAspectRatio: 0.58,
              ),
              itemCount: filteredWatchlist.length,
              itemBuilder: (context, index) {
                final movie = filteredWatchlist[index];
                return Stack(
                  children: [
                    MovieCard(movie: movie),
                    // Remove shortcut
                    Positioned(
                      top: 4,
                      left: 4,
                      child: GestureDetector(
                        onTap: () {
                          _storageService.removeFromWatchlist(movie.id);
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.75),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded, color: Colors.white70, size: 12),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          const SizedBox(height: 24),

          // Storage Cleaner
          ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: AppColors.card,
            leading: const Icon(Icons.cleaning_services_rounded, color: AppColors.lightBlue),
            title: const Text('Clean Temporary Storage', style: TextStyle(color: Colors.white, fontSize: 14)),
            subtitle: const Text('Purge cached thumbnails and video buffer', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
            onTap: _clearCache,
          ),
          const SizedBox(height: 24),

          // App Footer
          Center(
            child: Column(
              children: const [
                Text(
                  'Bu-Chill Mobile App v2.5.0 • AMOLED Edition\nIntegrated with be-chill.pro.et',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeFilterChip(String key, String label) {
    final isSelected = _typeFilter == key;
    return GestureDetector(
      onTap: () => setState(() => _typeFilter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.lightBlue : AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? AppColors.lightBlue : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.black : Colors.white70,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
