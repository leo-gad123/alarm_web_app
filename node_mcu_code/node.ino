#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

// ----------------------
// USER CONFIGURATION
// ----------------------
#define WIFI_SSID      "YOUR_WIFI_NAME"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"

#define FIREBASE_HOST  "dht11-9aca0-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH  "YOUR_FIREBASE_DATABASE_SECRET"

// Alarm pin
#define ALARM_PIN 5    // D1

FirebaseData fbdo;

// NTP time object
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000); // MODIFY TIMEZONE OFFSET

// Track last triggered alarm (avoid retriggering same minute)
int lastTriggeredHour = -1;
int lastTriggeredMinute = -1;

// Convert 12-hour time (AM/PM) to 24-hour
int convertTo24Hour(int hour, String period) {
  if (period == "AM") {
    if (hour == 12) return 0;
    return hour;
  } else { // PM
    if (hour != 12) return hour + 12;
    return hour;
  }
}

void setup() {
  pinMode(ALARM_PIN, OUTPUT);
  digitalWrite(ALARM_PIN, LOW);

  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(400);
  }
  Serial.println("\nWiFi connected!");

  timeClient.begin();
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
}

void loop() {
  timeClient.update();

  int currentHour = timeClient.getHours();
  int currentMinute = timeClient.getMinutes();

  // Reset daily trigger memory at midnight (00:00)
  if (currentHour == 0 && currentMinute == 0) {
    lastTriggeredHour = -1;
    lastTriggeredMinute = -1;
  }

  // Fetch all alarms from Firebase
  if (Firebase.getJSON(fbdo, "/alarms")) {
    FirebaseJson &json = fbdo.jsonObject;
    size_t count = json.iteratorBegin();

    for (size_t i = 0; i < count; i++) {
      String key, value;
      int type;

      json.iteratorGet(i, type, key, value);

      FirebaseJson alarmObj;
      json.get(alarmObj, key);

      String timeStr, period;
      bool enabled;

      alarmObj.get(timeStr, "time");
      alarmObj.get(period, "period");
      alarmObj.get(enabled, "enabled");

      if (!enabled) continue;

      // Parse the time (HH:MM)
      int setHour = timeStr.substring(0, 2).toInt();
      int setMinute = timeStr.substring(3, 5).toInt();

      // Convert AM/PM to 24-hour
      int setHour24 = convertTo24Hour(setHour, period);

      // --- Alarm Check ---
      if (currentHour == setHour24 && currentMinute == setMinute) {

        // ONLY trigger ONCE per minute
        if (!(lastTriggeredHour == currentHour && lastTriggeredMinute == currentMinute)) {

          Serial.println("🔔 Daily Alarm Triggered!");
          digitalWrite(ALARM_PIN, HIGH);

          lastTriggeredHour = currentHour;
          lastTriggeredMinute = currentMinute;

          delay(5000);                // buzzer ON time (5 sec)
          digitalWrite(ALARM_PIN, LOW); // turn off
        }
      }
    }

    json.iteratorEnd();
  }

  delay(500);
}
