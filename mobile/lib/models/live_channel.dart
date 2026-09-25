class LiveChannel {
  final String id;
  final String name;
  final String? logo;
  final String group;
  final String? category;
  final String url;
  final String? country;
  final String? countryCode;
  final String? countryFlag;
  final String? language;

  const LiveChannel({
    required this.id,
    required this.name,
    this.logo,
    this.group = 'General',
    this.category,
    required this.url,
    this.country,
    this.countryCode,
    this.countryFlag,
    this.language,
  });

  factory LiveChannel.fromJson(Map<String, dynamic> json) {
    return LiveChannel(
      id: json['id'] ?? json['name'] ?? '',
      name: json['name'] ?? 'Channel',
      logo: json['logo'],
      group: json['group'] ?? 'General',
      category: json['category'] ?? json['group'],
      url: json['url'] ?? '',
      country: json['country'],
      countryCode: json['countryCode'],
      countryFlag: json['countryFlag'],
      language: json['language'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'logo': logo,
        'group': group,
        'category': category,
        'url': url,
        'country': country,
        'countryCode': countryCode,
        'countryFlag': countryFlag,
        'language': language,
      };
}
