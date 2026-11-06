// Ejecutar: node tools/prueba_logica.js
const assert = require("assert");
const L = require("../src/logica.js");

assert.strictEqual(L.pesosACentavos("1,299.50"), 129950, "coma de miles y centavos");
assert.strictEqual(L.pesosACentavos("$ 500"), 50000, "signo de pesos y espacios");
assert.strictEqual(L.pesosACentavos("0.1"), 10);
assert.strictEqual(L.pesosACentavos("abc"), null);
assert.strictEqual(L.pesosACentavos("-5"), null, "no acepta negativos");
assert.strictEqual(L.pesosACentavos("0"), null, "cero no es una compra");
assert.strictEqual(L.pesosACentavos("1.999"), null, "mas de dos decimales");
assert.strictEqual(L.pesosACentavos("19.99"), 1999, "sin error de punto flotante");

assert.strictEqual(L.formatoMXN(129950), "$1,299.50");
assert.strictEqual(L.formatoMXN(0), "$0.00");
assert.strictEqual(L.formatoMXN(100000000), "$1,000,000.00");

assert.strictEqual(L.sumarMeses("2026-11", 1), "2026-12");
assert.strictEqual(L.sumarMeses("2026-11", 2), "2027-01", "cruza de ano");
assert.strictEqual(L.sumarMeses("2026-12", 13), "2028-01");

const contado = { id: "a", fecha: "2026-11-14", tienda: "Liverpool", concepto: "Perfume", para: "Mamá", monto: 100000, meses: 1 };
const msi3 = { id: "b", fecha: "2026-11-15", tienda: "Amazon", concepto: "Bocina", para: "Papá", monto: 100000, meses: 3 };
const msi6 = { id: "c", fecha: "2026-11-16", tienda: "Coppel", concepto: "Tele", para: "Casa", monto: 100001, meses: 6 };

assert.deepStrictEqual(L.mensualidades(contado, 0), [{ mes: "2026-11", monto: 100000 }], "contado cae en el mes de la compra");
assert.deepStrictEqual(L.mensualidades(contado, 1), [{ mes: "2026-12", monto: 100000 }], "con corte, cae el mes siguiente");
const m3 = L.mensualidades(msi3, 1);
assert.deepStrictEqual(m3.map((x) => x.mes), ["2026-12", "2027-01", "2027-02"]);
assert.strictEqual(m3.reduce((s, x) => s + x.monto, 0), 100000, "las mensualidades suman el monto exacto");
const m6 = L.mensualidades(msi6, 1);
assert.strictEqual(m6.length, 6);
assert.strictEqual(m6.reduce((s, x) => s + x.monto, 0), 100001, "el residuo no se pierde");
assert.ok(m6[5].monto >= m6[0].monto, "la ultima absorbe el residuo");

const cal = L.calendario([contado, msi3, msi6], 1);
assert.deepStrictEqual(cal.map((x) => x.mes), ["2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05"], "ordenado por mes");
assert.strictEqual(cal[0].total, 100000 + 33333 + 16666, "diciembre suma las tres compras");
assert.strictEqual(cal.reduce((s, x) => s + x.total, 0), 300001, "el calendario completo suma todo lo comprado");
assert.deepStrictEqual(L.calendario([], 1), []);

assert.strictEqual(L.totalComprado([contado, msi3, msi6]), 300001);
assert.strictEqual(L.totalComprado([]), 0);

assert.deepStrictEqual(L.semaforo(0, 100000), { nivel: "verde", porcentaje: 0, restante: 100000 });
assert.strictEqual(L.semaforo(79999, 100000).nivel, "verde");
assert.strictEqual(L.semaforo(80000, 100000).nivel, "ambar", "al 80 % avisa");
assert.strictEqual(L.semaforo(99999, 100000).nivel, "ambar");
assert.strictEqual(L.semaforo(100000, 100000).nivel, "rojo", "al 100 % es rojo");
const pasado = L.semaforo(125000, 100000);
assert.strictEqual(pasado.nivel, "rojo");
assert.strictEqual(pasado.restante, -25000, "restante negativo cuando te pasas");
assert.strictEqual(pasado.porcentaje, 125);
assert.strictEqual(L.semaforo(5000, 0).nivel, "sin", "sin presupuesto definido");
assert.strictEqual(L.semaforo(5000, null).nivel, "sin");

