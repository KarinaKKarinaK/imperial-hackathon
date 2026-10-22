// Metrics helmet sensor. ESP32 + MPU-6050, streams 100 Hz accelerometer and
// gyroscope frames over BLE notifications. Pairs with the rider's phone.
//
// Wiring (ESP32 DevKit): MPU-6050 VCC->3V3, GND->GND, SDA->GPIO21, SCL->GPIO22.
// Libraries: Adafruit MPU6050, Adafruit Unified Sensor (Arduino Library Manager).
// Board: ESP32 Dev Module. The built-in BLE stack is used, no extra library.
//
// Frame format (little-endian, 16 bytes, one per sample):
//   uint32 t_ms | int16 ax | int16 ay | int16 az | int16 gx | int16 gy | int16 gz
// Accelerometer in 1/1000 g, gyroscope in 1/10 deg/s. The phone converts.
// Frames are batched 5 per notification (80 bytes) to stay inside the MTU.
//
// A drop is detected on-board as well (resultant above IMPACT_G) and sets a
// flag byte in a second characteristic so the phone can wake even if it
// missed frames. The phone and server still run the real model.

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "6d657472-6963-7300-0000-000000000001"
#define STREAM_UUID         "6d657472-6963-7300-0000-000000000002"
#define IMPACT_UUID         "6d657472-6963-7300-0000-000000000003"

static const float IMPACT_G = 6.0f;      // on-board flag threshold, matches the rule baseline
static const uint32_t SAMPLE_US = 10000; // 100 Hz
static const int BATCH = 5;

Adafruit_MPU6050 mpu;
BLECharacteristic *stream;
BLECharacteristic *impact;
bool connected = false;

struct __attribute__((packed)) Frame {
  uint32_t t_ms;
  int16_t ax, ay, az;
  int16_t gx, gy, gz;
};

Frame batch[BATCH];
int filled = 0;
uint32_t lastSample = 0;
uint8_t impactFlag = 0;

class ServerCb : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { connected = true; }
  void onDisconnect(BLEServer *s) override {
    connected = false;
    s->getAdvertising()->start();
  }
};

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  if (!mpu.begin()) {
    Serial.println("MPU-6050 not found");
    while (true) delay(1000);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_16_G); // crashes exceed 8 g
  mpu.setGyroRange(MPU6050_RANGE_1000_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_94_HZ);

  BLEDevice::init("Metrics Helmet");
  BLEDevice::setMTU(185); // one notify carries all five 16-byte frames; the default 23-byte MTU would cut it to one
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCb());
  BLEService *svc = server->createService(SERVICE_UUID);
  stream = svc->createCharacteristic(STREAM_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  stream->addDescriptor(new BLE2902());
  impact = svc->createCharacteristic(IMPACT_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  impact->addDescriptor(new BLE2902());
  impact->setValue(&impactFlag, 1);
  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  adv->start();
  Serial.println("advertising");
}

void loop() {
  uint32_t now = micros();
  if (now - lastSample < SAMPLE_US) return;
  // advance by the period so the rate does not drift; resync after a long stall
  lastSample = (now - lastSample > 10 * SAMPLE_US) ? now : lastSample + SAMPLE_US;

  sensors_event_t a, g, t;
  mpu.getEvent(&a, &g, &t);

  Frame &f = batch[filled++];
  f.t_ms = millis();
  f.ax = (int16_t)(a.acceleration.x / 9.81f * 1000.0f);
  f.ay = (int16_t)(a.acceleration.y / 9.81f * 1000.0f);
  f.az = (int16_t)(a.acceleration.z / 9.81f * 1000.0f);
  f.gx = (int16_t)(g.gyro.x * 57.2958f * 10.0f);
  f.gy = (int16_t)(g.gyro.y * 57.2958f * 10.0f);
  f.gz = (int16_t)(g.gyro.z * 57.2958f * 10.0f);

  float r = sqrtf(a.acceleration.x * a.acceleration.x + a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z) / 9.81f;
  static uint32_t impactAt = 0;
  if (r > IMPACT_G) {
    impactAt = millis(); // a second hit inside the window keeps the flag up for another 10 s
    if (!impactFlag) {
      impactFlag = 1;
      impact->setValue(&impactFlag, 1);
      if (connected) impact->notify();
    }
    Serial.printf("impact %.1f g\n", r);
  }

  if (filled == BATCH) {
    if (connected) {
      stream->setValue((uint8_t *)batch, sizeof(batch));
      stream->notify();
    }
    filled = 0;
  }

  // Clear the impact flag 10 s after the last hit, once the phone has had time to read it.
  if (impactFlag && millis() - impactAt > 10000) {
    impactFlag = 0;
    impact->setValue(&impactFlag, 1);
    if (connected) impact->notify();
  }
}
