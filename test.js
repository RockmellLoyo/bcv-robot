import fetch from 'node-fetch';
import https from 'https';

const FIREBASE_URL = "https://control-data-rockmell-default-rtdb.firebaseio.com";
const TELEGRAM_TOKEN = "8819201042:AAHMqBRJYbXyWMHD6QecDp92vm0bySMI96E";
const TELEGRAM_CHAT_ID = "5844630655";
const agent = new https.Agent({ rejectUnauthorized: false });

async function correrLaboratorio() {
const metodoRELEVO = process.argv || "desconocido";

const fechaServidor = new Date();
const horaISO = fechaServidor.toISOString();

let horaVzlaFinal = "";
let diaVzlaFinal = "";
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

if (metodoRELEVO === "geminis_metodo") {
const copiaFecha = new Date(fechaServidor.getTime());
copiaFecha.setHours(copiaFecha.getHours() - 4);
const dia = String(copiaFecha.getDate()).padStart(2, '0');
const mes = String(copiaFecha.getMonth() + 1).padStart(2, '0');
horaVzlaFinal = `${dia}/${mes}/${copiaFecha.getFullYear()} ${copiaFecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
diaVzlaFinal = DIAS[copiaFecha.getDay()];
} else {
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
await fetch(`${FIREBASE_URL}/TEST/${metodoRELEVO}.json`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(paqueteDatos),
agent
});

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