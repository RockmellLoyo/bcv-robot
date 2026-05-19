import * as cheerio from 'cheerio';
const TELEGRAM_TOKEN = "8819201042:AAHMqBRJYbXyWMHD6QecDp92vm0bySMI96E";
const TELEGRAM_CHAT_ID = "5844630655";

async function contarEnviosTelegram() {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?limit=100`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data.ok) return 0;

    // Contamos cuántos mensajes del test ha enviado el bot en las últimas horas
    let conteo = 0;
    const mensajes = data.result || [];
    
    // Telegram solo guarda las últimas 24 horas o hasta que se lean, 
    // así que filtramos por el texto exacto de nuestro encabezado
    for (const m of mensajes) {
      if (m.message && m.message.from && m.message.from.is_bot) {
        if (m.message.text && m.message.text.includes("?? BOMBA DE TIEMPO (TEST)")) {
          conteo++;
        }
      }
    }
    return conteo;
  } catch (e) {
    console.error("Error leyendo historial de Telegram: " + e.message);
    return 0;
  }
}

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
    // 1. REVISAR CUÁNTOS DISPAROS LLEVAMOS LEYENDO EL CHAT
    let disparosHechos = await contarEnviosTelegram();

    if (disparosHechos >= 3) {
      console.log(`Test completado (${disparosHechos}/3). Robot durmiendo para siempre.`);
      process.exit(0);
    }

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
      const fechaLegible = fechaHoyCorta + " " + hora + ":" + minutos + " " + ampm;
      const tasaDolar = Math.round(usd * 100) / 100;

      // 2. CONTROL DEL NÚMERO DE DISPARO ACTUAL
      const disparoActual = disparosHechos + 1;

      // --- CRITICAL: SE ELIMINÓ TODA CONEXIÓN O ENVÍO A FIREBASE ---

      // 3. ENVIAR EXCLUSIVAMENTE AL TELEGRAM
      const reporte = `*?? BOMBA DE TIEMPO (TEST)*\n\n?? *Disparo:* ${disparoActual} de 3\n?? *USD:* ${tasaDolar} Bs.\n\n? _Estado: Sincronización limpia sin Firebase. Próximo ciclo en 10 min_`;
      await enviarTelegram(reporte);
    }
  } catch (e) {
    console.error("Error: " + e.message);
  }
}

obtenerTasasBCV().then(() => process.exit(0));