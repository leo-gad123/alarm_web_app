import React, { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Trash2, Bell, BellOff, X, Volume2 } from "lucide-react";

export default function AlarmClockPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState([]);
  const [newAlarmHour, setNewAlarmHour] = useState("12");
  const [newAlarmMinute, setNewAlarmMinute] = useState("00");
  const [newAlarmPeriod, setNewAlarmPeriod] = useState("AM");
  const [firebaseStatus, setFirebaseStatus] = useState("connecting");
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const FIREBASE_URL =
    "https://dht11-9aca0-default-rtdb.firebaseio.com/alarms.json";

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load alarms from Firebase
  const loadAlarms = useCallback(async () => {
    try {
      const response = await fetch(FIREBASE_URL);
      if (!response.ok) {
        throw new Error("Failed to connect to Firebase");
      }
      const data = await response.json();
      if (data) {
        const alarmsArray = Object.entries(data).map(([id, alarm]) => ({
          id,
          ...alarm,
        }));
        setAlarms(alarmsArray);
        setFirebaseStatus("connected");
      } else {
        setAlarms([]);
        setFirebaseStatus("connected");
      }
      setError(null);
    } catch (err) {
      console.error("Firebase error:", err);
      setFirebaseStatus("error");
      setError("Failed to connect to Firebase. Please check your connection.");
    }
  }, []);

  useEffect(() => {
    loadAlarms();
    const interval = setInterval(loadAlarms, 5000); // Sync every 5 seconds
    return () => clearInterval(interval);
  }, [loadAlarms]);

  // Check if any alarm should ring
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();

      alarms.forEach((alarm) => {
        if (!alarm.enabled) return;

        const [alarmHour, alarmMinute] = alarm.time.split(":").map(Number);
        const alarm24Hour =
          alarm.period === "PM" && alarmHour !== 12
            ? alarmHour + 12
            : alarm.period === "AM" && alarmHour === 12
              ? 0
              : alarmHour;

        if (
          currentHour === alarm24Hour &&
          currentMinute === alarmMinute &&
          currentSecond === 0
        ) {
          setRingingAlarm(alarm);
        }
      });
    };

    checkAlarms();
  }, [currentTime, alarms]);

  // Add new alarm to Firebase
  const addAlarm = async () => {
    if (firebaseStatus !== "connected") {
      setError("Cannot add alarm. Firebase is not connected.");
      return;
    }

    const alarm = {
      time: `${newAlarmHour}:${newAlarmMinute}`,
      period: newAlarmPeriod,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(FIREBASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alarm),
      });

      if (!response.ok) {
        throw new Error("Failed to save alarm");
      }

      setSuccess("Alarm added successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setShowAlarmModal(false);
      loadAlarms();
    } catch (err) {
      console.error("Error adding alarm:", err);
      setError("Failed to add alarm. Please try again.");
    }
  };

  // Toggle alarm on/off
  const toggleAlarm = async (alarm) => {
    try {
      const response = await fetch(
        `https://dht11-9aca0-default-rtdb.firebaseio.com/alarms/${alarm.id}.json`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !alarm.enabled }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update alarm");
      }

      loadAlarms();
    } catch (err) {
      console.error("Error toggling alarm:", err);
      setError("Failed to update alarm. Please try again.");
    }
  };

  // Delete alarm from Firebase
  const deleteAlarm = async (alarmId) => {
    try {
      const response = await fetch(
        `https://dht11-9aca0-default-rtdb.firebaseio.com/alarms/${alarmId}.json`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete alarm");
      }

      setSuccess("Alarm deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
      loadAlarms();
    } catch (err) {
      console.error("Error deleting alarm:", err);
      setError("Failed to delete alarm. Please try again.");
    }
  };

  const dismissAlarm = () => {
    setRingingAlarm(null);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#121212] font-['Nanum_Gothic']">
      {/* Header */}
      <header className="bg-white dark:bg-[#1E1E1E] border-b border-[#EDF0F4] dark:border-[#333333] px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#4F8BFF] dark:bg-[#5B94FF] rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-white" />
            </div>
            <h1 className="text-[#07111F] dark:text-[#E5E5E5] font-['Lato'] font-extrabold text-2xl">
              Alarm Clock
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                firebaseStatus === "connected"
                  ? "bg-[#EAF9F0] dark:bg-[#0A2A1A] border-[#50C878] dark:border-[#22C55E]"
                  : firebaseStatus === "error"
                    ? "bg-[#FFEDED] dark:bg-[#2A0A0A] border-[#E12929] dark:border-[#DC2626]"
                    : "bg-[#FFF9E6] dark:bg-[#2A2410] border-[#FFB800] dark:border-[#FFA500]"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  firebaseStatus === "connected"
                    ? "bg-[#0E9250] dark:bg-[#4ADE80]"
                    : firebaseStatus === "error"
                      ? "bg-[#E12929] dark:bg-[#FF6B6B]"
                      : "bg-[#FFB800] dark:bg-[#FFA500]"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  firebaseStatus === "connected"
                    ? "text-[#0E9250] dark:text-[#4ADE80]"
                    : firebaseStatus === "error"
                      ? "text-[#C71414] dark:text-[#FF6B6B]"
                      : "text-[#CC9500] dark:text-[#FFA500]"
                }`}
              >
                {firebaseStatus === "connected"
                  ? "Connected"
                  : firebaseStatus === "error"
                    ? "Disconnected"
                    : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[#FFEDED] dark:bg-[#2A0A0A] border border-[#E12929] dark:border-[#DC2626] rounded-lg">
            <p className="text-[#C71414] dark:text-[#FF6B6B] text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-[#EAF9F0] dark:bg-[#0A2A1A] border border-[#50C878] dark:border-[#22C55E] rounded-lg">
            <p className="text-[#0E9250] dark:text-[#4ADE80] text-sm">
              {success}
            </p>
          </div>
        )}

        {/* Current Time Display */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EDF0F4] dark:border-[#333333] p-8 md:p-12 mb-6 text-center">
          <p className="text-[#8A94A7] dark:text-[#A0A0A0] text-sm mb-2">
            {formatDate(currentTime)}
          </p>
          <h2 className="text-[#07111F] dark:text-[#E5E5E5] font-['Lato'] font-bold text-5xl md:text-7xl mb-2">
            {formatTime(currentTime)}
          </h2>
        </div>

        {/* Add Alarm Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAlarmModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#4F8BFF] dark:bg-[#5B94FF] text-white rounded-lg hover:bg-[#3D6FE5] dark:hover:bg-[#4F8BFF] active:bg-[#2A5CC7] dark:active:bg-[#3D6FE5] transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Set New Alarm</span>
          </button>
        </div>

        {/* Alarms List */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EDF0F4] dark:border-[#333333] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDF0F4] dark:border-[#333333]">
            <h3 className="text-[#07111F] dark:text-[#E5E5E5] font-['Lato'] font-bold text-lg">
              Active Alarms ({alarms.length})
            </h3>
          </div>

          {alarms.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell
                size={48}
                className="mx-auto mb-4 text-[#8A94A7] dark:text-[#808080]"
              />
              <p className="text-[#8A94A7] dark:text-[#A0A0A0] text-sm">
                No alarms set. Click "Set New Alarm" to add one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EDF0F4] dark:divide-[#333333]">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#F7F9FC] dark:hover:bg-[#262626] transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleAlarm(alarm)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        alarm.enabled
                          ? "bg-[#4F8BFF] dark:bg-[#5B94FF] hover:bg-[#3D6FE5] dark:hover:bg-[#4F8BFF]"
                          : "bg-[#F5F7FB] dark:bg-[#2A2A2A] hover:bg-[#E8F0FF] dark:hover:bg-[#333333]"
                      }`}
                    >
                      {alarm.enabled ? (
                        <Bell size={20} className="text-white" />
                      ) : (
                        <BellOff
                          size={20}
                          className="text-[#8A94A7] dark:text-[#808080]"
                        />
                      )}
                    </button>
                    <div>
                      <p className="text-[#07111F] dark:text-[#E5E5E5] font-['Lato'] font-bold text-2xl">
                        {alarm.time} {alarm.period}
                      </p>
                      <p className="text-[#8A94A7] dark:text-[#A0A0A0] text-xs">
                        {alarm.enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAlarm(alarm.id)}
                    className="p-2 rounded-lg bg-[#FFEDED] dark:bg-[#2A0A0A] hover:bg-[#FFE0E0] dark:hover:bg-[#331111] active:bg-[#FFD4D4] dark:active:bg-[#441111] transition-colors"
                  >
                    <Trash2
                      size={18}
                      className="text-[#E12929] dark:text-[#FF6B6B]"
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Alarm Modal */}
      {showAlarmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EDF0F4] dark:border-[#333333] w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#EDF0F4] dark:border-[#333333] flex items-center justify-between">
              <h3 className="text-[#07111F] dark:text-[#E5E5E5] font-['Lato'] font-bold text-lg">
                Set New Alarm
              </h3>
              <button
                onClick={() => setShowAlarmModal(false)}
                className="p-1 rounded hover:bg-[#F5F7FB] dark:hover:bg-[#333333] active:bg-[#E8F0FF] dark:active:bg-[#404040] transition-colors"
              >
                <X size={20} className="text-[#536081] dark:text-[#A0A0A0]" />
              </button>
            </div>

            <div className="px-6 py-6">
              <label className="block text-[#536081] dark:text-[#B0B0B0] text-sm font-medium mb-3">
                Select Time
              </label>
              <div className="flex space-x-3 mb-6">
                <select
                  value={newAlarmHour}
                  onChange={(e) => setNewAlarmHour(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-[#2A2A2A] border border-[#E1E6ED] dark:border-[#404040] rounded-lg text-[#07111F] dark:text-[#E5E5E5] text-lg font-['Lato'] font-bold focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] dark:focus:ring-[#5B94FF] focus:border-[#4F8BFF] dark:focus:border-[#5B94FF]"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <option key={hour} value={hour.toString().padStart(2, "0")}>
                      {hour.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <select
                  value={newAlarmMinute}
                  onChange={(e) => setNewAlarmMinute(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-[#2A2A2A] border border-[#E1E6ED] dark:border-[#404040] rounded-lg text-[#07111F] dark:text-[#E5E5E5] text-lg font-['Lato'] font-bold focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] dark:focus:ring-[#5B94FF] focus:border-[#4F8BFF] dark:focus:border-[#5B94FF]"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <option
                      key={minute}
                      value={minute.toString().padStart(2, "0")}
                    >
                      {minute.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <select
                  value={newAlarmPeriod}
                  onChange={(e) => setNewAlarmPeriod(e.target.value)}
                  className="px-4 py-3 bg-white dark:bg-[#2A2A2A] border border-[#E1E6ED] dark:border-[#404040] rounded-lg text-[#07111F] dark:text-[#E5E5E5] text-lg font-['Lato'] font-bold focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] dark:focus:ring-[#5B94FF] focus:border-[#4F8BFF] dark:focus:border-[#5B94FF]"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAlarmModal(false)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-[#2A2A2A] border border-[#E1E6ED] dark:border-[#404040] rounded-lg text-[#536081] dark:text-[#B0B0B0] hover:bg-[#F5F7FB] dark:hover:bg-[#333333] active:bg-[#E8F0FF] dark:active:bg-[#404040] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addAlarm}
                  className="flex-1 px-4 py-3 bg-[#4F8BFF] dark:bg-[#5B94FF] text-white rounded-lg hover:bg-[#3D6FE5] dark:hover:bg-[#4F8BFF] active:bg-[#2A5CC7] dark:active:bg-[#3D6FE5] transition-colors font-medium"
                >
                  Save Alarm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ringing Alarm Modal */}
      {ringingAlarm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 dark:bg-black dark:bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border-4 border-[#4F8BFF] dark:border-[#5B94FF] w-full max-w-md animate-pulse">
            <div className="px-6 py-8 text-center">
              <div className="w-20 h-20 bg-[#4F8BFF] dark:bg-[#5B94FF] rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 size={40} className="text-white" />
              </div>
              <h2 className="text-[#07111F] dark:text-[#E5E5E5] font-['Lato'] font-bold text-3xl mb-2">
                Alarm Ringing!
              </h2>
              <p className="text-[#07111F] dark:text-[#E5E5E5] font-['Lato'] font-bold text-5xl mb-6">
                {ringingAlarm.time} {ringingAlarm.period}
              </p>
              <button
                onClick={dismissAlarm}
                className="w-full px-6 py-4 bg-[#4F8BFF] dark:bg-[#5B94FF] text-white rounded-lg hover:bg-[#3D6FE5] dark:hover:bg-[#4F8BFF] active:bg-[#2A5CC7] dark:active:bg-[#3D6FE5] transition-colors font-medium text-lg"
              >
                Dismiss Alarm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
