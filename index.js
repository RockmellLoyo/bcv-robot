import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import https from 'https';

const FIREBASE_URL = "https://control-data-rockmell-default-rtdb.firebaseio.com";
const TELEGRAM_TOKEN = "8819201042:AAHMqBRJYbXyWMHD6QecDp92vm0bySMI96E";
const TELEGRAM_CHAT_ID = "5844630655";
const agent = new https.Agent({ rejectUnauthorized: false });

async function enviarTelegram(mensaje) {
const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
try {
await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mensaje, parse_mode: "Markdown" })
});
} catch (e) {
console.error("Error Telegram: " + e.message);
}
}

async function obtenerTasasBCV() {
try {
const checkResp = await fetch(FIREBASE_URL + '/DATA_TASAS.json', { agent });
const datosFirebase = await checkResp.json();
const tasaAnterior = datosFirebase ? parseFloat(datosFirebase.tasa_dolar) : 0;

const response = await fetch('https://www.bcv.org.ve', { agent });
const html = await response.text();
const $ = cheerio.load(html);
let usd = null;

$('.col-sm-6').each((i, el) => {
if ($(el).text().trim() === 'USD') usd = parseFloat($(el).next().text().trim().replace(',', '.'));
});

if (usd && usd > 0) {
const tasaNueva = Math.round(usd * 100) / 100;

if (tasaNueva === tasaAnterior) {
process.exit(0);
}

const ahora = new Date();
ahora.setHours(ahora.getHours() - 4);
const fechaLegible = ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString();

await fetch(FIREBASE_URL + '/DATA_TASAS.json', {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ tasa_dolar: tasaNueva, fecha: fechaLegible })
});

await enviarTelegram("*?? ROCKMELL SYSTEM CLOUD*\n\n?? *¡Nueva Tasa Detectada!*\n?? *USD:* " + tasaNueva + " Bs.");
}
} catch(e) {
console.error("Error: " + e.message);
}
}

obtenerTasasBCV();