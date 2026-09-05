# Animalitos a dormir / Sleepy little friends

Juego web instalable para móvil, pensado para jugar con peques de 2 a 5 años. Seis amigos, 36 actividades y narración en español e inglés.

## Jugar

- Luna, la conejita: caricias, burbujas, cepillo, manta, beso y luz.
- Milo, el gatito: juguetes, baño, estrellas, cojín, música y luz.
- Nube / Cloud, el osito: burbujas, fruta, cepillo, peluche, cuento y nana.
- Coco, el perrito: pelota, baño, cepillo, manta, beso y luz.
- Pipa / Pippa, la zorrita: juguetes, estrellas, cuento, dinosaurio, caricias y nana.
- Bambú / Bamboo, el panda: fruta, baño, estrellas, cojín, beso y luz.

Toca o arrastra los objetos, desliza para acariciar o limpiar y descubre la luna y la lámpara de cada habitación. Los gestos de arrastre tienen alternativa mediante toque o teclado. Tras completar las seis actividades, la flecha conduce al siguiente amigo; el juego termina cuando todos duermen.

ES/EN cambia textos, nombres, instrucciones y narración. «Para mayores» incluye velocidad de voz, sonido, narración, movimiento, repetición de una habitación y nueva noche. El progreso se guarda entre actividades e incluso entre pequeñas acciones. Las partidas de la primera versión conservan los amigos que ya estaban durmiendo.

No hay anuncios, compras, cuentas de juego, cronómetros ni analítica.

## Voz y modo sin conexión

68 MP3 incluidos: 34 frases por idioma. Voz Sarah de ElevenLabs, generada por API con eleven_multilingual_v2, ritmo 0,90 y un guion fijo en español e inglés. La app reproduce los archivos localmente, atenúa la música mientras se narra y cancela la voz al cambiar de idioma, silenciar o salir. La síntesis del navegador solo sirve de alternativa si falla un archivo. No se envían datos del jugador a servicios de voz.

El guion y la procedencia están en docs/voice-script.json y docs/voice-manifest.json. scripts/generate-elevenlabs-voice.py reutiliza la configuración local existente de CreadorVideosAI sin copiar la clave; por defecto solo consulta la cuota. --generate prepara archivos en work/elevenlabs-voice, sin reemplazar automáticamente las voces publicadas. Véase docs/elevenlabs.md. El generador anterior de Microsoft se conserva y escribe únicamente en work/microsoft-voice.

Abrir la URL con conexión y esperar al aviso de disponibilidad sin conexión en «Para mayores». El service worker guarda habitaciones, aplicación y las dos bibliotecas de voz. Desde el menú del navegador se puede añadir a la pantalla de inicio. La primera visita a Sites privado requiere la cuenta autorizada.

La entrega es una aplicación web instalable. La instalación y la reproducción de audio siguen las capacidades del navegador; los controles visuales funcionan aunque no estén disponibles.

## Desarrollo

Node 22.13+ y npm. `npm ci`, `npm run dev`. `npm run build` exporta a dist/client y genera la caché offline. `npm test`, `npm run typecheck`, `npm run lint` y `npm run verify:build` validan lógica, voces, recursos y exportación.

## Arte y verificación

Seis atlas originales generados con imagegen. Los PNG originales se recortan visualmente mediante CSS. Los props de Coco y Bambú usan máscaras adicionales porque esos dos PNG contienen fondo opaco fuera del objeto. Véanse los manifiestos y prompts en docs.

Pruebas de lógica, persistencia, gestos, audio y service worker sin navegador. No se ha realizado QA visual interactiva ni pruebas en un teléfono físico. La interfaz WebMCP es opcional y no se ha validado en un navegador compatible. Más detalle en docs/verification.md.
