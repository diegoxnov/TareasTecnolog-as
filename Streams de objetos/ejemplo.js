// Ejemplo sencillo de streams en modo objeto (objectMode) con Node.js
const { Readable, Transform, Writable } = require('stream');
const { pipeline } = require('stream/promises');

const estudiantes = [
  { nombre: 'Ana', nota: 18 },
  { nombre: 'Luis', nota: 9 },
  { nombre: 'Marta', nota: 15 },
  { nombre: 'Pedro', nota: 12 },
];

// 1. Readable: emite un objeto por cada elemento del arreglo
const origen = Readable.from(estudiantes); // Readable.from usa objectMode por defecto

// 2. Transform: agrega el campo "estado" a cada objeto
const evaluar = new Transform({
  objectMode: true,
  transform(est, _codificacion, callback) {
    callback(null, { ...est, estado: est.nota >= 11 ? 'Aprobado' : 'Desaprobado' });
  },
});

// 3. Writable: consume cada objeto (aquí, lo imprime)
const destino = new Writable({
  objectMode: true,
  write(est, _codificacion, callback) {
    console.log(`${est.nombre}: ${est.nota} -> ${est.estado}`);
    callback();
  },
});

pipeline(origen, evaluar, destino)
  .then(() => console.log('Stream finalizado'))
  .catch((err) => console.error('Error:', err));
