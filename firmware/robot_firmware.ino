// ============================================================
// ESP32 Green Urban Robot Firmware
// Libraries cần cài qua Arduino Library Manager:
//   - ArduinoJson (Benoit Blanchon)
//   - TinyGPSPlus (Mikal Hart)
//   - ESP32 Camera (đã có trong ESP32 board package)
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>
#include <WiFiManager.h>
#include <ESPmDNS.h>
#include "esp_camera.h"

// ============================================================
// CONFIGURATION — Sửa các giá trị này
// ============================================================
// WiFiManager sẽ tự động quản lý WiFi, không cần khai báo SSID/Pass ở đây nữa

// Supabase Edge Function URLs
const char* TELEMETRY_URL  = "https://glbmjvnhdulpqiavmdai.supabase.co/functions/v1/telemetry";
const char* COMMANDS_URL   = "https://glbmjvnhdulpqiavmdai.supabase.co/functions/v1/commands";
const char* SUPABASE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYm1qdm5oZHVscHFpYXZtZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzM5MTYsImV4cCI6MjA5MTE0OTkxNn0.CIL6J1cj2NXPY6oqJKv63Un6MTw9h2hakUq7KW5OTOE";

// User ID và Device ID sẽ được xử lý tự động
String deviceID = ""; 

// GPS UART pins (dùng Serial2)
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define GPS_BAUD   9600

// Camera model (AI Thinker ESP32-CAM)
#define PWDN_GPIO_NUM  32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM   0
#define SIOD_GPIO_NUM  26
#define SIOC_GPIO_NUM  27
#define Y9_GPIO_NUM    35
#define Y8_GPIO_NUM    34
#define Y7_GPIO_NUM    39
#define Y6_GPIO_NUM    36
#define Y5_GPIO_NUM    21
#define Y4_GPIO_NUM    19
#define Y3_GPIO_NUM    18
#define Y2_GPIO_NUM     5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM  23
#define PCLK_GPIO_NUM  22

// Motor pins (L298N)
#define MOTOR_A1 12
#define MOTOR_A2 13
#define MOTOR_B1 14
#define MOTOR_B2 15

// Simulated BMS pin (ADC)
#define BATTERY_PIN 34

// ============================================================
// GLOBALS
// ============================================================
TinyGPSPlus gps;
WiFiServer streamServer(80);
bool running = true;

// ============================================================
// CAMERA INIT
// ============================================================
void initCamera() {
  camera_config_t config;
  config.ledc_channel  = LEDC_CHANNEL_0;
  config.ledc_timer    = LEDC_TIMER_0;
  config.pin_d0        = Y2_GPIO_NUM;
  config.pin_d1        = Y3_GPIO_NUM;
  config.pin_d2        = Y4_GPIO_NUM;
  config.pin_d3        = Y5_GPIO_NUM;
  config.pin_d4        = Y6_GPIO_NUM;
  config.pin_d5        = Y7_GPIO_NUM;
  config.pin_d6        = Y8_GPIO_NUM;
  config.pin_d7        = Y9_GPIO_NUM;
  config.pin_xclk      = XCLK_GPIO_NUM;
  config.pin_pclk      = PCLK_GPIO_NUM;
  config.pin_vsync     = VSYNC_GPIO_NUM;
  config.pin_href      = HREF_GPIO_NUM;
  config.pin_sscb_sda  = SIOD_GPIO_NUM;
  config.pin_sscb_scl  = SIOC_GPIO_NUM;
  config.pin_pwdn      = PWDN_GPIO_NUM;
  config.pin_reset     = RESET_GPIO_NUM;
  config.xclk_freq_hz  = 20000000;
  config.pixel_format  = PIXFORMAT_JPEG;
  config.frame_size    = FRAMESIZE_VGA;
  config.jpeg_quality  = 12;
  config.fb_count      = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
  } else {
    Serial.println("Camera ready");
  }
}

