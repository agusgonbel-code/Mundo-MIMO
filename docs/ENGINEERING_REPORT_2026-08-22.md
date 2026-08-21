# Mundo Mimo — Informe de ingeniería, producto y QA
Fecha: 22/08/2026

## 1. Objetivo de producto
Mundo Mimo debe ser una experiencia educativa infantil dinámica, comprensible sin lectura, adaptativa y segura. El objetivo no es acumular minijuegos, sino crear una ruta de aprendizaje que responda al dominio del niño y conserve variedad y juego libre.

## 2. Funciones actuales y objetivo
### Onboarding por edad
Selecciona banda 0–2, 3–4 o 5–6. Debe limitar contenido y complejidad, no ser el único mecanismo de adaptación.

### Home / mundos
Bosque de Lío, Laguna de Pipa, Villa Mimo y Monte Aventura agrupan 24 mecánicas: animales/sonidos/memoria, números/formas/patrones, emociones/cuentos/creatividad y letras/lógica/secuencias.

### Camino diario
La versión anterior usaba tres juegos fijos por edad. v71 calcula cuatro propuestas cada día según dominio, novedad y necesidad de refuerzo.

### Motor adaptativo v71
- Registra intentos, aciertos, errores y racha por juego.
- Calcula dominio 0–100%.
- Estima dificultad 1–4 según edad y dominio.
- Prioriza actividades nuevas o con menor dominio.
- Reinicia solo la lista diaria, no el aprendizaje acumulado.

### Juego guiado
Cada sesión mantiene instrucciones visuales/voz, seis rondas, feedback inmediato y celebración breve. La capa QA existente repara rondas de clasificación sin respuesta correcta y protege trazado/dibujo frente a finalización accidental.

### Juego libre
Dibujo, música y descubrimiento con menor presión de acierto.

### Zona familiar
Protegida por parental gate. Muestra sesiones/rondas/logros y ahora dominio medio y habilidades prioritarias. Privacidad, soporte y enlaces externos deben permanecer detrás de este gate en la candidata App Store Kids.

## 3. Hallazgos QA
- La adaptación v70 dependía principalmente de la edad.
- La aventura diaria era fija.
- El catálogo de animales guiado parte de cuatro animales, insuficiente para sensación de variedad a medio plazo.
- El estado principal sumaba éxito, pero no modelaba errores de forma útil para recomendar contenido.
- Ya existía una matriz automática de 24 juegos x 3 edades x 6 rondas y una capa que detecta rondas imposibles.

## 4. Cambios de esta iteración
- `adaptive-engine-v71.js` con dominio, dificultad y recomendaciones.
- `app-v71-enhance.js` registra interacción, reemplaza la ruta diaria, añade panel parental adaptativo y microanimación.
- Respeta `prefers-reduced-motion`.
- Tests unitarios del motor adaptativo.
- QA workflow actualizado a Node 22 y pull requests; ejecuta unit tests + matriz Playwright completa.

## 5. QA obligatorio
- 24 juegos x 3 bandas x 6 rondas sin rondas imposibles.
- Audio sin solapes y con replay.
- Touch targets, dibujo y trazado en iPhone pequeño/grande/iPad.
- Camino diario cambia de forma coherente con dominio.
- Errores reducen dominio y aciertos sostenidos aumentan dificultad.
- Progreso persiste offline.
- Reduced Motion no rompe layout ni feedback.
- Parental gate protege privacidad, enlaces y configuración adulta.

## 6. App Store Kids
Para Kids Category, enlaces externos, compras u otras acciones adultas deben quedar detrás de parental gate. La app no debe enviar información identificable del niño o dispositivo a terceros y debe evitar publicidad/analítica de terceros salvo excepciones muy limitadas de Apple. La política de privacidad y el comportamiento real deben coincidir.

## 7. Riesgos pendientes
- El contenido de animales debe multiplicarse con assets y audio licenciados reales; cuatro animales no alcanzan el nivel objetivo.
- La dificultad v71 recomienda y etiqueta nivel, pero aún debe penetrar más profundamente en parámetros de cada mecánica (número de distractores, longitud de secuencia, rango numérico, velocidad y ayudas).
- Debe validarse el parental gate con niños reales en pruebas supervisadas de usabilidad, no solo automatización.
- El audio de terceros debe mantener trazabilidad de licencias en cada release.