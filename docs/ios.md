# Sleepy Little Friends — iOS

Encargo del 5 de septiembre de 2026: solo Apple, iPhone y iPad, TestFlight. Nombre en Apple: Sleepy Little Friends. Se conservan las seis habitaciones, 36 actividades, gráficos y 102 audios de ElevenLabs, incluida Valeria de España y Sarah como opción.

La app usa React y Capacitor 8.5.1 con recursos incluidos. No necesita iniciar sesión ni conectarse a Sites o ElevenLabs. En la primera instalación se elige el primer idioma compatible del dispositivo (es/en; fallback en). El selector ES/EN conserva cualquier elección manual al volver a abrir. El progreso se guarda localmente.

## Proyecto y pruebas

- Xcode: `ios/App/App.xcodeproj`, esquema compartido `App`, iOS 16.4 o superior (mínimo de Safari del diseño con Tailwind 4).

- Versión iOS: 0.3 (1). Bundle ID: `com.krazel.animalitosadormir`.

- App Store Connect: https://appstoreconnect.apple.com/apps/6809010193/testflight

- Generar recursos: `npm ci`, `npm run sync:ios`.

- Validación local: `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/verify-native.mjs`.

- macOS: `node scripts/simulator-qa.mjs` ejecuta XCTest en un iPhone y genera una captura de arranque en iPad. Evidencia en `artifacts/`.

- TestFlight: workflow manual `.github/workflows/testflight.yml`. Primero pruebas sin secretos. El segundo trabajo recibe firma exclusivamente desde el entorno `app-store-production`, limitado a main. Se verifica la identidad del archive, firma y las tres colecciones de 34 audios antes de validar y subir.

- Los secretos no están en el repositorio ni en el binario. La API de voz no se usa en ejecución.

- Icono: rasterización de `public/favicon.svg`, conservando luna y estrella. Diseño del juego sin cambios.

## Estado de entrega

**Disponible en TestFlight interno:** 0.3 (1), comprobado el 5 de septiembre de 2026 por API e interfaz de Apple. Estado `VALID` / `IN_BETA_TESTING`; grupo Krazel Internal con un tester autorizado en estado Invitado. No hay beta externa ni publicación pública en App Store. Ficha creada con acceso limitado. Sin anuncios ni compras.

- [Ejecución completada](https://github.com/Krazel/sleepy-little-friends-ios/actions/runs/33985594899), commit `1a3d6ce1d457c27817e4785aac269bfacb2c7a33`.
- Build de Apple: `8de1184d-6b2e-48ff-969e-55d84f378eb0`.
- IPA local: `artifacts/release-0.3-build1/SleepyLittleFriends-0.3-build1-TestFlight.ipa` (16.961.881 bytes), firma verificada y subida aceptada.
- SHA-256: `e6a36a2e8beeef8af72fb6fbae89ea188e1330f2ec8f8f9f189122f9644cc38b`.
- 39 pruebas de lógica, typecheck, lint y paquete nativo correctos. XCTest en iPhone 17e con iOS 26.5: navegación, cambio ES/EN, selección y vista previa de Valeria/Sarah, persistencia del inglés tras reinicio con dispositivo en español.
- Arranque y captura en iPad Pro 13 M5 revisados. Capturas y manifiestos en `docs/evidence/ios-0.3-build1/`.
- El IPA descargado conserva mínimo iOS 16.4, familias iPhone/iPad, manifiesto de privacidad y 34 audios por colección (102 en total). Hash cotejado con CI.
- Pruebas en dispositivo físico y escucha humana de la narración pendientes: no se presentan las pruebas de simulador como pruebas físicas.

Las opciones usan un selector accesible dentro del WebView nativo. Las pruebas desplazan los paneles antes de pulsar controles recortados; no se omiten las comprobaciones de idioma o voz. El arranque de Capacitor utiliza una única ventana programática.

El usuario autorizó expresamente iOS 16.4 y la subida. Responsable: tarea 01a06ecc-71e2-77c1-a108-08f629f41bea. La publicación web sigue en Sites v5 (commit 4643519); la beta iOS es 0.3 (1).
