const mqtt = require('mqtt');

// Connect to the public MQTT broker
const client = mqtt.connect('mqtt://test.mosquitto.org:1883');

// MUST MATCH THE ID IN script.js. 
// For this demo, let's hardcode a specific ID so we don't have to sync them dynamically.
// I will update script.js in the next step to use this same fixed ID.
const APP_ID = 'demo_user_123';
const TOPIC_MOISTURE = `gravity_meter_${APP_ID}/soil_moisture`;
const TOPIC_PUMP = `gravity_meter_${APP_ID}/pump`;

// Simulation state
let moisture = 100; // Start at 100%
const DRYING_RATE = 2; // Decrease by 2% every tick
const TICK_INTERVAL = 1000; // Update every second

client.on('error', (err) => {
    console.error('MQTT Error:', err);
});

client.on('offline', () => {
    console.log('MQTT Client is offline');
});

client.on('reconnect', () => {
    console.log('MQTT Client reconnecting...');
});

client.on('connect', () => {
    console.log('ESP32 Mock Connected to MQTT Broker');

    // Subscribe to pump topic
    client.subscribe(TOPIC_PUMP, (err) => {
        if (!err) {
            console.log(`Subscribed to ${TOPIC_PUMP}`);
        }
    });

    // Start simulation loop
    setInterval(simulationLoop, TICK_INTERVAL);
});

client.on('message', (topic, message) => {
    if (topic === TOPIC_PUMP) {
        console.log(`Received command: ${message.toString()}`);
        if (message.toString() === 'ON') {
            activatePump();
        }
    }
});

function activatePump() {
    console.log('>>> PUMP ACTIVATED! Restoring gravity...');
    // Instantly restore moisture to 100%
    moisture = 100;
    // Immediately publish the new state
    publishMoisture();
}

function simulationLoop() {
    // Decrease moisture
    moisture -= DRYING_RATE;
    if (moisture < 0) moisture = 0;

    publishMoisture();
}

function publishMoisture() {
    console.log(`Soil Moisture: ${moisture}%`);
    client.publish(TOPIC_MOISTURE, moisture.toString());
}
