# Animalitos a dormir

Juego completo para móvil y navegador, para acompañar a peques de 2–5 años.

## Jugar

- Luna: toca o arrastra la manta hacia la conejita y dale un besito.
- Milo: acerca el cojín al gatito y toca su lámpara de estrella.
- Nube: dale el peluche y toca la nota musical para cantarle una nana.
- Al terminar cada habitación, la flecha permite seguir. La noche acaba cuando los tres duermen.
- El botón de sonido silencia toda la experiencia. «Para mayores» permite cambiar pistas habladas, movimiento y empezar otra noche.
- El progreso se conserva solo en este navegador. No hay anuncios, compras, cuentas de juego ni analítica.

## Desarrollo

Node 22.13+ y npm. Instalar con npm ci. npm run dev abre la versión de desarrollo. npm run build produce una exportación estática en dist/client con service worker. npm test valida lógica, persistencia, gestos y recursos; npm run typecheck valida TypeScript.

## Móvil y sin conexión

Abrir la URL desplegada una primera vez con conexión y esperar a que carguen las habitaciones. Desde el menú del navegador, añadir a la pantalla de inicio. El service worker guarda la app y sus recursos. La primera visita a un despliegue privado de Sites requiere la cuenta autorizada. Las voces dependen del soporte de síntesis del dispositivo; los sonidos y la nana se generan localmente con Web Audio. Si el navegador no permite audio, voz, almacenamiento o instalación, el juego sigue funcionando mediante sus controles visuales.

La entrega es una aplicación web instalable, no un binario de App Store ni Google Play.

## Arte

Tres sprites originales generados con imagegen. Las imágenes contienen la habitación y un objeto independiente con transparencia. El componente Sprite recorta de forma visual con CSS sin alterar los PNG originales. Véanse docs/art-manifest.json y docs/art-prompts.txt.

## Pruebas

Pruebas automatizadas sin navegador: partida completa, recorridos en distinto orden, eventos repetidos y atrasados, recuperación de almacenamiento, límites de arrastre, recursos y caché offline. La compilación estática valida las rutas. No se ha realizado QA visual interactiva en navegadores ni en dispositivos físicos.

