import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import https from 'https';

const FIREBASE_URL = "https://control-data-rockmell-default-rtdb.firebaseio.com";
const TELEGRAM_TOKEN = "8988193869:AAERkp3hk_xNFKrXciM7XV6lfQAT-iHogdc";
const TELEGRAM_CHAT_ID = "5844630655";
const agent = new https.Agent({ rejectUnauthorized: false });

const accion = process.argv[2] || 'update';

function fechaFormateada(d) {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = d.toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true});
    return `${dia}/${mes}/${anio} ${hora.toLowerCase()}`;
}

async function firebaseGet(path) {
    try {
        const r = await fetch(`${FIREBASE_URL}/${path}.json?t=${Date.now()}`);
        return await r.json();
    } catch(e) { return null; }
}

async function firebasePut(path, data) {
    try {
        await fetch(`${FIREBASE_URL}/${path}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return true;
    } catch(e) { return false; }
}

async function firebaseDelete(path) {
    try {
        await fetch(`${FIREBASE_URL}/${path}.json`, { method: 'DELETE' });
        return true;
    } catch(e) { return false; }
}

async function enviarTelegram(mensaje) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mensaje, parse_mode: 'HTML' })
        });
    } catch(e) {}
}

async function rasparBCV() {
    try {
        const res = await fetch('https://www.bcv.org.ve', { agent });
        const html = await res.text();
        const $ = cheerio.load(html);
        const usdRaw = parseFloat($('.col-sm-6').filter((i, el) => $(el).text().trim() === 'USD').next().text().trim().replace(',', '.'));
        const eurRaw = parseFloat($('.col-sm-6').filter((i, el) => $(el).text().trim() === 'EUR').next().text().trim().replace(',', '.'));
        if (isNaN(usdRaw)) return null;
        const usd = Math.round(usdRaw * 100) / 100;
        const eur = Math.round(eurRaw * 100) / 100;
        return { usd, eur };
    } catch(e) {
        return null;
    }
}

async function leerRates() {
    const rates = await firebaseGet('RATES');
    if (!rates || !rates.tasa_dolar) return null;
    return {
        usd: parseFloat(rates.tasa_dolar),
        eur: rates.tasa_euro ? parseFloat(rates.tasa_euro) : null
    };
}

async function ejecutarUpdate() {
    const bcv = await rasparBCV();
    if (!bcv) {
        console.log('No se pudo raspar BCV.');
        return false;
    }

    const rates = await leerRates();
    if (!rates) {
        console.log('No se pudo leer RATES.');
        return false;
    }

    if (Math.abs(bcv.usd - rates.usd) < 0.001) {
        console.log('BCV sin cambios vs RATES. No hay nada nuevo.');
        return false;
    }

    const last = await firebaseGet('TASAS/LAST');

    if (last && last.tasa_dolar) {
        const lastUSD = parseFloat(last.tasa_dolar);
        if (Math.abs(lastUSD - bcv.usd) < 0.001) {
            console.log('LAST ya tiene la tasa nueva. No se toca.');
            return false;
        }
    }

    const fechaTasa = fechaFormateada(new Date());

    await firebasePut('TASAS/LAST', {
        fecha: fechaTasa,
        tasa_dolar: bcv.usd,
        tasa_euro: bcv.eur
    });

    const old = await firebaseGet('TASAS/OLD');
    if (old && old.tasa_dolar) {
        await firebaseDelete('TASAS/OLD');
    }

    await enviarTelegram(`<b>- ULTIMA TASA PUBLICADA -</b>\n<b>DOLAR : ${bcv.usd.toFixed(2)} Bs</b>\n<b>EURO : ${bcv.eur.toFixed(2)} Bs</b>\n<b>${fechaTasa}</b>`);
    console.log('Update aplicado: ' + bcv.usd);
    return true;
}

async function ejecutarNewDay() {
    const last = await firebaseGet('TASAS/LAST');

    if (!last || !last.tasa_dolar) {
        console.log('No hay LAST pendiente. No se rota.');
        return false;
    }

    const on = await firebaseGet('TASAS/ON');
    if (on && on.tasa_dolar) {
        await firebasePut('TASAS/OLD', {
            fecha: on.fecha,
            tasa_dolar: on.tasa_dolar,
            tasa_euro: on.tasa_euro
        });
    }

    await firebasePut('TASAS/ON', {
        fecha: last.fecha,
        tasa_dolar: last.tasa_dolar,
        tasa_euro: last.tasa_euro
    });

    await firebaseDelete('TASAS/LAST');

    await enviarTelegram(`<b>- CAMBIO DE DIA -</b>\n<b>TASA ON : ${last.tasa_dolar.toFixed(2)} Bs</b>\n<b>Fecha : ${last.fecha}</b>`);
    console.log('Rotacion aplicada: ' + last.tasa_dolar);
    return true;
}

async function main() {
    console.log('Accion recibida: ' + accion);
    if (accion === 'update') {
        await ejecutarUpdate();
    } else if (accion === 'newday') {
        await ejecutarNewDay();
    } else {
        console.log('Accion no reconocida: ' + accion);
    }
    process.exit(0);
}

main();