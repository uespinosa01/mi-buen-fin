# Mi Buen Fin

Responde siempre en español. PWA para celular que lleva el control de compras del Buen Fin y las fechas navideñas: cuánto llevas, cuánto pagarás cada mes (meses sin intereses) y cuándo te sales del presupuesto. Sin dependencias, sin red, datos solo en el celular.

## Cómo está armado
- `src/logica.js`: toda la lógica de dinero (UMD, sin DOM). Es lo único que se prueba.
- `src/app.html`: interfaz con el marcador `/*__LOGICA__*/`.
- `tools/construir_app.py`: inyecta la lógica y escribe `docs/index.html` (sitio instalable). `docs/` también tiene `sw.js`, `manifest.webmanifest` e `icono.svg`.
- `tools/prueba_logica.js`: pruebas (`node tools/prueba_logica.js`).
- `scripts/verify.ps1`: pruebas + build + comprobación de que `docs/index.html` está al día. Córrelo y pega su salida antes de decir que algo está listo.

## Reglas
- Dinero siempre en centavos enteros. Nunca `float` ni `toFixed` para calcular; solo para mostrar.
- Ningún gasto real va en el código ni en el repo: viven en `localStorage` del celular y se mueven con el respaldo JSON (exportar/importar).
- Sin llamadas de red, sin librerías, sin `innerHTML` con texto del usuario (usar `h()`/`textContent`).
- La app informa, no aconseja: nada de recomendaciones de inversión ni crédito.
- Cambio de lógica: primero la prueba que falla, luego el código. Si una prueba falla, corrige el código, no la prueba.
- Mes de la 1.ª mensualidad: si la tarjeta tiene regla (`config.tarjetas[nombre] = {corte, limite}`), una compra hasta el día de corte entra al estado de ese mes y, si el día límite es mayor que el corte, se paga ese mismo mes; si no, el siguiente. Sin regla, se usa el mes de la compra + `gracia` (0 o 1, ajuste general).
- Commits en español `tipo: descripción`, uno por tarea. No hacer push sin pedirlo.
- Nunca dejes una captura o dato real del usuario en el repo.

## Reconstruir
`python tools/construir_app.py` y abrir `docs/` con `python -m http.server 8765 --directory docs`.
