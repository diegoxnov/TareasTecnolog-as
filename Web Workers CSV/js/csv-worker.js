/*
 * Web Worker: lee el archivo CSV y lo convierte en filas/columnas.
 * Se ejecuta en un hilo separado, por lo que el hilo principal (la interfaz)
 * nunca se bloquea, aunque el archivo sea grande.
 *
 * Mensajes que recibe:  { archivo: File, separador: "auto" | "," | ";" | "\t" }
 * Mensajes que envía:
 *   { tipo: "progreso", porcentaje }
 *   { tipo: "lote", filas }           -> bloques de filas ya procesadas
 *   { tipo: "fin", total, columnas, separador, ms }
 *   { tipo: "error", mensaje }
 */

const TAMANO_LOTE = 500;

self.onmessage = (evento) => {
  const { archivo, separador } = evento.data;
  const inicio = performance.now();

  if (!archivo) {
    self.postMessage({ tipo: "error", mensaje: "No se recibió ningún archivo." });
    return;
  }

  const lector = new FileReaderSync(); // API síncrona: solo disponible en workers
  let texto;
  try {
    texto = lector.readAsText(archivo, "UTF-8");
  } catch (e) {
    self.postMessage({ tipo: "error", mensaje: "No se pudo leer el archivo: " + e.message });
    return;
  }

  // Quitar BOM (Excel lo agrega al guardar como "CSV UTF-8")
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);

  if (!texto.trim()) {
    self.postMessage({ tipo: "error", mensaje: "El archivo está vacío." });
    return;
  }

  const sep = separador === "auto" ? detectarSeparador(texto) : separador;

  let lote = [];
  let total = 0;
  let columnas = 0;
  let ultimoPorcentaje = -1;

  parsearCSV(texto, sep, (fila, posicion) => {
    // Ignorar líneas totalmente vacías
    if (fila.length === 1 && fila[0] === "") return;

    lote.push(fila);
    total++;
    if (fila.length > columnas) columnas = fila.length;

    if (lote.length >= TAMANO_LOTE) {
      self.postMessage({ tipo: "lote", filas: lote });
      lote = [];
    }

    const porcentaje = Math.floor((posicion / texto.length) * 100);
    if (porcentaje !== ultimoPorcentaje) {
      ultimoPorcentaje = porcentaje;
      self.postMessage({ tipo: "progreso", porcentaje });
    }
  });

  if (lote.length) self.postMessage({ tipo: "lote", filas: lote });

  self.postMessage({
    tipo: "progreso",
    porcentaje: 100
  });
  self.postMessage({
    tipo: "fin",
    total,
    columnas,
    separador: sep,
    ms: Math.round(performance.now() - inicio)
  });
};

/** Elige el separador más frecuente en la primera línea. */
function detectarSeparador(texto) {
  const primeraLinea = texto.split(/\r?\n/, 1)[0];
  const candidatos = [",", ";", "\t", "|"];
  let mejor = ",";
  let max = 0;
  for (const c of candidatos) {
    const n = primeraLinea.split(c).length - 1;
    if (n > max) { max = n; mejor = c; }
  }
  return mejor;
}

/**
 * Parser CSV compatible con RFC 4180:
 * soporta campos entre comillas, comillas escapadas ("") y saltos de línea dentro de comillas.
 */
function parsearCSV(texto, sep, alFila) {
  let fila = [];
  let campo = "";
  let enComillas = false;
  const n = texto.length;

  for (let i = 0; i < n; i++) {
    const c = texto[i];

    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else enComillas = false;
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      enComillas = true;
    } else if (c === sep) {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo);
      alFila(fila, i);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }

  // Última fila (si el archivo no termina en salto de línea)
  if (campo !== "" || fila.length) {
    fila.push(campo);
    alFila(fila, n);
  }
}
