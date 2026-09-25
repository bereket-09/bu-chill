class AvatarPreset {
  final String id;
  final String name;
  final String category;

  const AvatarPreset({
    required this.id,
    required this.name,
    required this.category,
  });

  String get url => 'https://be-chill.pro.et/avatars/$id.png';
}

class AvatarConstants {
  AvatarConstants._();

  static const String defaultAvatarId = '01';

  static const List<AvatarPreset> presets = [
    AvatarPreset(id: '01', name: 'Bu-Chill Smiley', category: 'Classic'),
    AvatarPreset(id: '02', name: 'Lightning McQueen', category: 'Pixar'),
    AvatarPreset(id: '03', name: 'Buzz Lightyear', category: 'Pixar'),
    AvatarPreset(id: '04', name: 'Jack-Jack', category: 'Pixar'),
    AvatarPreset(id: '05', name: 'Minnie Mouse', category: 'Disney'),
    AvatarPreset(id: '06', name: 'Mirabel', category: 'Disney'),
    AvatarPreset(id: '07', name: 'Joe Gardner', category: 'Pixar'),
    AvatarPreset(id: '08', name: 'Grogu (Baby Yoda)', category: 'Star Wars'),
    AvatarPreset(id: '09', name: 'Loki', category: 'Marvel'),
    AvatarPreset(id: '10', name: 'Wanda Maximoff', category: 'Marvel'),
    AvatarPreset(id: '11', name: 'Iron Man', category: 'Marvel'),
    AvatarPreset(id: '12', name: 'Black Panther', category: 'Marvel'),
    AvatarPreset(id: '13', name: 'Simba', category: 'Disney'),
    AvatarPreset(id: '14', name: 'Shang-Chi', category: 'Marvel'),
    AvatarPreset(id: '15', name: 'Moana', category: 'Disney'),
    AvatarPreset(id: '16', name: 'Po Panda', category: 'Animation'),
    AvatarPreset(id: '17', name: 'The Mandalorian', category: 'Star Wars'),
    AvatarPreset(id: '18', name: 'Penguin', category: 'Animation'),
    AvatarPreset(id: '19', name: 'Olaf', category: 'Disney'),
    AvatarPreset(id: '20', name: 'Stitch', category: 'Disney'),
    AvatarPreset(id: '21', name: 'Woody', category: 'Pixar'),
    AvatarPreset(id: '22', name: 'Nemo', category: 'Pixar'),
    AvatarPreset(id: '23', name: 'Doctor Strange', category: 'Marvel'),
    AvatarPreset(id: '24', name: 'Thor', category: 'Marvel'),
    AvatarPreset(id: '25', name: 'Groot', category: 'Marvel'),
    AvatarPreset(id: '26', name: 'Spider-Man', category: 'Marvel'),
    AvatarPreset(id: '27', name: 'Captain America', category: 'Marvel'),
    AvatarPreset(id: '28', name: 'Hulk', category: 'Marvel'),
  ];

  static String getAvatarUrl(String? id) {
    final cleanId = (id == null || id.isEmpty) ? defaultAvatarId : id;
    return 'https://be-chill.pro.et/avatars/$cleanId.png';
  }
}