assert.deepStrictEqual(L.mesesExcedidos(cal, 140000), ["2026-12"], "mes que rebasa el tope mensual");
assert.deepStrictEqual(L.mesesExcedidos(cal, 0), [], "sin tope no hay excedidos");
assert.deepStrictEqual(L.mesesExcedidos(cal, null), []);

const personas = L.porPersona([contado, msi3, msi6]);
assert.deepStrictEqual(personas, [
  { para: "Casa", total: 100001 }, { para: "Mamá", total: 100000 }, { para: "Papá", total: 100000 },
], "ordenado de mayor a menor y luego por nombre");
assert.strictEqual(L.porPersona([{ ...contado, para: "" }])[0].para, "Sin asignar");

const config = { presupuesto: 400000, topeMensual: 150000, gracia: 1 };
const sim = L.simular([contado, msi3], config, { monto: 120000, meses: 1, fecha: "2026-11-20" });
assert.strictEqual(sim.totalDespues, 320000, "total comprado mas la compra simulada");
assert.strictEqual(sim.semaforo.nivel, "ambar", "320 de 400 mil es 80 %");
assert.deepStrictEqual(sim.mesesExcedidos, ["2026-12"], "la compra de contado revienta el tope de diciembre");
const simMsi = L.simular([contado, msi3], config, { monto: 120000, meses: 12, fecha: "2026-11-20" });
assert.deepStrictEqual(simMsi.mesesExcedidos, [], "a 12 meses ningun mes rebasa el tope");
assert.strictEqual(L.simular([], { presupuesto: null, topeMensual: null, gracia: 1 }, { monto: 5000, meses: 1, fecha: "2026-11-20" }).semaforo.nivel, "sin");

const respaldo = L.exportar([contado, msi3], config);
const vuelta = L.importar(respaldo);
assert.deepStrictEqual(vuelta.compras, [contado, msi3], "exportar e importar es identidad");
assert.deepStrictEqual(vuelta.config, config);
assert.strictEqual(L.importar("no es json"), null);
assert.strictEqual(L.importar(JSON.stringify({ version: 1, compras: [{ id: "x" }], config })), null, "rechaza compras incompletas");
assert.strictEqual(L.importar(JSON.stringify({ version: 99, compras: [], config })), null, "rechaza version desconocida");

assert.strictEqual(L.validarCompra({ ...contado, meses: 5 }), false, "meses fuera de los planes validos");
assert.strictEqual(L.validarCompra({ ...contado, monto: 0 }), false);
assert.strictEqual(L.validarCompra({ ...contado, fecha: "14/11/2026" }), false);
assert.strictEqual(L.validarCompra(contado), true);

assert.deepStrictEqual(L.TARJETAS, ["BBVA", "Banorte", "Banamex", "Invex", "Didi", "Nu", "Liverpool", "Otra"]);
const conTarjeta = [{ ...contado, tarjeta: "Liverpool" }, { ...msi3, tarjeta: "BBVA" }, { ...msi6, tarjeta: "Nu" }];
assert.strictEqual(L.validarCompra(conTarjeta[0]), true);
assert.strictEqual(L.validarCompra({ ...contado, tarjeta: "" }), true, "tarjeta vacia es valida");
assert.strictEqual(L.validarCompra({ ...contado, tarjeta: "Visa" }), false, "tarjeta fuera de la lista");
assert.strictEqual(L.validarCompra({ ...contado, tarjeta: 5 }), false);
assert.strictEqual(L.importar(L.exportar([contado], config)).compras.length, 1, "respaldos sin tarjeta siguen validos");

assert.deepStrictEqual(L.porTarjeta(conTarjeta), [
  { tarjeta: "Nu", total: 100001 }, { tarjeta: "BBVA", total: 100000 }, { tarjeta: "Liverpool", total: 100000 },
], "mayor a menor y luego por nombre");
assert.strictEqual(L.porTarjeta([contado])[0].tarjeta, "Sin tarjeta");
assert.deepStrictEqual(L.porTarjeta([]), []);

