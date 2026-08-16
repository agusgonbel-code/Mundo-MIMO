# Mundo Mimo — Integración del mapa interactivo

## Objetivo
El mapa pasa a ser la navegación infantil principal. La cuadrícula de actividades se conserva temporalmente como biblioteca secundaria mientras se migra cada experiencia a un territorio.

## Territorios y rutas
- Villa Mimo: `stories`, `emotions`, `classify`, `draw`.
- Bosque de Lío: `animals`, `pairs`, `sounds`.
- Laguna de Pipa: `count`, `colors`, `shapes`.
- Monte Aventura: `letters`, `puzzle`, `classify`.

## Contrato del mapa
`assets/world-map.html` envía al padre:
```js
{ type: 'mimo-world', target: 'animals' }
```
La aplicación principal debe escuchar `message`, validar que `target` pertenece a la lista permitida y llamar a `start(target)`.

## Seguridad
No aceptar URLs ni código desde el mensaje. Solo IDs internos explícitamente permitidos.

## UX
- El mapa debe aparecer antes que la biblioteca de tarjetas.
- Un toque selecciona territorio y reproduce una explicación breve.
- ENTRAR abre una actividad representativa del territorio.
- La biblioteca completa permanece accesible con un botón “Todos los juegos”.
- La edad sigue filtrando qué experiencias se recomiendan.

## Siguiente iteración
Sustituir el iframe/prototipo por mapa nativo dentro de `index.html`, añadir movimiento de Mimo por el camino, estados desbloqueados y pequeñas interacciones ambientales sin puntuación.