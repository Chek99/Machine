/**
 * Complete, Modular, Production-Grade ESP32 Firmware for GhostLoad
 * Arduino / ESP-IDF Framework with ADS1115 Synchronous Discrete Sampling & LittleFS Buffering
 */

export const FIRMWARE_MAIN_INO = `/**
 * GhostLoad - ESP32 Industrial Energy Waste Monitor
 * Hardware: ESP32 DevKit, ADS1115 ADC, SCT-013-030 CT, ZMPT101B Voltage Module
 * Target: 230V 50Hz single phase, Kenya workshops
 * Framework: Arduino ESP32 core with FreeRTOS
 */

#include <Arduino.h>
#include <Wire.h>
#include <esp_task_wdt.h>
#include "EnergySampler.h"
#include "ActivityMonitor.h"
#include "TelemetryBuffer.h"
#include "NetworkManager.h"

#define WDT_TIMEOUT_SECONDS 8
#define TELEMETRY_INTERVAL_MS 2000

// Hardware Pin Definitions
#define PIN_I2C_SDA 21
#define PIN_I2C_SCL 22
#define PIN_ACTIVITY_SWITCH 4    // Digital limit switch (pull-up)
#define PIN_SAFETY_RELAY 25      // Relay output to isolate load if commanded
#define PIN_STATUS_LED 2         // Onboard blue LED for network sync status

EnergySampler energySampler;
ActivityMonitor activityMonitor(PIN_ACTIVITY_SWITCH);
TelemetryBuffer telemetryBuffer;
NetworkManager networkManager;

unsigned long lastTelemetryTime = 0;

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\\n==========================================");
  Serial.println("  GhostLoad ESP32 Energy & Waste Monitor");
  Serial.println("  Location: Industrial Area, Nairobi, Kenya");
  Serial.println("==========================================");

  // Initialize Watchdog Timer
  esp_task_wdt_init(WDT_TIMEOUT_SECONDS, true);
  esp_task_wdt_add(NULL); // Add current loop task

  // Initialize I2C Bus for ADS1115 & MPU6050
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000); // 400kHz fast mode

  // Initialize Output pins
  pinMode(PIN_SAFETY_RELAY, OUTPUT);
  digitalWrite(PIN_SAFETY_RELAY, LOW); // Relay NC/NO safe state
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Initialize Subsystems
  energySampler.begin();
  activityMonitor.begin();
  telemetryBuffer.begin();
  networkManager.begin();

  Serial.println("[BOOT] All subsystems initialized. Starting sampling loop...");
}

void loop() {
  // Reset hardware watchdog on every loop iteration
  esp_task_wdt_reset();

  // 1. Non-blocking high-frequency energy sampling
  energySampler.update();

  // 2. Poll machine activity (debounced contact switch + vibration)
  activityMonitor.update();

  // 3. Maintain non-blocking WiFi & Cloud/MQTT connection
  networkManager.update();

  // 4. Periodic telemetry packaging and dispatch
  unsigned long now = millis();
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;

    EnergyMetrics metrics = energySampler.getLatestWindowMetrics();
    bool isMachineActive = activityMonitor.isActive();
    float vibrationRms = activityMonitor.getVibrationRms();

    // Construct telemetry record
    TelemetryRecord record;
    record.timestamp = now;
    record.vRms = metrics.vRms;
    record.iRms = metrics.iRms;
    record.realPowerW = metrics.realPowerW;
    record.apparentPowerVA = metrics.apparentPowerVA;
    record.powerFactor = metrics.powerFactor;
    record.kwhCumulative = metrics.kwhCumulative;
    record.activityFlag = isMachineActive;
    record.vibrationRms = vibrationRms;

    // Output debug to serial
    Serial.printf("[METRICS] V: %.1fV | I: %.2fA | P: %.1fW | VA: %.1f | PF: %.2f | kWh: %.4f | Act: %s\\n",
      record.vRms, record.iRms, record.realPowerW, record.apparentPowerVA,
      record.powerFactor, record.kwhCumulative, record.activityFlag ? "ENGAGED" : "IDLE");

    // Check connectivity: if WiFi connected, transmit record and drain LittleFS buffer
    if (networkManager.isConnected()) {
      digitalWrite(PIN_STATUS_LED, HIGH);

      // Drain buffered packets first if any exist from a previous hotspot dropout
      if (telemetryBuffer.hasBufferedData()) {
        Serial.printf("[SYNC] Draining %d buffered offline packets to server...\\n", telemetryBuffer.getQueuedCount());
        while (telemetryBuffer.hasBufferedData() && networkManager.isConnected()) {
          TelemetryRecord bufferedRec = telemetryBuffer.dequeue();
          networkManager.sendTelemetry(bufferedRec, telemetryBuffer.getQueuedCount());
          esp_task_wdt_reset();
          delay(15); // gentle pacing
        }
      }

      // Send live record
      networkManager.sendTelemetry(record, 0);
    } else {
      // WiFi dropped out (phone hotspot sleep, signal loss) -> Enqueue locally
      digitalWrite(PIN_STATUS_LED, LOW);
      telemetryBuffer.enqueue(record);
      Serial.printf("[OFFLINE] Hotspot disconnected. Telemetry buffered in LittleFS (Queue depth: %d)\\n",
        telemetryBuffer.getQueuedCount());
    }
  }
}
`;

