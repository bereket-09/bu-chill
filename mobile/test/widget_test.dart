import 'package:flutter_test/flutter_test.dart';
import 'package:bu_chill/main.dart';

void main() {
  testWidgets('BuChillApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const BuChillApp());
    expect(find.byType(BuChillApp), findsOneWidget);
  });
}
