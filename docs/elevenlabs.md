# Narración ElevenLabs — 5 septiembre 2026

El usuario pidió reutilizar la API que se empleaba para historias animadas. Se encontró en CreadorVideosAI, con ejemplos en projects/casa_del_pozo y shorts/la_memoria_no_graba.

## Configuración reutilizada

La credencial existente permanece en C:\Users\dmkra\Documents\CreadorVideosAI\api\.env.local, variable ELEVENLABS_API_KEY. No se ha copiado a este repositorio, al frontend ni al paquete de Sites. El script permite indicar otra ubicación mediante ELEVENLABS_ENV_FILE. Se usó la clave principal; no hubo rotación de cuentas, cambio de plan ni activación de sobrecostes.

La consulta inicial devolvió cuenta activa, límite 10.000 y uso 0. La muestra inicial generó 75 caracteres. El lote completo contiene 2.832 caracteres, 34 frases por idioma. La cuota consultada inmediatamente después puede reflejar contabilización diferida y no se utiliza como garantía de facturación.

## Voz elegida y archivos

Sarah — Mature, Reassuring, Confident; ID EXAVITQu4vr4xnSDxMaL, confirmado mediante la lista de voces de la cuenta. El comentario de los scripts antiguos la llamaba Bella, pero el nombre actual que devuelve la API es Sarah.

Modelo eleven_multilingual_v2, velocidad 0,90, estabilidad 0,58, similitud 0,75, estilo 0,20 y refuerzo de hablante. Salida MP3 44,1 kHz / 128 kbps. Se conserva la misma identidad de narradora en español e inglés. El guion del juego no cambia.

68 archivos generados y decodificados sin errores, sin pistas silenciosas ni saturación. Detalles en elevenlabs-audio-check.json y voice-manifest.json. Los originales anteriores se conservan fuera de Git en work/voice-before-elevenlabs.

El juego reproduce los archivos incluidos y sigue funcionando sin conexión tras completar su caché. No llama a ElevenLabs durante las partidas. La atribución elevenlabs.io aparece en el título del documento y en las opciones para mayores. La licencia comercial de la cuenta no se ha deducido de la respuesta técnica «payg»; revisar antes de una distribución comercial.

## Repetir la generación

- Ejecutar scripts/generate-elevenlabs-voice.py para consultar cuota sin generar audio.
- Añadir --generate para preparar el lote en work/elevenlabs-voice.
- El script valida la cuota conservadoramente, reutiliza archivos con su huella y no reintenta automáticamente fallos de red de resultado incierto.
- Validar los audios y su manifiesto antes de sustituir public/voice/elevenlabs y publicar.

Documentación: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
Cuota: https://elevenlabs.io/docs/api-reference/user/subscription/get
Condiciones: https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform

Tarea responsable del producto: 01a06ecc-71e2-77c1-a108-08f629f41bea. Plataforma acordada: web móvil/PWA, ES y EN; esta mejora no implica migración nativa.

## Caché de actualizaciones

Los archivos actuales viven bajo /voice/elevenlabs/es y /voice/elevenlabs/en. Este espacio de rutas distingue las voces nuevas de los MP3 Microsoft de versiones anteriores; un service worker antiguo no puede devolver sus audios al cargar la nueva versión.

## Opción español de España — 5 septiembre 2026

A petición del usuario se añade Valeria — Clear, Relaxed, Engaging (SzSUM9aqTucCylaROOmf), identificada por el catálogo de ElevenLabs con idioma es y acento peninsular, descripción «Spanish voice from Spain». Se generaron las 34 frases españolas (1.348 caracteres) con eleven_multilingual_v2, language_code es y los mismos ajustes calmados. El catálogo permitió su uso y la API generó el lote con la cuota existente, sin cambiar el plan ni habilitar sobrecostes.

La opción España · Valeria es la predeterminada en español, también al actualizar partidas antiguas que aún no tenían preferencia de narradora. Para mayores → Voz en español permite recuperar Voz anterior · Sarah. La selección se guarda por dispositivo, sin cambiar ES/EN ni el progreso. Inglés conserva sus 34 audios de Sarah. Total incluido: 102 MP3 (34 Valeria, 34 Sarah español, 34 Sarah inglés).

Los archivos nuevos están en public/voice/elevenlabs/es-ES-valeria; no se sobrescriben los originales. docs/voice-spain-manifest.json conserva guion, identidad y hashes; docs/voice-spain-audio-check.json acredita decodificación, duración y señal de los 34 archivos. La verificación técnica no sustituye una revisión auditiva humana del acento. El botón Escuchar la voz permite probar la opción elegida. No se usa la API durante las partidas.

Pruebas: 39 pruebas automáticas, tipos y lint correctos; cambio de narradora, cancelación de audio anterior, cachés separadas, persistencia y migración de partidas cubiertos. El paquete web incluye las tres colecciones en la caché sin conexión. El fallback de España sólo permite una voz de sistema es-ES; nunca sustituye silenciosamente otro acento.

Esta entrega actualiza la web existente. La candidata iOS conserva su trabajo pendiente y no hay una nueva subida a TestFlight en esta entrega. La autorización sobre el mínimo iOS 16.4 sigue pendiente; no se ha dado por concedida con este encargo de voces.
