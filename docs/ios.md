# Sleepy Little Friends — iOS

Encargo del 5 de septiembre de 2026: solo Apple, iPhone y iPad, TestFlight. Nombre en Apple: Sleepy Little Friends. Se conservan las seis habitaciones, 36 actividades, gráficos y 68 voces de ElevenLabs aprobados en la web.

La app usa React y Capacitor 8.5.1 con recursos incluidos. No necesita iniciar sesión ni conectarse a Sites o ElevenLabs. En la primera instalación se elige el primer idioma compatible del dispositivo (es/en; fallback en). El selector ES/EN conserva cualquier elección manual al volver a abrir. El progreso se guarda localmente.

## Proyecto y pruebas

- Xcode: `ios/App/App.xcodeproj`, esquema compartido `App`, iOS 16.4 o superior (m�nimo de Safari del dise�o con Tailwind 4).
- Versión iOS: 0.3 (1). Bundle ID: `com.krazel.animalitosadormir`.
- App Store Connect: https://appstoreconnect.apple.com/apps/6809010193/testflight
- Generar recursos: `npm ci`, `npm run sync:ios`.
- Validación local: `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/verify-native.mjs`.
- macOS: `node scripts/simulator-qa.mjs` ejecuta XCTest en un iPhone y genera una captura de arranque en iPad. Evidencia en `artifacts/`.
- TestFlight: workflow manual `.github/workflows/testflight.yml`. Primero pruebas sin secretos. El segundo trabajo recibe firma exclusivamente desde el entorno `app-store-production`, limitado a main. Se verifica la identidad del archive, firma y los 68 audios antes de validar y subir.
- Los secretos no están en el repositorio ni en el binario. La API de voz no se usa en ejecución.
- Icono: rasterización de `public/favicon.svg`, conservando luna y estrella. Diseño del juego sin cambios.

## Estado de entrega

Ficha creada en App Store Connect con acceso limitado autorizado. Compilación, validación nativa y subida pendientes de ejecución y resultado. No publicado en App Store. Sin anuncios ni compras integrados. Prueba en dispositivo físico pendiente.

Responsable: tarea 01a06ecc-71e2-77c1-a108-08f629f41bea. La publicación web existente sigue siendo la versión 0.2.2 de Sites; la versión 0.3 corresponde a iOS.
