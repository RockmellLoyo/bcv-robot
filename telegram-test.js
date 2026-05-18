async function probarTelegramDirecto() {
const url = "https://api.telegram.org/bot8819201042:AAHMqBRJYbXyWMHD6QecDp92vm0bySMI96E/sendMessage";
const paquete = {
chat_id: "5844630655",
text: "?? TEST DIRECTO: Si lees esto, el puente de Telegram está 100% ACTIVO y el token es correcto.",
parse_mode: "Markdown"
};

try {
const respuesta = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(paquete)
});
const resultado = await respuesta.json();
console.log("=== RESPUESTA DEL SERVIDOR DE TELEGRAM ===");
console.log(resultado);
} catch (error) {
console.log("=== ERROR DE CONEXIÓN ===");
console.log(error);
}
}

probarTelegramDirecto().then(() => process.exit(0));