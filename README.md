⏰ ESP8266 Firebase Alarm Clock

A smart ESP8266 Wi-Fi Alarm System that synchronizes with Firebase Realtime Database, supports daily + weekly scheduling (Mon–Sun), and triggers a buzzer/relay at the set time.

Built for:

Web or Mobile alarm apps

Home automation

IoT clock systems

ESP8266/NodeMCU projects

🚀 Features
✔ Fetches alarms from Firebase Realtime Database

Each alarm includes:

Time (HH:MM)

Period (AM/PM)

Enabled state (true/false)

Weekly schedule (["Mon", "Tue", ...])

✔ Supports Weekly Scheduling

Alarms can be set for:

Monday–Friday

Weekends only

Any combination of weekdays

All 7 days (daily repeat)

✔ Daily Auto-Repeat

Alarms automatically repeat every day according to user-selected days.

✔ No Duplicate Triggering

Alarms trigger only once per minute — avoids repeated buzzing.

✔ NTP Time Synchronization

Reads exact current time from the internet → no RTC module needed.

✔ Works with Relays or Buzzers

Output pin goes HIGH for configurable duration.

📁 Firebase Structure

Set your alarms under:

/alarms


Each alarm object:

{
  "time": "08:00",
  "period": "AM",
  "enabled": true,
  "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]   // weekdays example
}


Examples:

Weekdays
days: ["Mon", "Tue", "Wed", "Thu", "Fri"]

Weekends
days: ["Sat", "Sun"]

Daily Alarm
days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

🧰 Requirements

Install via Arduino Library Manager:

Firebase ESP8266 Client

ESP8266WiFi

NTPClient

WiFiUdp

Hardware:

NodeMCU / ESP8266

Relay, buzzer, or output device

WiFi connection

🔧 Wiring
ESP8266 Pin	Purpose
D1 (GPIO5)	Alarm Output
3V3 / GND	Buzzer/Relay

Modify in code if desired:

#define ALARM_PIN 5   // D1

📜 Code (Main Sketch)

This is the weekly schedule alarm version.

👉 Full code is stored in alarm_weekly.ino

The code:

Connects to WiFi

Syncs time with NTP

Reads alarms from Firebase

Converts AM/PM → 24h

Checks if today is included in days[]

Triggers alarm for 5 seconds

⚙ Configuration

Inside the code, edit these lines:

#define WIFI_SSID      "YOUR_WIFI"
#define WIFI_PASSWORD  "YOUR_PASSWORD"

#define FIREBASE_HOST  "YOUR-PROJECT-ID.firebaseio.com"
#define FIREBASE_AUTH  "YOUR_DATABASE_SECRET"


Time zone (offset in seconds):

NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000);
// 19800 = GMT+5:30

🔁 How Weekly Scheduling Works

ESP8266 reads days array from Firebase.

It checks if today matches any day in that list.

If time matches (HH:MM), and today matches, the alarm triggers.

Alarm only rings once per minute.

At midnight, the trigger-reset occurs so next day works normally.

🧪 Example Output (Serial Monitor)
WiFi connected!
Time synced: 08:00:00
Today: Tue
Checking alarms...
Alarm match: 08:00 AM (Tue)
🔔 Weekly Alarm Triggered!

📦 Future Enhancements (Optional)

If you want to expand the project:

Snooze button support

App-side trigger acknowledgment

ESP offline mode with internal RTC backup

Quiet Mode (no alarms at night)

Push notifications

Support for multiple output devices

📝 License

This project is open-source.
Feel free to modify and integrate into your own IoT alarm system.

💬 Need more?

If you want:

A frontend UI

Firebase security rules

ESP8266 OTA update version

Version using Firestore instead of Realtime DB
