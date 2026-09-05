# Verificación de la ampliación

## Alcance

- Seis personajes originales, 36 actividades y 93 interacciones para completar una noche.
- Trece tipos de actividad: caricias, burbujas, cepillo, lavado, ordenar juguetes, estrellas, fruta, pelota, objeto favorito, beso, lámpara, cuento y música.
- Gestos táctiles con alternativa mediante toque/teclado, objetivos amplios, cancelación y tolerancia en arrastres, rechazo de eventos duplicados o de una actividad anterior.
- 68 narraciones MP3 incluidas en español e inglés; cambio de idioma y ritmo, atenuación musical durante la voz, cancelación en segundo plano y alternativa del sistema si falta un archivo.
- Textos, nombres, accesibilidad, cuentos y pistas en ambos idiomas.
- Progreso entre pequeñas acciones y preferencias locales. Migración desde la primera versión; repetir una habitación mantiene las demás.
- Modo sin conexión con los seis atlas y ambas bibliotecas de voz. Instalación web opcional.

## Evidencia automatizada

- 30 pruebas: recorridos completos y en distinto orden, acciones duplicadas/tardías, conservación de progreso, migración, recuperación de datos inválidos, arrastre y todos los atlas y guiones.
- Simulación de Web Audio: reproducción del MP3, caché de audio decodificado, velocidad, atenuación, cambio de idioma, silencio mientras carga una voz, segundo plano y alternativa del idioma correcto.
- Integridad de todos los frames MP3: 68 archivos completos, duraciones entre 1,99 y 7,58 segundos (277,42 segundos en total).
- TypeScript y lint en código propio, componentes del juego, scripts y pruebas.
- Exportación estática / y 404, referencias locales y precarga de 68 voces.
- Service worker ejecutado en un entorno Node sin red: instalación, activación, limpieza limitada a sus propias cachés, navegación, imágenes y voz en ambos idiomas. Respeta otros orígenes y peticiones POST.
- Ilustraciones inspeccionadas; dimensiones y recortes comprobados. Coco y Bambú requieren las máscaras CSS documentadas en su manifiesto.

## Límites

No se ha realizado QA visual interactiva en navegador ni pruebas en teléfono físico; el flujo de Sites requiere una petición explícita para estas pruebas. Las pruebas de audio simulan las APIs y comprueban los archivos, pero no constituyen una escucha humana de todas las frases. La instalación y el desbloqueo del audio dependen del navegador.

Las tres herramientas WebMCP son opcionales, usan el estado actual y no se consideran verificadas sin un navegador compatible. El juego no depende de ellas.

## Compilación Windows

scripts/build.mjs usa las APIs de construcción y exportación de Vinext y permite la terminación natural de Node para evitar una aserción de libuv del CLI. Los fallos reales de compilación se propagan.
