import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/live_channel.dart';
import '../theme/app_colors.dart';
import '../screens/live_player_screen.dart';

class LiveChannelCard extends StatelessWidget {
  final LiveChannel channel;

  const LiveChannelCard({
    super.key,
    required this.channel,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => LivePlayerScreen(channel: channel),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withOpacity(0.06),
            width: 1.0,
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: Flag + Group
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (channel.countryFlag != null && channel.countryFlag!.isNotEmpty)
                  Text(
                    channel.countryFlag!,
                    style: const TextStyle(fontSize: 14),
                  )
                else
                  Text(
                    channel.countryCode ?? 'TV',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMuted,
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    channel.group,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),

            // Center Logo
            Center(
              child: SizedBox(
                height: 48,
                child: channel.logo != null && channel.logo!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: channel.logo!,
                        fit: BoxFit.contain,
                        placeholder: (_, __) => const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryLightBlue),
                          ),
                        ),
                        errorWidget: (_, __, ___) => const Icon(
                          Icons.live_tv_rounded,
                          color: AppColors.textMuted,
                          size: 32,
                        ),
                      )
                    : const Icon(
                        Icons.live_tv_rounded,
                        color: AppColors.textMuted,
                        size: 32,
                      ),
              ),
            ),
            const Spacer(),

            // Channel Name & Status
            Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: AppColors.emerald,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    channel.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
