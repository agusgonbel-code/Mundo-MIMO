# Mundo Mimo — Auditoría profesional de producto y QA · 22/08/2026

## Visión
Mundo Mimo debe sentirse vivo, lúdico y seguro. La calidad no se mide por número de minijuegos, sino por comprensión sin lectura, variedad real, feedback inmediato, adaptación, audio y confianza parental.

## Patrones de producto objetivo
- Actividades cortas y autocontenidas.
- Progresión adaptativa según aciertos, errores y reintentos.
- Navegación guiada por personajes animados.
- Instrucciones por voz y demostración visual para prelectores.
- Celebraciones cortas y positivas sin bucles manipulativos.
- Juego creativo abierto junto a lectura, números, lógica, sonidos y emociones.
- Zona de padres separada y protegida.
- Sin anuncios ni enlaces externos en el área infantil.

## Arquitectura de experiencia
1. Mundo/home animado con zonas claras.
2. Camino diario de 3–5 actividades recomendado por edad y rendimiento reciente.
3. Bucle de juego: demostración → interacción → feedback inmediato → celebración breve → siguiente reto.
4. Motor adaptativo: dificultad, distractores, velocidad y repetición responden al dominio.
5. Sistema de contenido con muchas variantes por mecánica.
6. Zona creativa con baja presión de fallo.
7. Zona de padres con habilidades practicadas, tiempo, progreso y ajustes tras un adult gate.

## Gates de QA
- Cada actividad se entiende sin leer.
- No existen rondas imposibles o ambiguas.
- Touch targets pasan iPhone pequeño.
- Audio se puede repetir y no se solapa.
- Orientación y safe areas son estables.
- Offline funciona tras la primera carga.
- Parent gate impide salida accidental a ajustes/enlaces.
- Progreso y adaptación persisten localmente.
- Reduced motion/accesibilidad no rompen gameplay.