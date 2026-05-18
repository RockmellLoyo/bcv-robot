import fetch from 'node-fetch';
import https from 'https';

const FIREBASE_URL = "https://control-data-rockmell-default-rtdb.firebaseio.com";
const TELEGRAM_TOKEN = "8819201042:aahmQbrjyBxYwmhd6qECdP92VM0BYsmi96e";
const TELEGRAM_CHAT_ID = "5844630655";
const agent = new https.Agent({ rejectUnauthorized: false });

async function correrLaboratorio() {
    // Capturar el argumento que le pasa el archivo .yml para saber qué método es
    const metodoRELEVO = process.argv || "desconocido";
    
    // 1. Captura del reloj del sistema operativo del servidor
    const fechaServidor = new Date();
    const horaISO = fechaServidor.toISOString();
    
    let horaVzlaFinal = "";
    let diaVzlaFinal = "";
    const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    if (metodoRELEVO === "geminis_metodo") {
        // Método Matemático: Resta manual de 4 horas
        const copiaFecha = new Date(fechaServidor.getTime());
        copiaFecha.setHours(copiaFecha.getHours() - 4);
        
        const dia = String(copiaFecha.getDate()).padStart(2, '0');
        const mes = String(copiaFecha.getMonth() + 1).padStart(2, '0');
        horaVzlaFinal = `${dia}/${mes}/${copiaFecha.getFullYear()} ${copiaFecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        diaVzlaFinal = DIAS[copiaFecha.getDay()];
    } else {
        // Método Variable TZ: Confía en que el sistema operativo se cambie solo
        horaVzlaFinal = fechaServidor.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        diaVzlaFinal = DIAS[fechaServidor.getDay()];
    }

    const paqueteDatos = {
        dueno_idea: metodoRELEVO === "geminis_metodo" ? "Gemini (Lógica de Desfase)" : "Método Extra (Confianza en TZ)",
        hora_ejecucion_servidor: horaISO,
        hora_que_proceso_el_sistema: horaVzlaFinal,
        dia_que_proceso_el_sistema: diaVzlaFinal
    };

    try {
        // Inyección en el sub-nodo correspondiente dentro de TEST
        await fetch(`${FIREBASE_URL}/TEST/${metodoRELEVO}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paqueteDatos),
            agent
        });

        // Enviar reporte directo a Telegram para verificación rápida
        const mensajeTG = `*?? EXPERIMENTO DE REPUTACIÓN (12:00 PM)*\n\n` +
                          `?? *Nodo:* \`${metodoRELEVO}\`\n` +
                          `?? *Estrategia:* ${paqueteDatos.dueno_idea}\n` +
                          `? *Hora que procesó:* \`${horaVzlaFinal}\`\n` +
                          `?? *Día que procesó:* \`${diaVzlaFinal}\`\n` +
                          `?? *Clock UTC Server:* \`${horaISO}\``;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mensajeTG, parse_mode: "Markdown" })
        });
    } catch (e) {
        // Silencioso
    }
}

correrLaboratorio().then(() => process.exit(0));