const porMes = L.calendarioPorTarjeta(conTarjeta, 1);
assert.deepStrictEqual(porMes.map((x) => x.mes), L.calendario(conTarjeta, 1).map((x) => x.mes), "mismos meses que el calendario");
assert.deepStrictEqual(porMes[0].tarjetas, [
  { tarjeta: "Liverpool", total: 100000 }, { tarjeta: "BBVA", total: 33333 }, { tarjeta: "Nu", total: 16666 },
], "diciembre desglosado por tarjeta");
assert.strictEqual(porMes.reduce((s, m) => s + m.tarjetas.reduce((t, x) => t + x.total, 0), 0), 300001, "el desglose suma lo comprado");

const compraEl = (fecha, extra) => ({ id: "z", fecha, tienda: "", concepto: "", para: "", monto: 90000, meses: 3, tarjeta: "BBVA", ...extra });
const corteTemprano = { corte: 5, limite: 25 };
const corteTardio = { corte: 25, limite: 15 };
assert.strictEqual(L.mesDelPrimerPago("2026-11-03", corteTemprano), "2026-11", "antes del corte y limite despues del corte: paga ese mismo mes");
assert.strictEqual(L.mesDelPrimerPago("2026-11-05", corteTemprano), "2026-11", "el dia del corte aun entra al estado actual");
assert.strictEqual(L.mesDelPrimerPago("2026-11-06", corteTemprano), "2026-12", "pasado el corte entra al estado siguiente");
assert.strictEqual(L.mesDelPrimerPago("2026-11-20", corteTardio), "2026-12", "limite antes del corte: paga el mes siguiente");
assert.strictEqual(L.mesDelPrimerPago("2026-11-28", corteTardio), "2027-01", "pasado el corte y limite antes: dos meses despues");
assert.strictEqual(L.mesDelPrimerPago("2026-12-30", corteTardio), "2027-02", "cruce de ano");
assert.strictEqual(L.mesDelPrimerPago("2026-11-10", null, 1), "2026-12", "sin regla usa el desfase general");
assert.strictEqual(L.mesDelPrimerPago("2026-11-10", undefined, 0), "2026-11");

const reglas = { BBVA: corteTemprano };
assert.deepStrictEqual(L.mensualidades(compraEl("2026-11-10"), 1, reglas).map((x) => x.mes), ["2026-12", "2027-01", "2027-02"]);
assert.deepStrictEqual(L.mensualidades(compraEl("2026-11-03"), 1, reglas).map((x) => x.mes), ["2026-11", "2026-12", "2027-01"], "la regla de la tarjeta manda sobre el desfase general");
assert.deepStrictEqual(L.mensualidades(compraEl("2026-11-03", { tarjeta: "Nu" }), 1, reglas).map((x) => x.mes), ["2026-12", "2027-01", "2027-02"], "tarjeta sin regla usa el desfase general");
assert.deepStrictEqual(L.mensualidades(compraEl("2026-11-03", { tarjeta: undefined }), 0, reglas).map((x) => x.mes), ["2026-11", "2026-12", "2027-01"], "sin tarjeta usa el desfase general");
assert.strictEqual(L.calendario([compraEl("2026-11-03")], 1, reglas)[0].mes, "2026-11");
assert.strictEqual(L.calendarioPorTarjeta([compraEl("2026-11-03")], 1, reglas)[0].mes, "2026-11");

assert.strictEqual(L.reglaValida({ corte: 5, limite: 25 }), true);
assert.strictEqual(L.reglaValida({ corte: 0, limite: 25 }), false);
assert.strictEqual(L.reglaValida({ corte: 5, limite: 32 }), false);
assert.strictEqual(L.reglaValida({ corte: 5.5, limite: 20 }), false);
assert.strictEqual(L.reglaValida({ corte: 5 }), false);
assert.strictEqual(L.reglaValida(null), false);

const cfgReglas = { presupuesto: 400000, topeMensual: 150000, gracia: 1, tarjetas: reglas };
const simRegla = L.simular([], cfgReglas, { monto: 90000, meses: 1, fecha: "2026-11-03", tarjeta: "BBVA" });
assert.deepStrictEqual(simRegla.mesesExcedidos, [], "simular acepta tarjeta y reglas");
assert.strictEqual(simRegla.primerPago, "2026-11", "la simulacion informa el mes del primer pago");

console.log("prueba_logica: todo en verde");
