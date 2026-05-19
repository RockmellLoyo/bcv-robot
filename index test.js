import * as cheerio from 'cheerio';
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
  let reporteFinal = "";
  try {
    const ahora = new Date();
    ahora.setHours(ahora.getHours() - 4);
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    const fechaHoyCorta = dia + "/" + mes + "/" + anio;

    console.log("Conectando al BCV...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://www.bcv.org.ve/", { signal: controller.signal });
    clearTimeout(timeoutId);

    const html = await response.text();
    
    // Alerta de página vacía o bloqueo sutil
    if (!html || html.length < 500) {
      reporteFinal = `?? *ALERTA:* El BCV devolvió una página vacía o incompleta en la nube (Tamaño: ${html ? html.length : 0} bytes).`;
    } else {
      const $ = cheerio.load(html);
      let usd = null;

      $(".col-sm-6").each((i, el) => {
        const texto = $(el).text().trim();
        const valor = $(el).next().text().trim().replace(",", ".");
        if (texto === "USD") usd = parseFloat(valor);
      });

      if (usd && usd > 0) {
        const tasaDolar = Math.round(usd * 100) / 100;
        reporteFinal = `*?? BOMBA DE TIEMPO (TEST)*\n\n?? *Robot activo en la nube*\n?? *USD:* ${tasaDolar} Bs.\n\n? _Sincronización manual forzada exitosa_`;
      } else {
        reporteFinal = `? *ERROR DE PARSEO:* Se conectó al BCV pero no se encontró la etiqueta 'USD' en el HTML de la nube.`;
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      reporteFinal = "? *TIMEOUT:* El BCV tardó más de 15 segundos en responder en la nube (IP bloqueada).";
    } else {
      reporteFinal = `?? *ERROR GENERAL:* ${e.message}`;
    }
  }

  // PASE LO QUE PASE, EL TELEGRAM VA A DISPARAR PARA AVISARTE QUÉ PASÓ
  await enviarTelegram(reporteFinal);
}

obtenerTasasBCV().then(() => process.exit(0));