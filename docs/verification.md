# Verificación de la entrega

## Alcance implementado

- Juego móvil instalable con inicio, tres habitaciones y despedida final.
- Luna: manta mediante toque o arrastre y beso de buenas noches.
- Milo: cojín mediante toque o arrastre y lámpara que atenúa la habitación.
- Nube: peluche mediante toque o arrastre y nana.
- Acciones equivalentes por teclado, objetivos táctiles amplios, cancelación de arrastre, tolerancia al soltar y protección frente a dobles toques.
- Imágenes originales, animación de los objetos, corazones de respuesta y respiración al dormir.
- Audio sintetizado localmente, narración española opcional, silencio y respeto al movimiento reducido.
- Progreso y preferencias locales; recuperación ante datos corruptos o almacenamiento bloqueado.
- Caché offline, manifiesto e iconos de instalación; controles para mayores y nueva noche.

## Evidencia automatizada

- 25 pruebas de lógica de partida, persistencia, gestos, audio y recursos: aprobadas.
- TypeScript: sin errores.
- Lint de app, lib, tests y scripts: sin errores. Los componentes incluidos por el generador se conservan sin modificaciones.
- Exportación estática: rutas / y 404 generadas.
- Verificador de producción: todas las referencias locales existen; se guardan los recursos de la app; navegación e ilustraciones servidas sin red en la prueba de service worker; no se interceptan orígenes ajenos ni peticiones POST.
- Ilustraciones inspeccionadas y dimensiones/alpha comprobadas. Los recortes respetan las medidas del manifiesto de arte.

## Límites de la verificación

No se ha realizado una sesión de QA visual interactiva en navegador ni pruebas en un teléfono físico. El entorno de Sites reserva esas acciones a una petición explícita de pruebas de navegador. La instalación, la voz española disponible y las políticas de almacenamiento dependen del navegador y del dispositivo.

La interfaz WebMCP opcional se registra solo en navegadores compatibles. No había un contexto de validación WebMCP disponible; sus tres herramientas no se consideran verificadas. El juego utiliza sus controles normales y no depende de esa interfaz.

## Compilación en Windows

El CLI incluido de Vinext puede terminar con una aserción UV_HANDLE_CLOSING al invocar process.exit inmediatamente. scripts/build.mjs utiliza las mismas APIs de construcción y exportación y deja que Node finalice de forma natural. Los errores reales de construcción, exportación o caché se propagan como fallos; no se ignoran códigos de salida.