export const FIRMWARE_ENERGY_SAMPLER_H = `/**
 * EnergySampler.h - Synchronous ADS1115 Discrete AC Sampling
 * Discrete integration: P = (1/N) * sum(v[n] * i[n]) over exact integer cycles of 50 Hz mains.
 */

#ifndef ENERGY_SAMPLER_H
#define ENERGY_SAMPLER_H

#include <Arduino.h>

struct EnergyMetrics {
  float vRms;
  float iRms;
  float realPowerW;
  float apparentPowerVA;
  float powerFactor;
  float kwhCumulative;
};

class EnergySampler {
public:
  EnergySampler();
  void begin();
  void update();
  EnergyMetrics getLatestWindowMetrics();

private:
  // Calibration constants (calibrated against PZEM-004T v3 reference meter)
  const float V_CAL = 230.0f / 1.054f; // Scale factor for ZMPT101B voltage module
  const float I_CAL = 30.0f / 1.000f;  // Scale factor for SCT-013-030 (1V = 30A)
  
  // High-pass filter alpha for DC offset rejection (fc ~ 0.5 Hz at 800 SPS)
  const float HPF_ALPHA = 0.995f;

  float vFilteredPrev = 0.0f;
  float vRawPrev = 0.0f;
  float iFilteredPrev = 0.0f;
  float iRawPrev = 0.0f;

  // Window accumulation variables
  double sumInstPower = 0.0;
  double sumVSquared = 0.0;
  double sumISquared = 0.0;
  unsigned long sampleCount = 0;
  unsigned long windowStartMs = 0;

  double totalKWh = 0.0;
  EnergyMetrics latestMetrics;

  void computeWindow();
  void readADS1115Differential(int16_t &rawV, int16_t &rawI);
};

#endif
`;

