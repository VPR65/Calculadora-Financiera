// --- Calculadora Financiera de Alta Precisión v6 ---
// Última actualización: 2025-05-23
//
// Este archivo utiliza solo APIs públicas y sin autenticación para obtener valores actualizados de los principales indicadores económicos relevantes para Chile.
//
// - UF y UTM: mindicador.cl (fuente oficial nacional, 1 vez al día)
// - Dólar, Euro: exchangerate.host (actualización horaria, sin autenticación)
// - Bitcoin: CoinGecko (minuto a minuto, sin autenticación, CLP)
// - Oro: CoinGecko (Tether Gold/XAUT en USD, convertido a CLP por gramo, SOLO se actualiza 2 veces al día: 08:00 y 16:00, bloque horario)
//
// Almacenamiento local (localStorage) para minimizar consultas y mantener rendimiento y experiencia de usuario.
// Criterios y detalles de cada fuente están documentados en README.md.

const MAX_CONSULTAS_DIA = 4;
const HORA_INICIO = 7;
const HORA_FIN = 24;

const datos = {};
const fechas = {};

function getClaveDia() {
  const hoy = new Date();
  return hoy.toISOString().slice(0, 10);
}

// --- Oro: actualiza solo dos veces al día (08:00 y 16:00) ---
function getBloqueOro() {
  const ahora = new Date();
  const hora = ahora.getHours();
  if (hora < 8) return "am"; // antes de las 8, usamos el bloque de la mañana
  if (hora < 16) return "am"; // de 8 a 15:59, sigue bloque am
  return "pm"; // desde las 16:00 bloque pm
}
function getClaveOro() {
  return getClaveDia() + "_oro_" + getBloqueOro();
}
function guardarOroLocal(valor, fecha) {
  localStorage.setItem(getClaveOro(), JSON.stringify({ valor, fecha }));
}
function cargarOroLocal() {
  const oro = localStorage.getItem(getClaveOro());
  if (oro) try {
    const { valor, fecha } = JSON.parse(oro);
    datos.oro = valor;
    fechas.oro = fecha;
    return true;
  } catch (e) {}
  return false;
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

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error fetch: " + url);
  return await res.json();
}

async function cargarIndicadores() {
  const estado = getEstadoConsultas();
  let seCargoDeLocal = false;
  if (estado.consultas >= MAX_CONSULTAS_DIA || !puedeConsultarAPI()) {
    seCargoDeLocal = cargarDeLocalStorage();
  }

  // --- ORO: intentamos solo cargar o actualizar si corresponde --
  let oroYaCargado = cargarOroLocal();

  if (!seCargoDeLocal) {
    try {
      // --- UF y UTM desde mindicador.cl ---
      let apiM = await fetchJSON('https://mindicador.cl/api');
      datos.uf = apiM.uf.valor;
      fechas.uf = apiM.uf.fecha;
      datos.utm = apiM.utm.valor;
      fechas.utm = apiM.utm.fecha;
      datos.clp = 1;
      fechas.clp = apiM.fecha ? apiM.fecha : "-";

      // --- Dólar y Euro desde exchangerate.host ---
      let apiE = await fetchJSON('https://api.exchangerate.host/latest?base=USD&symbols=CLP,EUR');
      datos.usd = apiE.rates.CLP;
      fechas.usd = apiE.date + " 12:00";
      datos.eur = await (async () => {
        let eur = await fetchJSON('https://api.exchangerate.host/latest?base=EUR&symbols=CLP');
        fechas.eur = eur.date + " 12:00";
        return eur.rates.CLP;
      })();

      // --- Bitcoin en CLP desde CoinGecko ---
      let btc = await fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=clp&include_last_updated_at=true');
      datos.btc = btc.bitcoin.clp;
      fechas.btc = btc.bitcoin.last_updated_at
        ? new Date(btc.bitcoin.last_updated_at * 1000).toISOString()
        : "-";

      // --- Oro SOLO si no está ya cargado para este bloque ---
      if (!oroYaCargado) {
        // Usamos CoinGecko: XAUT (Tether Gold) en USD, 1 XAUT = 1 onza troy
        // USD/CLP para conversión
        let [oro, usdclp] = await Promise.all([
          fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd&include_last_updated_at=true'),
          fetchJSON('https://api.exchangerate.host/latest?base=USD&symbols=CLP')
        ]);
        const xaut_usd = oro['tether-gold'].usd; // USD por onza troy
        const _fecha = oro['tether-gold'].last_updated_at
          ? new Date(oro['tether-gold'].last_updated_at * 1000).toISOString()
          : "-";
        const usd_clp = usdclp.rates.CLP;
        // 1 onza troy = 31.1035 gramos
        const valor_clp_gr = (xaut_usd * usd_clp) / 31.1035;
        datos.oro = valor_clp_gr;
        fechas.oro = _fecha;
        guardarOroLocal(valor_clp_gr, _fecha);
      }

      // --- Cobre desde mindicador.cl (USD/libra) ---
      datos.cobre = apiM.libra_cobre?.valor ?? "-";
      fechas.cobre = apiM.libra_cobre?.fecha ?? "-";

      // --- IPC e Imacec desde mindicador.cl ---
      datos.ipc = apiM.ipc?.valor ?? "-";
      fechas.ipc = apiM.ipc?.fecha ?? "-";
      datos.imacec = apiM.imacec?.valor ?? "-";
      fechas.imacec = apiM.imacec?.fecha ?? "-";

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
        cotiz.textContent = formatoMoneda(datos[k], 0, "CLP$ ") + " / gr";
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