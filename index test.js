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
    // Capturamos el número de disparo que le enviamos desde GitHub (por defecto 1)
    const numeroDisparo = process.env.NUMERO_DISPARO || "1";

    const ahora = new Date();
    ahora.setHours(ahora.getHours() - 4);
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    const fechaHoyCorta = dia + "/" + mes + "/" + anio;

    const response = await fetch("https://www.bcv.org.ve/");
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

      // Reporte limpio directo a tu Telegram sin tocar Firebase
      const reporte = `*?? BOMBA DE TIEMPO (TEST)*\n\n?? *Disparo:* ${numeroDisparo} de 3\n?? *USD:* ${tasaDolar} Bs.\n\n? _Sincronización manual sin Firebase exitosa_`;
      await enviarTelegram(reporte);
    }
  } catch (e) {
    console.error("Error: " + e.message);
  }
}

obtenerTasasBCV().then(() => process.exit(0));