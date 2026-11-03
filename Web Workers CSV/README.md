# Visor de archivos CSV con Web Workers

Página que permite cargar un archivo CSV y mostrarlo en una tabla HTML.
La lectura y el análisis del archivo se hacen en un **Web Worker**, así la interfaz no se congela.

## Estructura

```
index.html          Interfaz
css/styles.css      Estilos
js/main.js          Hilo principal: eventos, crea el worker y dibuja la tabla
js/csv-worker.js    Web Worker: lee el archivo (FileReaderSync) y parsea el CSV
pruebas/            Archivos de prueba (Excel y CSV)
```

## Funcionamiento

1. El usuario elige o arrastra un `.csv`.
2. `main.js` crea `new Worker("js/csv-worker.js")` y le envía el `File` con `postMessage`.
3. El worker lee el texto, detecta el separador (`,` `;` tabulación `|`), parsea el CSV
   (soporta comillas, comillas escapadas y saltos de línea dentro de campos) y envía
   mensajes `progreso`, `lote` (filas en bloques de 500) y `fin`.
4. `main.js` actualiza la barra de progreso y construye la tabla.

## Cómo ejecutar

Los Web Workers no funcionan abriendo el HTML con doble clic (`file://`); se necesita un servidor local:

```bash
python -m http.server 8080
```

Luego abrir `http://localhost:8080`. También sirve la extensión **Live Server** de VS Code.

## Archivos de prueba

- `pruebas/datos_prueba.xlsx`: abrir en Excel → *Guardar como* → **CSV UTF-8** y cargar ese CSV.
- `pruebas/estudiantes.csv`: 200 filas, separadas por coma.
- `pruebas/estudiantes_punto_y_coma.csv`: 50 filas, separadas por `;`.
- `pruebas/grande_50000_filas.csv`: para comprobar que la interfaz no se bloquea (pulsa el botón contador mientras carga).
