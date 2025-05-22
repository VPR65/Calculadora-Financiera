// --- Calculadora Financiera con almacenamiento local y actualización de indicadores desde mindicador.cl ---
// Última actualización: 2025-05-22
//
// Este archivo obtiene los valores actualizados de los principales indicadores financieros desde la API pública de https://mindicador.cl/
//
// IMPORTANTE: 
// - El valor del BITCOIN entregado por la API está en DÓLARES. 
//   Para mostrar el valor en PESOS CHILENOS (CLP), se multiplica por el valor del dólar observado.
//   Ej: CLP = bitcoin_usd * dolar_observado
// - El valor del ORO ya viene en PESOS CHILENOS POR GRAMO, no requiere conversión extra.
//
// Los datos se almacenan en localStorage para evitar más de 4 consultas diarias (solo entre 07:00 y 24:00).
// Si ocurre un error o fuera de horario, se usan los datos guardados del día.

const MAX_CONSULTAS_DIA = 4; // Máximo de consultas por día
const HORA_INICIO = 7;  // 07:00
const HORA_FIN = 24;    // 24:00

const datos = {};
const fechas = {};

function getClaveDia() {
  const hoy = new Date();
  return hoy.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function puedeConsultarAPI() {
  const ahora = new Date();
  const hora = ahora.getHours();
  return hora >= HORA_INICIO && hora < HORA_FIN;
}

function getEstadoConsultas() {
  const clave = getClaveDia();
  const estado = JSON.parse(localStorage.getItem('estadoConsultas')) || {};
  return estado[clave] || { consultas: 0, ultimaConsulta: null };
}

function setEstadoConsultas() {
  const clave = getClaveDia();
  const estado = JSON.parse(localStorage.getItem('estadoConsultas')) || {};
  estado[clave] = estado[clave] || { consultas: 0, ultimaConsulta: null };
  estado[clave].consultas += 1;
  estado[clave].ultimaConsulta = new Date().toISOString();
  localStorage.setItem('estadoConsultas', JSON.stringify(estado));
}

function guardarEnLocalStorage(datos, fechas) {
  const clave = getClaveDia();
  localStorage.setItem('finDatos_' + clave, JSON.stringify({ datos, fechas }));
}

function cargarDeLocalStorage() {
  const clave = getClaveDia();
  const local = localStorage.getItem('finDatos_' + clave);
  if (local) {
    const { datos: d, fechas: f } = JSON.parse(local);
    Object.assign(datos, d);
    Object.assign(fechas, f);
    return true;
  }
  return false;
}

async function cargarIndicadores() {
  // 1. ¿Ya tenemos datos de hoy? ¿Cuántas veces hemos consultado hoy?
  const estado = getEstadoConsultas();
  let seCargoDeLocal = false;
  if (estado.consultas >= MAX_CONSULTAS_DIA || !puedeConsultarAPI()) {
    // Límite alcanzado o fuera de horario, usar localStorage
    seCargoDeLocal = cargarDeLocalStorage();
  }

  if (!seCargoDeLocal) {
    try {
      const res = await fetch('https://mindicador.cl/api');
      const api = await res.json();

      // CLP: Siempre es 1
      datos.clp = 1;
      fechas.clp = api.fecha ? api.fecha : "-";

      datos.uf = api.uf.valor;
      fechas.uf = api.uf.fecha;

      datos.usd = api.dolar.valor;
      fechas.usd = api.dolar.fecha;

      datos.eur = api.euro.valor;
      fechas.eur = api.euro.fecha;

      datos.utm = api.utm.valor;
      fechas.utm = api.utm.fecha;

      // ORO: El valor ya viene en pesos chilenos por gramo (no requiere conversión)
      datos.oro = api.oro?.valor ?? "-";
      fechas.oro = api.oro?.fecha ?? "-";

      // COBRE: El valor suele venir en dólares por libra
      datos.cobre = api.libra_cobre?.valor ?? "-";
      fechas.cobre = api.libra_cobre?.fecha ?? "-";

      // BITCOIN: El valor viene en DÓLARES, se debe multiplicar por el valor del dólar para mostrarlo en pesos chilenos
      datos.btc = (api.bitcoin?.valor && api.dolar?.valor)
        ? api.bitcoin.valor * api.dolar.valor
        : "-";
      fechas.btc = api.bitcoin?.fecha ?? "-";

      datos.ipc = api.ipc?.valor ?? "-";
      fechas.ipc = api.ipc?.fecha ?? "-";

      datos.imacec = api.imacec?.valor ?? "-";
      fechas.imacec = api.imacec?.fecha ?? "-";

      guardarEnLocalStorage(datos, fechas);
      setEstadoConsultas();

    } catch (e) {
      document.getElementById('msg-error').textContent = "Error cargando indicadores financieros. Usando datos almacenados.";
      cargarDeLocalStorage();
    }
  }
  muestraCotizaciones();
}

function formatoMoneda(valor, decimales, prefijo = "") {
  if (isNaN(valor)) return "-";
  return prefijo + Number(valor).toLocaleString("es-CL", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
}

function formatoFechaHora(fechaIso) {
  if (!fechaIso || fechaIso === "-") return "-";
  const d = new Date(fechaIso);
  return d.toLocaleDateString("es-CL") + " " +
    d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function muestraCotizaciones() {
  const keys = ["clp", "uf", "usd", "eur", "utm", "oro", "cobre", "btc", "ipc", "imacec"];
  keys.forEach(k => {
    const cotiz = document.getElementById("cotiz-" + k);
    const act = document.getElementById("act-" + k);
    if (cotiz) {
      if (k === "clp") {
        cotiz.textContent = formatoMoneda(datos[k], 0, "CLP$ ");
      } else if (k === "ipc" || k === "imacec") {
        cotiz.textContent = datos[k] !== undefined ? datos[k] : "-";
      } else if (k === "btc") {
        cotiz.textContent = formatoMoneda(datos[k], 0, "CLP$ ");
      } else if (k === "cobre") {
        cotiz.textContent = datos[k] + " USD/lb";
      } else if (k === "oro") {
        cotiz.textContent = formatoMoneda(datos[k], 0, "CLP$ ");
      } else {
        cotiz.textContent = formatoMoneda(datos[k], 2, "CLP$ ");
      }
    }
    if (act && fechas[k]) {
      act.innerHTML = `<i class="fa-regular fa-clock"></i> ${formatoFechaHora(fechas[k])}`;
    }
  });
}

function limpiarCampos(excepto) {
  ["valor-clp", "valor-uf", "valor-usd", "valor-eur", "valor-utm"].forEach(id => {
    if (id !== excepto) document.getElementById(id).value = "";
  });
}

function conversorHandler(e) {
  const clp = parseFloat(document.getElementById("valor-clp").value);
  const uf = parseFloat(document.getElementById("valor-uf").value);
  const usd = parseFloat(document.getElementById("valor-usd").value);
  const eur = parseFloat(document.getElementById("valor-eur").value);
  const utm = parseFloat(document.getElementById("valor-utm").value);
  let origen = null, monto = null;

  if (!isNaN(clp)) { origen = "clp"; monto = clp; }
  else if (!isNaN(uf)) { origen = "uf"; monto = uf * datos.uf; }
  else if (!isNaN(usd)) { origen = "usd"; monto = usd * datos.usd; }
  else if (!isNaN(eur)) { origen = "eur"; monto = eur * datos.eur; }
  else if (!isNaN(utm)) { origen = "utm"; monto = utm * datos.utm; }

  if (origen) {
    document.getElementById("msg-error").textContent = "";
    if (origen !== "clp")
      document.getElementById("valor-clp").value = Math.round(monto);
    if (origen !== "uf")
      document.getElementById("valor-uf").value = (monto / datos.uf).toFixed(4);
    if (origen !== "usd")
      document.getElementById("valor-usd").value = (monto / datos.usd).toFixed(2);
    if (origen !== "eur")
      document.getElementById("valor-eur").value = (monto / datos.eur).toFixed(2);
    if (origen !== "utm")
      document.getElementById("valor-utm").value = (monto / datos.utm).toFixed(4);
  } else {
    document.getElementById("msg-error").textContent = "Ingrese un monto en solo un campo.";
    limpiarCampos();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarIndicadores();
  ["valor-clp","valor-uf","valor-usd","valor-eur","valor-utm"].forEach(id => {
    document.getElementById(id).addEventListener("input", function() {
      limpiarCampos(id);
      conversorHandler();
    });
  });
});