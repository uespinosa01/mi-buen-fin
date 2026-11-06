(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Logica = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var PLANES = [1, 3, 6, 9, 12, 18, 24];
  var TARJETAS = ["BBVA", "Banorte", "Banamex", "Invex", "Didi", "Nu", "Liverpool", "Otra"];
  var VERSION_RESPALDO = 1;
  var UMBRAL_AMBAR = 0.8;
  var FECHA = /^\d{4}-\d{2}-\d{2}$/;

  function pesosACentavos(texto) {
    var limpio = String(texto == null ? "" : texto).replace(/[$,\s]/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
    var partes = limpio.split(".");
    var centavos = parseInt(partes[0], 10) * 100 + parseInt((partes[1] || "").padEnd(2, "0") || "0", 10);
    return centavos > 0 ? centavos : null;
  }

  function formatoMXN(centavos) {
    var negativo = centavos < 0;
    var abs = Math.abs(centavos);
    var enteros = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var cents = String(abs % 100).padStart(2, "0");
    return (negativo ? "-" : "") + "$" + enteros + "." + cents;
  }

  function sumarMeses(mes, n) {
    var partes = mes.split("-");
    var total = parseInt(partes[0], 10) * 12 + (parseInt(partes[1], 10) - 1) + n;
    var anio = Math.floor(total / 12);
    return anio + "-" + String((total % 12) + 1).padStart(2, "0");
  }

  function mensualidades(compra, gracia) {
    var primero = sumarMeses(compra.fecha.slice(0, 7), gracia);
    var base = Math.floor(compra.monto / compra.meses);
    var residuo = compra.monto - base * compra.meses;
    var lista = [];
    for (var i = 0; i < compra.meses; i++) {
      lista.push({ mes: sumarMeses(primero, i), monto: i === compra.meses - 1 ? base + residuo : base });
    }
    return lista;
  }

  function calendario(compras, gracia) {
    var porMes = {};
    compras.forEach(function (c) {
      mensualidades(c, gracia).forEach(function (m) { porMes[m.mes] = (porMes[m.mes] || 0) + m.monto; });
    });
    return Object.keys(porMes).sort().map(function (mes) { return { mes: mes, total: porMes[mes] }; });
  }

  function totalComprado(compras) {
    return compras.reduce(function (s, c) { return s + c.monto; }, 0);
  }

  function semaforo(gastado, presupuesto) {
    if (!presupuesto || presupuesto <= 0) return { nivel: "sin", porcentaje: 0, restante: 0 };
    var razon = gastado / presupuesto;
    var nivel = razon >= 1 ? "rojo" : razon >= UMBRAL_AMBAR ? "ambar" : "verde";
    return { nivel: nivel, porcentaje: Math.floor(razon * 100), restante: presupuesto - gastado };
  }

  function mesesExcedidos(cal, tope) {
    if (!tope || tope <= 0) return [];
    return cal.filter(function (m) { return m.total > tope; }).map(function (m) { return m.mes; });
  }

  function agrupar(items, nombreDe, montoDe) {
    var acum = {};
    items.forEach(function (item) {
      var nombre = nombreDe(item);
      acum[nombre] = (acum[nombre] || 0) + montoDe(item);
    });
    return Object.keys(acum).map(function (nombre) { return { nombre: nombre, total: acum[nombre] }; })
      .sort(function (a, b) { return b.total - a.total || a.nombre.localeCompare(b.nombre, "es"); });
  }

  function porPersona(compras) {
    return agrupar(compras, function (c) { return (c.para || "").trim() || "Sin asignar"; }, function (c) { return c.monto; })
      .map(function (g) { return { para: g.nombre, total: g.total }; });
  }

  function porTarjeta(compras) {
    return agrupar(compras, function (c) { return c.tarjeta || "Sin tarjeta"; }, function (c) { return c.monto; })
      .map(function (g) { return { tarjeta: g.nombre, total: g.total }; });
  }

  function calendarioPorTarjeta(compras, gracia) {
    var cargos = [];
    compras.forEach(function (c) {
      mensualidades(c, gracia).forEach(function (m) { cargos.push({ mes: m.mes, tarjeta: c.tarjeta || "Sin tarjeta", monto: m.monto }); });
    });
    return calendario(compras, gracia).map(function (m) {
      var delMes = cargos.filter(function (x) { return x.mes === m.mes; });
      return {
        mes: m.mes,
        tarjetas: agrupar(delMes, function (x) { return x.tarjeta; }, function (x) { return x.monto; })
          .map(function (g) { return { tarjeta: g.nombre, total: g.total }; })
      };
    });
  }

  function simular(compras, config, nueva) {
    var hipotetica = { id: "simulada", fecha: nueva.fecha, tienda: "", concepto: "", para: "", monto: nueva.monto, meses: nueva.meses };
    var todas = compras.concat([hipotetica]);
    var totalDespues = totalComprado(todas);
    return {
      totalDespues: totalDespues,
      semaforo: semaforo(totalDespues, config.presupuesto),
      mesesExcedidos: mesesExcedidos(calendario(todas, config.gracia), config.topeMensual)
    };
  }

  function validarCompra(c) {
    return !!c && typeof c.id === "string" && c.id !== "" && typeof c.fecha === "string" && FECHA.test(c.fecha) &&
      typeof c.tienda === "string" && typeof c.concepto === "string" && typeof c.para === "string" &&
      Number.isInteger(c.monto) && c.monto > 0 && PLANES.indexOf(c.meses) >= 0 &&
      (c.tarjeta === undefined || c.tarjeta === "" || TARJETAS.indexOf(c.tarjeta) >= 0);
  }

  function exportar(compras, config) {
    return JSON.stringify({ version: VERSION_RESPALDO, compras: compras, config: config });
  }

  function importar(texto) {
    var datos;
    try { datos = JSON.parse(texto); } catch (e) { return null; }
    if (!datos || datos.version !== VERSION_RESPALDO || !Array.isArray(datos.compras) || !datos.config) return null;
    if (!datos.compras.every(validarCompra)) return null;
    return { compras: datos.compras, config: datos.config };
  }

  return {
    PLANES: PLANES, TARJETAS: TARJETAS, porTarjeta: porTarjeta, calendarioPorTarjeta: calendarioPorTarjeta, pesosACentavos: pesosACentavos, formatoMXN: formatoMXN, sumarMeses: sumarMeses,
    mensualidades: mensualidades, calendario: calendario, totalComprado: totalComprado, semaforo: semaforo,
    mesesExcedidos: mesesExcedidos, porPersona: porPersona, simular: simular, validarCompra: validarCompra,
    exportar: exportar, importar: importar
  };
});
