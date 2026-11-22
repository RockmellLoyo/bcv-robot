import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import https from 'https';

const FIREBASE_URL = "https://control-data-rockmell-default-rtdb.firebaseio.com";
const TELEGRAM_TOKEN = "8988193869:AAERkp3hk_xNFKrXciM7XV6lfQAT-iHogdc";
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

function limpiarNumeroBCV(texto) {
    if (!texto) return 0;
    const limpio = texto.replace(/\./g, '').replace(',', '.');
    return parseFloat(limpio) || 0;
}

async function obtenerTasasBCV() {
    try {
        const checkResp = await fetch(FIREBASE_URL + '/RATES.json', { agent });
        const datosFirebase = await checkResp.json();
        const tasaAnterior = datosFirebase ? parseFloat(datosFirebase.tasa_dolar) : 0;

        const response = await fetch('https://www.bcv.org.ve', { agent });
        const html = await response.text();
        const $ = cheerio.load(html);
        let usd = null, eur = null;

        $('.col-sm-6').each((i, el) => {
            const texto = $(el).text().trim();
            const textoValor = $(el).next().text().trim();
            
            if (texto === 'USD') usd = limpiarNumeroBCV(textoValor);
            if (texto === 'EUR') eur = limpiarNumeroBCV(textoValor);
        });

        if (usd && usd > 0) {
            const tasaDolar = usd;
            const tasaEuro = eur || (usd * 1.18);

            if (tasaDolar === tasaAnterior) {
                process.exit(0);
            }

            const ahora = new Date();
            ahora.setHours(ahora.getHours() - 4);
            const dia = String(ahora.getDate()).padStart(2, '0');
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            const anio = ahora.getFullYear();
            const fechaLegible = `${dia}/${mes}/${anio} ${ahora.toLocaleTimeString('es-VE')}`;

            await fetch(FIREBASE_URL + '/RATES.json', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tasa_dolar: tasaDolar, 
                    tasa_euro: tasaEuro, 
                    fecha: fechaLegible 
                })
            });

            await enviarTelegram("*ROCKMELL SYSTEM CLOUD*\n\n*ACTUALIZACION DEL BCV*\n*TASA BCV : Bs. " + tasaDolar + "*\n*TASA EURO : Bs. " + tasaEuro + "*");
        }
    } catch(e) {
        console.error("Error: " + e.message);
    }
}

obtenerTasasBCV();