// ============================================================
// MOTOR CONTROL
// ============================================================
void motorInit() {
  pinMode(MOTOR_A1, OUTPUT); pinMode(MOTOR_A2, OUTPUT);
  pinMode(MOTOR_B1, OUTPUT); pinMode(MOTOR_B2, OUTPUT);
}

void motorForward() {
  digitalWrite(MOTOR_A1, HIGH); digitalWrite(MOTOR_A2, LOW);
  digitalWrite(MOTOR_B1, HIGH); digitalWrite(MOTOR_B2, LOW);
}

void motorStop() {
  digitalWrite(MOTOR_A1, LOW); digitalWrite(MOTOR_A2, LOW);
  digitalWrite(MOTOR_B1, LOW); digitalWrite(MOTOR_B2, LOW);
}

void motorBackward() {
  digitalWrite(MOTOR_A1, LOW); digitalWrite(MOTOR_A2, HIGH);
  digitalWrite(MOTOR_B1, LOW); digitalWrite(MOTOR_B2, HIGH);
}

void motorLeft() {
  digitalWrite(MOTOR_A1, LOW); digitalWrite(MOTOR_A2, HIGH);
  digitalWrite(MOTOR_B1, HIGH); digitalWrite(MOTOR_B2, LOW);
}

void motorRight() {
  digitalWrite(MOTOR_A1, HIGH); digitalWrite(MOTOR_A2, LOW);
  digitalWrite(MOTOR_B1, LOW); digitalWrite(MOTOR_B2, HIGH);
}

// Simplified "go home" — quay 180° rồi chạy thẳng 5s
void motorGoHome() {
  // Quay phải 2s
  digitalWrite(MOTOR_A1, HIGH); digitalWrite(MOTOR_A2, LOW);
  digitalWrite(MOTOR_B1, LOW);  digitalWrite(MOTOR_B2, HIGH);
  delay(2000);
  // Chạy thẳng 5s
  motorForward();
  delay(5000);
  motorStop();
}

// ============================================================
// BATTERY READ (ADC → %)
// ============================================================
float readBattery() {
  int raw = analogRead(BATTERY_PIN);
  float voltage = raw * (3.3f / 4095.0f) * 2.0f; // voltage divider x2
  float pct = (voltage - 3.0f) / (4.2f - 3.0f) * 100.0f;
  return constrain(pct, 0.0f, 100.0f);
}

// ============================================================
// SEND TELEMETRY → Supabase Edge Function
// ============================================================
void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(TELEMETRY_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  float battery = readBattery();
  float lat = gps.location.isValid() ? gps.location.lat() : 0.0f;
  float lng = gps.location.isValid() ? gps.location.lng() : 0.0f;

  float humidity    = 65.0f + random(-5, 5);
  float temperature = 28.0f + random(-2, 2);

  StaticJsonDocument<256> doc;
  doc["device_id"]   = deviceID; // Dùng Device ID thay vì User ID
  doc["battery_pct"] = battery;
  doc["humidity"]    = humidity;
  doc["temperature"] = temperature;
  doc["gps_lat"]     = lat;
  doc["gps_lng"]     = lng;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.printf("Telemetry [%s] → %d\n", deviceID.c_str(), code);
  http.end();
}

