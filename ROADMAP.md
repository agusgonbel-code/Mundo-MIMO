# Mundo Mimo — Roadmap de producto

## Visión
Convertir Mundo Mimo en un entorno educativo infantil 0–6, seguro, atractivo, progresivo y suficientemente rico para que el niño vuelva durante meses.

## Principios
- Sin anuncios ni enlaces externos en la zona infantil.
- Zona familiar protegida.
- Botones grandes, instrucciones por voz y navegación con pocos pasos.
- Juego sin castigo, presión, rachas obligatorias ni cronómetros.
- Contenido adaptado por edad y dificultad.
- Sonidos reales de animales, objetos, vehículos, instrumentos y naturaleza; la voz sirve para nombrar y guiar, no para imitar el sonido.
- Recursos esenciales disponibles offline.
- Ilustraciones y personajes propios progresivamente en lugar de depender de emojis.

## Mundos de contenido objetivo
1. Animales: granja, selva, bosque, mar, aves, mascotas, insectos.
2. Sonidos cotidianos: casa, ciudad, vehículos, naturaleza, instrumentos.
3. Lenguaje: vocabulario, letras, fonemas, sílabas iniciales, asociación imagen-palabra.
4. Matemáticas: contar, cantidades, números, comparación, series, patrones, primeras sumas visuales.
5. Percepción: colores, formas, tamaños, sombras, parejas, diferencias, puzles.
6. Socioemocional: emociones, expresiones, empatía, turnos y situaciones cotidianas.
7. Creatividad: dibujo, música, colorear, pegatinas, escenas libres.
8. Vida cotidiana: higiene, vestirse, ordenar, alimentos, seguridad básica y rutinas.
9. Cuentos: historias breves interactivas protagonizadas por Mimo y sus amigos.

## Progresión por edades
### 0–2
Causa-efecto, tocar y escuchar, objetos grandes, animales, ritmo, colores básicos y juego libre.
### 2–4
Parejas, clasificación, formas, vocabulario, conteo 1–5, emociones básicas, puzles sencillos y cuentos cortos.
### 4–6
Letras/fonemas, conteo 1–20, patrones, lógica, secuencias, prelectura, primeras operaciones visuales, emociones/situaciones y retos de varios pasos.

## Objetivo cuantitativo de biblioteca
Antes de considerar Mundo Mimo una app rica debe alcanzar como mínimo: 30 animales con fichas; 30 sonidos cotidianos reales; 100 retos de lenguaje; 100 retos matemáticos/perceptivos; 25 situaciones socioemocionales; 10 cuentos interactivos; 5 espacios de juego abierto. La especificación inicial está en `CONTENT_LIBRARY.md`.

## Biblioteca sonora
Cada elemento debe almacenar: nombre infantil, categoría, archivo, fuente, autor, licencia, URL de atribución cuando proceda y duración recomendada. Prioridad a CC0/dominio público o licencias compatibles. Los clips deben ser cortos, reconocibles y sin sobresaltos. Una categoría no se marcará completa hasta que sus archivos autorizados estén localizados en `assets/audio/`.

## Próximos bloques
1. Completar biblioteca de sonidos reales y eliminar imitaciones de voz.
2. Crear más personajes propios y variantes expresivas.
3. Añadir mapa/mundos visuales en vez de una simple cuadrícula de minijuegos.
4. Añadir niveles y variación dentro de cada juego.
5. Registrar progreso por habilidad, no solo estrellas totales.
6. Panel familiar con tiempo, habilidades practicadas y recomendaciones, sin métricas adictivas para el niño.
7. Internacionalización posterior manteniendo español como primera experiencia completa.

## Criterio de terminado
Un bloque no se considera terminado porque exista una pantalla: debe tener variedad suficiente, feedback audiovisual, adaptación por edad, accesibilidad táctil, funcionamiento móvil, estado vacío/error y prueba de funcionamiento offline cuando corresponda.