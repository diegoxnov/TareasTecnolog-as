// Hilo principal: maneja la interfaz y delega el procesamiento del CSV al Web Worker.

const $ = (id) => document.getElementById(id);

const inputArchivo = $("archivo");
const zonaCarga = $("zonaCarga");
const selSeparador = $("separador");
const chkEncabezado = $("encabezado");
const estado = $("estado");
const progresoCont = $("progresoCont");
const relleno = $("relleno");
const progresoTexto = $("progresoTexto");
const resultado = $("resultado");
const resumen = $("resumen");
const filtro = $("filtro");
const thead = document.querySelector("#tabla thead");
const tbody = document.querySelector("#tabla tbody");

let worker = null;
let filas = [];
let archivoActual = null;

// Botón contador: demuestra que la interfaz NO se congela mientras el worker trabaja
let clics = 0;
$("contador").addEventListener("click", () => { $("clics").textContent = ++clics; });

if (!window.Worker) {
  mostrarEstado("Tu navegador no soporta Web Workers.", "error");
}

inputArchivo.addEventListener("change", () => {
  if (inputArchivo.files.length) procesar(inputArchivo.files[0]);
});

// Arrastrar y soltar
["dragenter", "dragover"].forEach((ev) =>
  zonaCarga.addEventListener(ev, (e) => { e.preventDefault(); zonaCarga.classList.add("arrastrando"); })
);
["dragleave", "drop"].forEach((ev) =>
  zonaCarga.addEventListener(ev, (e) => { e.preventDefault(); zonaCarga.classList.remove("arrastrando"); })
);
zonaCarga.addEventListener("drop", (e) => {
  if (e.dataTransfer.files.length) procesar(e.dataTransfer.files[0]);
});

// Volver a procesar si cambian las opciones
selSeparador.addEventListener("change", () => archivoActual && procesar(archivoActual));
chkEncabezado.addEventListener("change", () => filas.length && renderizarTabla());
filtro.addEventListener("input", () => renderizarTabla());

function procesar(archivo) {
  if (!/\.csv$/i.test(archivo.name) && archivo.type !== "text/csv") {
    resultado.hidden = true;
    progresoCont.hidden = true;
    mostrarEstado(`"${archivo.name}" no es un archivo CSV. Si es un Excel, guárdalo como "CSV UTF-8".`, "error");
    return;
  }

  archivoActual = archivo;
  filas = [];
  filtro.value = "";
  resultado.hidden = true;
  progresoCont.hidden = false;
  actualizarProgreso(0);
  mostrarEstado(`Procesando "${archivo.name}" en el Web Worker…`);

  // Si había un worker trabajando, se termina y se crea uno nuevo
  if (worker) worker.terminate();
  worker = new Worker("js/csv-worker.js");

  worker.onmessage = (e) => {
    const msg = e.data;
    switch (msg.tipo) {
      case "progreso":
        actualizarProgreso(msg.porcentaje);
        break;
      case "lote":
        filas.push(...msg.filas);
        break;
      case "fin":
        worker.terminate();
        worker = null;
        renderizarTabla(msg);
        mostrarEstado(`✔ Archivo procesado por el Web Worker en ${msg.ms} ms.`, "ok");
        break;
      case "error":
        progresoCont.hidden = true;
        mostrarEstado(msg.mensaje, "error");
        break;
    }
  };

  worker.onerror = (err) => {
    mostrarEstado("Error en el Web Worker: " + err.message, "error");
  };

  // Se envía el objeto File; el worker lo lee con FileReaderSync
  worker.postMessage({ archivo, separador: selSeparador.value === "\\t" ? "\t" : selSeparador.value });
}

let infoFin = null;

function renderizarTabla(info) {
  if (info) infoFin = info;
  const conEncabezado = chkEncabezado.checked;
  const numCols = infoFin ? infoFin.columnas : 0;

  const encabezados = conEncabezado
    ? filas[0]
    : Array.from({ length: numCols }, (_, i) => `Columna ${i + 1}`);
  let datos = conEncabezado ? filas.slice(1) : filas;

  const texto = filtro.value.trim().toLowerCase();
  if (texto) datos = datos.filter((f) => f.some((c) => c.toLowerCase().includes(texto)));

  // Encabezado
  thead.innerHTML = "";
  const trH = document.createElement("tr");
  const thN = document.createElement("th");
  thN.textContent = "#";
  trH.appendChild(thN);
  for (let i = 0; i < numCols; i++) {
    const th = document.createElement("th");
    th.textContent = encabezados[i] ?? "";
    trH.appendChild(th);
  }
  thead.appendChild(trH);

  // Cuerpo (se construye con DocumentFragment para un único reflujo)
  const frag = document.createDocumentFragment();
  datos.forEach((fila, idx) => {
    const tr = document.createElement("tr");
    const tdN = document.createElement("td");
    tdN.textContent = idx + 1;
    tdN.className = "num";
    tr.appendChild(tdN);
    for (let i = 0; i < numCols; i++) {
      const td = document.createElement("td");
      const valor = fila[i] ?? "";
      td.textContent = valor;
      if (valor !== "" && !isNaN(valor.replace(",", "."))) td.className = "num";
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  });
  tbody.innerHTML = "";
  tbody.appendChild(frag);

  const nombreSep = { ",": "coma", ";": "punto y coma", "\t": "tabulación", "|": "barra" };
  resumen.innerHTML = `
    <div>Archivo: <b>${escapar(archivoActual.name)}</b></div>
    <div>Filas: <b>${conEncabezado ? filas.length - 1 : filas.length}</b></div>
    <div>Columnas: <b>${numCols}</b></div>
    <div>Separador: <b>${nombreSep[infoFin.separador] || infoFin.separador}</b></div>
    ${texto ? `<div>Coincidencias: <b>${datos.length}</b></div>` : ""}
  `;
  resultado.hidden = false;
}

function actualizarProgreso(p) {
  relleno.style.width = p + "%";
  progresoTexto.textContent = p + "%";
}

function mostrarEstado(texto, clase = "") {
  estado.textContent = texto;
  estado.className = "estado " + clase;
}

function escapar(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
