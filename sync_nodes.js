import fetch from 'node-fetch';
import https from 'https';

const FIREBASE_URL = "https://control-data-rockmell-default-rtdb.firebaseio.com";
const agent = new https.Agent({ rejectUnauthorized: false });

async function syncNodos() {
    try {
        // 1. Obtener datos del nodo origen
        const response = await fetch(FIREBASE_URL + '/RATES.json', { agent });
        const data = await response.json();

        // 2. Preparar fecha formateada
        const ahora = new Date();
        ahora.setHours(ahora.getHours() - 4);
        const fechaLegible = ahora.toLocaleString('es-VE');

        // 3. Escribir en el nodo destino
        await fetch(FIREBASE_URL + '/DATA_TASAS.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                tasa_dolar: data.tasa_dolar, 
                tasa_euro: data.tasa_euro, 
                fecha: fechaLegible 
            })
        });
        
        console.log("Sincronización completada exitosamente.");
    } catch(e) {
        console.error("Error al sincronizar: " + e.message);
    }
}

syncNodos();