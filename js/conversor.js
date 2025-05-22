// Datos de prueba (simulan datos API)
const datos = {
  clp: 1000,
  uf: 37000,
  usd: 915,
  eur: 985,
  utm: 65000,
  oro: 72450,
  cobre: 4.25,
  btc: 65000000,
  ipc: 0.6,
  imacec: 1.8
};

// Fechas y horas simuladas de actualización (puedes reemplazar por datos de API)
const fechas = {
  clp: "2025-05-22T11:16:00",
  uf: "2025-05-22T09:02:00",
  usd: "2025-05-22T12:08:00",
  eur: "2025-05-22T10:59:00",
  utm: "2025-05-22T08:58:00",
  oro: "2025-05-22T14:00:00",
  cobre: "2025-05-22T13:42:00",
  btc: "2025-05-22T13:45:00",
  ipc: "2025-05-20T17:41:00",
  imacec: "2025-05-21T18:07:00"
};

function formatoMoneda(valor, decimales, prefijo = "") {
  return prefijo + valor.toLocaleString("es-CL", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
}

function formatoFechaHora(fechaIso) {
  if (!fechaIso) return "-";
  const d = new Date(fechaIso);
  return d.toLocaleDateString("es-CL") + " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
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
        cotiz.textContent = datos[k] ? datos[k] : "-";
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
  ["valor-clp","valor-uf","valor-usd","valor-eur","valor-utm"].forEach(id => {
    if (id !== excepto) document.getElementById(id).value = "";
  });
}

function conversorHandler(e) {
  // Obtiene los valores como números puros
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
    // Solo muestra los resultados como números simples en los inputs
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
  muestraCotizaciones();
  ["valor-clp","valor-uf","valor-usd","valor-eur","valor-utm"].forEach(id => {
    document.getElementById(id).addEventListener("input", function() {
      limpiarCampos(id);
      conversorHandler();
    });
  });
});