// ============================================================
// POLL COMMANDS ← Supabase Edge Function
// ============================================================
void pollCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(COMMANDS_URL) + "?device_id=" + deviceID;
  http.begin(url);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int code = http.GET();
  if (code == 200) {
    String resp = http.getString();
    StaticJsonDocument<128> doc;
    deserializeJson(doc, resp);
    const char* cmd = doc["command"] | "";
// ...

    if (strcmp(cmd, "go_home") == 0) {
      Serial.println("CMD: go_home");
      motorGoHome();
    } else if (strcmp(cmd, "stop") == 0) {
      Serial.println("CMD: stop");
      running = false;
      motorStop();
    } else if (strcmp(cmd, "start") == 0 || strcmp(cmd, "forward") == 0) {
      Serial.println("CMD: forward");
      running = true;
      motorForward();
    } else if (strcmp(cmd, "backward") == 0) {
      Serial.println("CMD: backward");
      running = true;
      motorBackward();
    } else if (strcmp(cmd, "left") == 0) {
      Serial.println("CMD: left");
      running = true;
      motorLeft();
    } else if (strcmp(cmd, "right") == 0) {
      Serial.println("CMD: right");
      running = true;
      motorRight();
    }
  }
  http.end();
}

// ============================================================
// MJPEG STREAM SERVER
// Truy cập: http://<ESP32_IP>/stream
// ============================================================
void handleStream(WiFiClient& client) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: multipart/x-mixed-replace; boundary=frame");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: keep-alive");
  client.println();

  while (client.connected()) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) { delay(10); continue; }

    client.printf("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n", fb->len);
    client.write(fb->buf, fb->len);
    client.print("\r\n");
    esp_camera_fb_return(fb);
    delay(50); // ~20 FPS
  }
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  Serial2.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  motorInit();
  initCamera();

  // WiFi connection via WiFiManager
  WiFiManager wm;
  Serial.println("Đang kiểm tra WiFi đã lưu...");
  
  // wm.resetSettings(); // Mở comment dòng này nếu bạn muốn xóa sạch WiFi cũ để cài lại từ đầu
  
  // Tự động kết nối hoặc phát AP 'Green_Urban_Robot_Setup' nếu không thấy WiFi cũ
  if(!wm.autoConnect("Green_Urban_Robot_Setup")) {
    Serial.println("Không kết nối được WiFi và đã hết thời gian chờ!");
    delay(3000);
    ESP.restart();
  }

  Serial.printf("\nWiFi OK! IP: %s\n", WiFi.localIP().toString().c_str());

  // Lấy mã định danh phần cứng (MAC Address)
  deviceID = WiFi.macAddress();
  deviceID.replace(":", ""); // VD: 240AC4010203
  
  // Khởi tạo mDNS để Web App dễ tìm thấy (truy cập qua robot-XXXX.local)
  String hostName = "robot-" + deviceID.substring(deviceID.length() - 4);
  if (MDNS.begin(hostName.c_str())) {
    Serial.printf("mDNS đã bật: http://%s.local\n", hostName.c_str());
  }

  Serial.printf("Camera stream: http://%s/stream\n", WiFi.localIP().toString().c_str());
  
  streamServer.begin();
  randomSeed(analogRead(0));
}

// ============================================================
// LOOP
// ============================================================
unsigned long lastTelemetry = 0;
unsigned long lastCommand   = 0;
const long TELEMETRY_INTERVAL = 2000;
const long COMMAND_INTERVAL   = 2000;

void loop() {
  // Feed GPS
  while (Serial2.available()) gps.encode(Serial2.read());

  // Handle MJPEG stream clients
  WiFiClient client = streamServer.available();
  if (client) {
    String req = client.readStringUntil('\r');
    if (req.indexOf("/stream") >= 0) {
      handleStream(client);
    } else {
      // Simple info page
      client.println("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n");
      client.printf("<html><body><h2>Green Urban Robot</h2>"
                    "<p><a href='/stream'>📷 Camera Stream</a></p>"
                    "<p>IP: %s</p></body></html>",
                    WiFi.localIP().toString().c_str());
    }
    client.stop();
  }

  unsigned long now = millis();

  // Send telemetry every 2s
  if (now - lastTelemetry >= TELEMETRY_INTERVAL) {
    lastTelemetry = now;
    sendTelemetry();
  }

  // Poll commands every 2s
  if (now - lastCommand >= COMMAND_INTERVAL) {
    lastCommand = now;
    pollCommands();
  }
}
