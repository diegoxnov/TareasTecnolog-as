# Streams de objetos en Node.js

## ¿Qué es un stream?

Un **stream** es una forma de procesar datos **poco a poco**, sin cargarlos todos en memoria. Normalmente los streams manejan `Buffer` o `string`, pero Node.js también permite streams de **objetos JavaScript** activando la opción `objectMode: true`.

Son útiles para procesar registros de bases de datos, filas de un CSV, líneas de un JSON, etc., un objeto a la vez.

## Tipos de streams

| Tipo | Función | Ejemplo en este proyecto |
|------|---------|--------------------------|
| `Readable` | Produce datos | `Readable.from(estudiantes)` |
| `Transform` | Recibe, modifica y emite datos | Agrega el campo `estado` |
| `Writable` | Consume datos | Imprime cada objeto |

## ¿Qué cambia con `objectMode`?

- Cada "chunk" es **un objeto completo** (no bytes ni texto).
- El límite del buffer (`highWaterMark`) se cuenta en **número de objetos** (por defecto 16), no en bytes.
- No se puede enviar `null` como dato, porque `null` indica el fin del stream.

```js
const t = new Transform({ objectMode: true, transform(obj, enc, cb) { /* ... */ } });
```

## El ejemplo

Archivo: [`ejemplo.js`](./ejemplo.js)

Flujo: **Readable → Transform → Writable**

1. `Readable.from(arreglo)` emite cada estudiante como un objeto.
2. `Transform` agrega `estado` (`Aprobado` si la nota ≥ 11).
3. `Writable` imprime cada resultado.
4. `pipeline()` conecta todo y maneja errores y el cierre automáticamente.

### Ejecutar

```bash
node ejemplo.js
```

### Salida esperada

```
Ana: 18 -> Aprobado
Luis: 9 -> Desaprobado
Marta: 15 -> Aprobado
Pedro: 12 -> Aprobado
Stream finalizado
```

## Conclusión

Los streams de objetos permiten procesar colecciones de datos de forma **eficiente y encadenable**: cada etapa hace una sola tarea y `pipeline()` las une. Requisito: Node.js 15 o superior (por `stream/promises`).

## Referencias

- [Documentación de Node.js: Stream](https://nodejs.org/api/stream.html)
- [Object mode](https://nodejs.org/api/stream.html#object-mode)
