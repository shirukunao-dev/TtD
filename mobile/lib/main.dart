import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

import 'config/firebase_config.dart';
import 'screens/home_screen.dart';
import 'services/firebase_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseDatabase.instance.databaseURL = kFirebaseDatabaseUrl;
  final firebase = FirebaseService(FirebaseDatabase.instance);
  runApp(SignatureApp(firebase: firebase));
}

class SignatureApp extends StatelessWidget {
  const SignatureApp({super.key, required this.firebase});

  final FirebaseService firebase;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Signature Sync',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1565C0)),
        useMaterial3: true,
      ),
      home: HomeScreen(firebase: firebase),
    );
  }
}
