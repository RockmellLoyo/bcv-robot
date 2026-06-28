import fetch from 'node-fetch';
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

async function sincronizarYNotificar() {
    try {
        const respRates = await fetch(FIREBASE_URL + '/RATES.json', { agent });
        const rates = await respRates.json();
        
        const respDataTasas = await fetch(FIREBASE_URL + '/DATA_TASAS.json', { agent });
        const dataTasas = await respDataTasas.json();

        if (rates && dataTasas && rates.tasa_dolar === dataTasas.tasa_dolar) {
            process.exit(0);
        }

        await fetch(FIREBASE_URL + '/DATA_TASAS.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rates)
        });

        await enviarTelegram("*ROCKMELL SYSTEM CLOUD*\n\n*ACTUALIZACION DE TASAS DE TRABAJO*\n*TASA BCV : Bs. " + rates.tasa_dolar + "*\n*TASA EURO : Bs. " + rates.tasa_euro + "*");

    } catch(e) {
        console.error("Error: " + e.message);
    }
}

sincronizarYNotificar();