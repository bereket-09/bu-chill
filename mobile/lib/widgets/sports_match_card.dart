import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/sports_match.dart';
import '../theme/app_colors.dart';
import '../screens/sports_watch_screen.dart';

class SportsMatchCard extends StatelessWidget {
  final SportsMatch match;

  const SportsMatchCard({
    super.key,
    required this.match,
  });

  @override
  Widget build(BuildContext context) {
    final isLive = match.isLive;

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => SportsWatchScreen(match: match),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isLive ? AppColors.liveRed.withOpacity(0.4) : Colors.white.withOpacity(0.06),
            width: isLive ? 1.4 : 1.0,
          ),
          boxShadow: [
            if (isLive)
              BoxShadow(
                color: AppColors.liveRed.withOpacity(0.12),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Column(
          children: [
            // Top Row: Category & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    match.category.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMuted,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
                if (isLive)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.liveRed.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.liveRed, width: 0.8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: AppColors.liveRed,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          'LIVE NOW',
                          style: TextStyle(
                            color: AppColors.liveRed,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Text(
                    match.timeFormatted,
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Teams Row
            Row(
              children: [
                // Home Team
                Expanded(
                  child: Row(
                    children: [
                      _buildTeamBadge(match.homeTeam.badge),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          match.homeTeam.name.isNotEmpty
                              ? match.homeTeam.name
                              : match.title.split(' vs ').first,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // VS Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'VS',
                    style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

                // Away Team
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Text(
                          match.awayTeam.name.isNotEmpty
                              ? match.awayTeam.name
                              : (match.title.contains(' vs ') ? match.title.split(' vs ').last : ''),
                          textAlign: TextAlign.end,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _buildTeamBadge(match.awayTeam.badge),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamBadge(String badgeUrl) {
    if (badgeUrl.isEmpty) {
      return Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: AppColors.surface,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.shield_outlined, color: AppColors.textMuted, size: 18),
      );
    }
    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: badgeUrl,
        width: 32,
        height: 32,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(
          width: 32,
          height: 32,
          color: AppColors.surface,
        ),
        errorWidget: (_, __, ___) => Container(
          width: 32,
          height: 32,
          color: AppColors.surface,
          child: const Icon(Icons.shield_outlined, color: AppColors.textMuted, size: 18),
        ),
      ),
    );
  }
}
