import * as cheerio from 'cheerio';
const TELEGRAM_TOKEN = "8819201042:AAHMqBRJYbXyWMHD6QecDp92vm0bySMI96E";
const TELEGRAM_CHAT_ID = "5844630655";

async function probarConexiones() {
  console.log("==================================================");
  console.log("       INICIANDO ESCÁNER DE ULTRA DIAGNÓSTICO     ");
  console.log("==================================================");

  // 1. PROBAR CONEXIÓN A TELEGRAM
  console.log("\n?? PASO 1: Probando conexión con Telegram API...");
  try {
    const urlTelegram = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getMe`;
    const res = await fetch(urlTelegram);
    const data = await res.json();
    if (data.ok) {
      console.log(`? Conexión exitosa con Telegram. Bot detectado: @${data.result.username}`);
    } else {
      console.log(`? Telegram respondió, pero con error: ${data.description}`);
    }
  } catch (e) {
    console.log(`?? CRÍTICO: No se pudo conectar a Telegram desde la nube. Motivo: ${e.message}`);
  }

  // 2. PROBAR RASPADO DEL BCV
  console.log("\n?? PASO 2: Probando raspado del BCV...");
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("https://www.bcv.org.ve/", { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const html = await response.text();
    console.log(`? BCV respondió. Tamaño de la página: ${html.length} bytes.`);
    
    const $ = cheerio.load(html);
    let usd = null;
    $(".col-sm-6").each((i, el) => {
      const texto = $(el).text().trim();
      const valor = $(el).next().text().trim().replace(",", ".");
      if (texto === "USD") usd = parseFloat(valor);
    });

    if (usd) {
      console.log(`?? Tasa capturada con éxito: ${usd} Bs.`);
    } else {
      console.log("? No se encontró la etiqueta 'USD' en el HTML.");
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log("? TIMEOUT: El BCV bloqueó la IP de la nube (Tardó más de 12 segundos).");
    } else {
      console.log(`?? Error al conectar al BCV: ${e.message}`);
    }
  }
  console.log("\n==================================================");
}

probarConexiones().then(() => process.exit(0));