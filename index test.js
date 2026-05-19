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
  try {
    const ahora = new Date();
    ahora.setHours(ahora.getHours() - 4);
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    const fechaHoyCorta = dia + "/" + mes + "/" + anio;

    console.log("Conectando al BCV con límite de 15 segundos...");
    
    // Creamos el freno de mano por tiempo (Timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos maximo

    const response = await fetch("https://www.bcv.org.ve/", { signal: controller.signal });
    clearTimeout(timeoutId); // Si responde a tiempo, quitamos el freno

    const html = await response.text();
    const $ = cheerio.load(html);
    let usd = null;

    $(".col-sm-6").each((i, el) => {
      const texto = $(el).text().trim();
      const valor = $(el).next().text().trim().replace(",", ".");
      if (texto === "USD") usd = parseFloat(valor);
    });

    if (usd && usd > 0) {
      let hora = ahora.getHours();
      const minutos = String(ahora.getMinutes()).padStart(2, '0');
      const ampm = hora >= 12 ? "pm" : "am";
      hora = hora % 12;
      hora = hora ? hora : 12;
      const fechaLegible = fechaHoyCorta + " " + hora + ":" + minutes + " " + ampm;
      const tasaDolar = Math.round(usd * 100) / 100;

      const reporte = `*?? BOMBA DE TIEMPO (TEST)*\n\n?? *Robot activo en la nube*\n?? *USD:* ${tasaDolar} Bs.\n\n? _Sincronización manual forzada exitosa_`;
      await enviarTelegram(reporte);
    } else {
      console.log("No se pudieron extraer las tasas del HTML.");
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      console.error("? ERROR: El BCV tardó demasiado en responder (Timeout). Servidor bloqueado.");
      await enviarTelegram("?? *ALERTA TEST:* El BCV tiene la IP bloqueada o está caído en la nube (Timeout de 15s).");
    } else {
      console.error("Error: " + e.message);
    }
  }
}

obtenerTasasBCV().then(() => process.exit(0));