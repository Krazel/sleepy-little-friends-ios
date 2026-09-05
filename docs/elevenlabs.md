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
- Validar los audios y su manifiesto antes de sustituir public/voice y publicar.

Documentación: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
Cuota: https://elevenlabs.io/docs/api-reference/user/subscription/get
Condiciones: https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform

Tarea responsable del producto: 01a06ecc-71e2-77c1-a108-08f629f41bea. Plataforma acordada: web móvil/PWA, ES y EN; esta mejora no implica migración nativa.
