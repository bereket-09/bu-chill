import '../constants/avatar_constants.dart';

class UserProfile {
  final String id;
  String name;
  String avatarId;
  bool isKid;
  bool isMain;

  UserProfile({
    required this.id,
    required this.name,
    this.avatarId = AvatarConstants.defaultAvatarId,
    this.isKid = false,
    this.isMain = false,
  });

  String get avatarUrl => AvatarConstants.getAvatarUrl(avatarId);

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'avatarId': avatarId,
        'isKid': isKid,
        'isMain': isMain,
      };

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] ?? 'main',
        name: json['name'] ?? 'Main Profile',
        avatarId: json['avatarId'] ?? AvatarConstants.defaultAvatarId,
        isKid: json['isKid'] ?? false,
        isMain: json['isMain'] ?? false,
      );
}
