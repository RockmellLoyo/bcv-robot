const TELEGRAM_TOKEN = "8819201042:AAHMqBRJYbXyWMHD6QecDp92vm0bySMI96E";
const TELEGRAM_CHAT_ID = "5844630655";

async function probarTelegram() {
  console.log("=== INICIANDO DIAGNÓSTICO DE TELEGRAM ===");
  console.log("Verificando conexión con los servidores de Telegram...");
  
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: TELEGRAM_CHAT_ID, 
        text: "?? *SISTEMA ROCKMELL:* Si lees esto, la conexión local con Telegram está perfecta y el Token/Chat ID funcionan.", 
        parse_mode: "Markdown" 
      })
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
      console.log("\n? ¡ÉXITO TOTAL!");
      console.log("El mensaje se envió correctamente. Revisa tu aplicación de Telegram.");
    } else {
      console.log("\n? TELEGRAM RECHAZÓ EL MENSAJE:");
      console.log(`Código de error: ${resultado.error_code}`);
      console.log(`Descripción: ${resultado.description}`);
      console.log("\n?? TIPS DE SOLUCIÓN:");
      if (resultado.error_code === 401) console.log("- El TELEGRAM_TOKEN está mal escrito o expiró.");
      if (resultado.error_code === 400) console.log("- El TELEGRAM_CHAT_ID es incorrecto o no has iniciado el bot dándole al botón /start.");
    }

  } catch (e) {
    console.log("\n?? ERROR DE RED/SISTEMA:");
    console.log(e.message);
    console.log("- Revisa si tienes internet en la PC o si un firewall está bloqueando a Node.js.");
  }
}

probarTelegram();