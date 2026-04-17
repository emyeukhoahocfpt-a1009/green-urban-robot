// ============================================================
// ESP32 Hardware Joystick for Green Urban Robot
// Dành cho: ESP32-S / ESP32 WROOM
// Nhiệm vụ: Đọc giá trị Joystick và gửi lệnh điều khiển lên Supabase
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>

// ============================================================
// CONFIGURATION
// ============================================================
const char* SUPABASE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYm1qdm5oZHVscHFpYXZtZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzM5MTYsImV4cCI6MjA5MTE0OTkxNn0.CIL6J1cj2NXPY6oqJKv63Un6MTw9h2hakUq7KW5OTOE";
const char* COMMAND_API    = "https://glbmjvnhdulpqiavmdai.supabase.co/rest/v1/robot_commands";

// User ID của bạn (phải trùng với tài khoản trên Web App)
const char* USER_ID = "9277272b-dc53-4124-93b5-8b68c0a0a3c1"; 

// Joystick Pins
#define JOY_X 32
#define JOY_Y 33
#define JOY_SW 34

// Thresholds (Ngưỡng để nhận diện di chuyển)
#define CENTER 2048
#define DEADZONE 500

// Globals
unsigned long lastCommandTime = 0;
const int COMMAND_COOLDOWN = 300; // Tránh gửi lệnh quá dồn dập
String lastSentCommand = "stop";

void setup() {
  Serial.begin(115200);
  pinMode(JOY_SW, INPUT_PULLUP);

  // WiFi Setup
  WiFiManager wm;
  if(!wm.autoConnect("Robot_Joystick_Setup")) {
    Serial.println("Lỗi kết nối WiFi!");
    delay(3000);
    ESP.restart();
  }
  Serial.println("Joystick dã sãn sàng!");
}

void sendCommand(String cmd) {
  if (cmd == lastSentCommand) return; // Không gửi lại lệnh trùng lặp

  HTTPClient http;
  http.begin(COMMAND_API);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  StaticJsonDocument<128> doc;
  doc["user_id"] = USER_ID;
  doc["command"] = cmd;
  doc["executed"] = false;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code > 0) {
    Serial.printf("Gửi lệnh [%s] thành công: %d\n", cmd.c_str(), code);
    lastSentCommand = cmd;
  } else {
    Serial.printf("Lỗi gửi lệnh: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

void loop() {
  int x = analogRead(JOY_X);
  int y = analogRead(JOY_Y);
  bool clicked = digitalRead(JOY_SW) == LOW;

  String currentCmd = "stop";

  if (y < CENTER - DEADZONE) currentCmd = "forward";
  else if (y > CENTER + DEADZONE) currentCmd = "backward";
  else if (x < CENTER - DEADZONE) currentCmd = "left";
  else if (x > CENTER + DEADZONE) currentCmd = "right";
  
  if (clicked) currentCmd = "go_home";

  unsigned long now = millis();
  if (now - lastCommandTime > COMMAND_COOLDOWN) {
    if (currentCmd != lastSentCommand) {
      sendCommand(currentCmd);
      lastCommandTime = now;
    }
  }

  delay(50);
}
