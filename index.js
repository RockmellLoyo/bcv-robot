const cheerio = require("cheerio");
const FIREBASE_URL = "https://control-data-rockmell-default-rtdb.firebaseio.com";
const TELEGRAM_TOKEN = "8819201042:AAHMqBRJYbXyWMHD6QecDp92vm0bySMI96E";
const TELEGRAM_CHAT_ID = "5844630655";
async function enviarTelegram(mensaje) {
const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
try {
await fetch(url, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mensaje, parse_mode: "Markdown" })
});
} catch (e) {
console.error("Error Telegram: " + e.message);
}
}
async function obtenerTasasBCV() {
try {
const ahora = new Date();
ahora.setHours(ahora.getHours() - 4);
const dia = String(ahora.getDate()).padStart(2, '0');
const mes = String(ahora.getMonth() + 1).padStart(2, '0');
const anio = ahora.getFullYear();
const fechaHoyCorta = dia + "/" + mes + "/" + anio;
const checkResp = await fetch(FIREBASE_URL + "/DATA_TASAS/fecha_corta.json");
const ultimaFechaGuardada = await checkResp.json();
if (ultimaFechaGuardada === fechaHoyCorta) {
console.log("Ya se actualizo hoy. Abortando.");
process.exit(0);
}
const response = await fetch("https://www.bcv.org.ve/");
const html = await response.text();
const $ = cheerio.load(html);
let usd = null, eur = null;
$(".col-sm-6").each((i, el) => {
const texto = $(el).text().trim();
const valor = $(el).next().text().trim().replace(",", ".");
if (texto === "USD") usd = parseFloat(valor);
if (texto === "EUR") eur = parseFloat(valor);
});
if (usd && usd > 0) {
let hora = ahora.getHours();
const minutos = String(ahora.getMinutes()).padStart(2, '0');
const ampm = hora >= 12 ? "pm" : "am";
hora = hora % 12;
hora = hora ? hora : 12;
const fechaLegible = fechaHoyCorta + " " + hora + ":" + minutos + " " + ampm;
const tasaDolar = Math.round(usd * 100) / 100;
const tasaEuro = Math.round((eur || (usd * 1.18)) * 100) / 100;
await fetch(FIREBASE_URL + "/DATA_TASAS.json", {
method: "PUT",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ tasa_dolar: tasaDolar, tasa_euro: tasaEuro, fecha: fechaLegible, fecha_corta: fechaHoyCorta })
});
const reporte = `*? ROCKMELL SYSTEM CLOUD*\n\n?? *Tasa BCV Sincronizada*\n?? *USD:* ${tasaDolar} Bs.\n\n?? _Fecha:_ ${fechaLegible}`;
await enviarTelegram(reporte);
}
} catch (e) {
console.error("Error: " + e.message);
}
}
obtenerTasasBCV().then(() => process.exit(0));