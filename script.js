// Using public broker to ensure it works without local setup
const BROKER_URL = 'ws://test.mosquitto.org:8080';

// Generate a random ID to avoid collisions on public broker
const APP_ID = 'demo_user_123';
const TOPIC_MOISTURE = `gravity_meter_${APP_ID}/soil_moisture`;
const TOPIC_PUMP = `gravity_meter_${APP_ID}/pump`;

console.log(`Using Topics: ${TOPIC_MOISTURE}, ${TOPIC_PUMP}`);

const client = mqtt.connect(BROKER_URL);

const statusSpan = document.getElementById('connection-status');
const moistureSpan = document.getElementById('moisture-value');
const gravityIcon = document.getElementById('gravity-icon');
const waterBtn = document.getElementById('water-btn');

client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    statusSpan.textContent = 'Connected';
    statusSpan.style.color = 'green';

    // Subscribe to moisture updates
    client.subscribe(TOPIC_MOISTURE, (err) => {
        if (!err) {
            console.log(`Subscribed to ${TOPIC_MOISTURE}`);
        }
    });
});

client.on('message', (topic, message) => {
    if (topic === TOPIC_MOISTURE) {
        const moisture = parseFloat(message.toString());
        updateGravity(moisture);
    }
});

client.on('error', (err) => {
    console.error('Connection error:', err);
    statusSpan.textContent = 'Error';
    statusSpan.style.color = 'red';
});

client.on('offline', () => {
    console.log('Connection lost');
    statusSpan.textContent = 'Disconnected';
    statusSpan.style.color = 'orange';
});

// Update the icon position based on moisture
// 100% moisture = Top (0% top css)
// 0% moisture = Bottom (~85% top css to not overflow)
function updateGravity(moisture) {
    // Clamp moisture between 0 and 100
    moisture = Math.max(0, Math.min(100, moisture));

    moistureSpan.textContent = moisture.toFixed(1);

    // Calculate 'top' percentage. 
    // High moisture (100) -> Low gravity/High position -> top: 0%
    // Low moisture (0) -> High gravity/Low position -> top: 85% (leave room for icon height)

    const maxTop = 85;
    const currentTop = maxTop - (moisture / 100 * maxTop);

    gravityIcon.style.top = `${currentTop}%`;

    // Optional: Change icon or color based on state
    if (moisture < 20) {
        gravityIcon.textContent = '🍂'; // Dry leaf or similar
    } else {
        gravityIcon.textContent = '💧';
    }
}

// Handle Water Button
waterBtn.addEventListener('click', () => {
    console.log('Watering...');
    // Publish message to pump
    client.publish(TOPIC_PUMP, 'ON');

    // Optimistic UI update (optional, but requested "instantly turn on... icon floats back up")
    // The pump will likely reply with new moisture data effectively instantly in simulation,
    // but the sensor in real life takes time. The user requested "instantly turn on... (restore gravity)".
    // So we can simulate the "pump on" visual effect immediately if we want, or wait for the sensor reading.
    // For now, let's wait for the 'pump' message to trigger the moisture update from the esp32 side to keep logic centralized,
    // OR we can force a quick animation here. 
    // Let's rely on the mock to send a "100" or similar update quickly.
});
