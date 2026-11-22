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

        const response = await fetch('https://www.bcv.org.ve', { 
            agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        let textoDolar = "";
        let textoEuro = "";

        $('#dolar').each((i, el) => { textoDolar = $(el).text(); });
        $('#euro').each((i, el) => { textoEuro = $(el).text(); });

        if (!textoDolar || !textoEuro) {
            $('.col-sm-6').each((i, el) => {
                const texto = $(el).text().trim();
                if (texto === 'USD') textoDolar = $(el).next().text();
                if (texto === 'EUR') textoEuro = $(el).next().text();
            });
        }

        const regexTasa = /(\d{1,3}(?:\.\d{3})*,\d+|\d+,\d+|\d+\.\d+)/;
        
        const matchUSD = textoDolar.match(regexTasa);
        const matchEUR = textoEuro.match(regexTasa);

        const usd = matchUSD ? limpiarNumeroBCV(matchUSD[0]) : 0;
        const eur = matchEUR ? limpiarNumeroBCV(matchEUR[0]) : 0;

        if (usd > 0) {
            const tasaDolar = usd;
            const tasaEuro = eur > 0 ? eur : (usd * 1.18);

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