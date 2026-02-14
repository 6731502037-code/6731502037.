#include <WiFi.h>
#include <PubSubClient.h>

// Update these with your network credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;

// Topics - MATCH THESE WITH YOUR DASHBOARD (check script.js for the random ID, e.g. "gravity_meter_demo_user_123")
const char* topic_moisture = "gravity_meter_demo_user_123/soil_moisture";
const char* topic_pump = "gravity_meter_demo_user_123/pump";

WiFiClient espClient;
PubSubClient client(espClient);

// Pin definitions
const int DRY_PIN = 34; // Analog pin for soil moisture sensor
const int PUMP_PIN = 26; // Digital pin for Pump/LED (Blue LED often on GPIO 2 or similar)

// Variables
long lastMsg = 0;
float moisture = 100.0; // Simulated or read value

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();

  // If a message is received on the pump topic, check if it says "ON"
  if (String(topic) == topic_pump) {
    if (messageTemp == "ON") {
      Serial.println("Pump Activated!");
      digitalWrite(PUMP_PIN, HIGH); // Turn on
      delay(2000); // Keep on for 2 seconds
      digitalWrite(PUMP_PIN, LOW); // Turn off
      
      // Reset moisture for simulation/demo purposes (optional)
      // In reality, the sensor would just read the new value naturally.
      // But for "instant" visual feedback if the sensor is slow:
      client.publish(topic_moisture, "100"); 
    }
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // Resubscribe
      client.subscribe(topic_pump);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW); // Start off
  
  // Set up WiFi and MQTT
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 1000) { // Send data every 1 second
    lastMsg = now;
    
    // Read soil moisture (Example mapping)
    // int sensorValue = analogRead(DRY_PIN);
    // moisture = map(sensorValue, 4095, 0, 0, 100); // Adjust min/max for your sensor
    
    // For now, let's just publish a dummy value or the last known state
    // In a real app, uncomment the reading logic above.
    
    // client.publish(topic_moisture, String(moisture).c_str());
  }
}