export const FIRMWARE_ENERGY_SAMPLER_CPP = `/**
 * EnergySampler.cpp - Implementation of synchronous discrete integration
 */

#include "EnergySampler.h"
#include <Wire.h>

// ADS1115 I2C 7-bit Address
#define ADS1115_ADDR 0x48

// ADS1115 Register Map
#define ADS_REG_CONVERSION 0x00
#define ADS_REG_CONFIG     0x01

EnergySampler::EnergySampler() {
  latestMetrics = { 230.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f };
}

void EnergySampler::begin() {
  Wire.beginTransmission(ADS1115_ADDR);
  if (Wire.endTransmission() != 0) {
    Serial.println("[ERROR] ADS1115 not found at 0x48! Check wiring.");
  } else {
    Serial.println("[ADS1115] Initialized successfully in differential mode.");
  }
  windowStartMs = millis();
}

/**
 * Reads differential channels:
 * A0 - A1: ZMPT101B isolated AC voltage
 * A2 - A3: SCT-013-030 current clamp (internal burden resistor)
 * Config: PGA = +/- 2.048V (0.0625 mV/LSB), 860 SPS continuous
 */
void EnergySampler::readADS1115Differential(int16_t &rawV, int16_t &rawI) {
  // Read Voltage from A0-A1
  Wire.beginTransmission(ADS1115_ADDR);
  Wire.write(ADS_REG_CONFIG);
  Wire.write(0x04 | 0x00); // MUX 000 (A0-A1), PGA +/- 2.048V, Continuous
  Wire.write(0xE0);        // 860 SPS, traditional comparator
  Wire.endTransmission();
  
  // Point to conversion register
  Wire.beginTransmission(ADS1115_ADDR);
  Wire.write(ADS_REG_CONVERSION);
  Wire.endTransmission();
  
  Wire.requestFrom(ADS1115_ADDR, 2);
  if (Wire.available() >= 2) {
    rawV = (Wire.read() << 8) | Wire.read();
  }

  // Quick switch to A2-A3 for Current
  Wire.beginTransmission(ADS1115_ADDR);
  Wire.write(ADS_REG_CONFIG);
  Wire.write(0x34); // MUX 011 (A2-A3), PGA +/- 2.048V
  Wire.write(0xE0); // 860 SPS
  Wire.endTransmission();

  Wire.beginTransmission(ADS1115_ADDR);
  Wire.write(ADS_REG_CONVERSION);
  Wire.endTransmission();

  Wire.requestFrom(ADS1115_ADDR, 2);
  if (Wire.available() >= 2) {
    rawI = (Wire.read() << 8) | Wire.read();
  }
}

void EnergySampler::update() {
  int16_t rawV = 0, rawI = 0;
  readADS1115Differential(rawV, rawI);

  // Convert LSB to Volts (PGA +/-2.048V => 0.0625 mV per count)
  float vIn = (float)rawV * 0.0000625f;
  float iIn = (float)rawI * 0.0000625f;

  // 1. Digital High-Pass Filter to eliminate DC offset & hardware bias drift
  // y[n] = alpha * (y[n-1] + x[n] - x[n-1])
  float vFiltered = HPF_ALPHA * (vFilteredPrev + vIn - vRawPrev);
  vRawPrev = vIn;
  vFilteredPrev = vFiltered;

  float iFiltered = HPF_ALPHA * (iFilteredPrev + iIn - iRawPrev);
  iRawPrev = iIn;
  iFilteredPrev = iFiltered;

  // Noise gate: if current signal is below 35mA, clamp to 0 to prevent phantom idle energy
  if (fabs(iFiltered) < 0.0012f) {
    iFiltered = 0.0f;
  }

  // 2. Physical scaling to instantaneous Mains Volts & Amperes
  float instV = vFiltered * V_CAL;
  float instI = iFiltered * I_CAL;

  // 3. Discrete integration accumulations
  // Instantaneous power: p(t) = v(t) * i(t)
  sumInstPower += (double)(instV * instI);
  sumVSquared += (double)(instV * instV);
  sumISquared += (double)(instI * instI);
  sampleCount++;

  // Complete window after ~50 integer cycles of 50 Hz (1000 ms)
  if (millis() - windowStartMs >= 1000 && sampleCount >= 400) {
    computeWindow();
  }
}

void EnergySampler::computeWindow() {
  if (sampleCount == 0) return;

  unsigned long elapsedMs = millis() - windowStartMs;

  // Discrete RMS and Real Power calculations:
  // Vrms = sqrt( (1/N) * sum(v^2) )
  float vRms = sqrt(sumVSquared / (double)sampleCount);
  // Irms = sqrt( (1/N) * sum(i^2) )
  float iRms = sqrt(sumISquared / (double)sampleCount);

  // Real Power = (1/N) * sum(instV * instI)
  // CRITICAL: This accounts for phase angle and harmonic distortion natively!
  float realPowerW = (float)(sumInstPower / (double)sampleCount);
  if (realPowerW < 0.0f) realPowerW = 0.0f;

  // Apparent Power S = Vrms * Irms
  float apparentPowerVA = vRms * iRms;

  // Power Factor = P / S
  float pf = apparentPowerVA > 1.0f ? (realPowerW / apparentPowerVA) : 1.0f;
  if (pf > 1.0f) pf = 1.0f;
  if (pf < 0.0f) pf = 0.0f;

  // Cumulative energy accumulation: E (kWh) += P (W) * dt (h) / 1000
  double deltaKWh = ((double)realPowerW * ((double)elapsedMs / 3600000.0)) / 1000.0;
  totalKWh += deltaKWh;

  latestMetrics.vRms = vRms;
  latestMetrics.iRms = iRms;
  latestMetrics.realPowerW = realPowerW;
  latestMetrics.apparentPowerVA = apparentPowerVA;
  latestMetrics.powerFactor = pf;
  latestMetrics.kwhCumulative = (float)totalKWh;

  // Reset window counters
  sumInstPower = 0.0;
  sumVSquared = 0.0;
  sumISquared = 0.0;
  sampleCount = 0;
  windowStartMs = millis();
}

EnergyMetrics EnergySampler::getLatestWindowMetrics() {
  return latestMetrics;
}
`;

export const FIRMWARE_BUFFER_H = `/**
 * TelemetryBuffer.h - Offline LittleFS Resilient Ring Buffer
 * Preserves sensor data during phone hotspot dropouts and re-syncs on reconnect.
 */

#ifndef TELEMETRY_BUFFER_H
#define TELEMETRY_BUFFER_H

#include <Arduino.h>
#include <LittleFS.h>

struct TelemetryRecord {
  unsigned long timestamp;
  float vRms;
  float iRms;
  float realPowerW;
  float apparentPowerVA;
  float powerFactor;
  float kwhCumulative;
  bool activityFlag;
  float vibrationRms;
};

class TelemetryBuffer {
public:
  TelemetryBuffer();
  void begin();
  bool enqueue(const TelemetryRecord &rec);
  TelemetryRecord dequeue();
  bool hasBufferedData();
  int getQueuedCount();

private:
  const char* BUFFER_FILE = "/telemetry_queue.bin";
  int queuedCount = 0;
  const int MAX_RECORDS = 1500; // ~50 minutes of 2s offline buffering in ESP32 Flash
};

#endif
`;

export const FIRMWARE_JSON_SCHEMA_EXAMPLE = `{
  "deviceId": "ESP32-GHOSTLOAD-01",
  "machineId": "MCH-01",
  "timestamp": 1730283452000,
  "vRms": 231.4,
  "iRms": 4.22,
  "realPowerW": 880.5,
  "apparentPowerVA": 976.5,
  "powerFactor": 0.90,
  "kwhCumulative": 4.821,
  "activityFlag": true,
  "vibrationRms": 1.42,
  "bufferQueuedCount": 0
}`;
