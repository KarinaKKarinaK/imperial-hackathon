# Helmet sensor firmware

ESP32 DevKit plus MPU-6050 on a 3D-printed helmet clip. Streams 100 Hz accelerometer and gyroscope over BLE to the rider's phone.

## Parts

| Part | Notes |
|---|---|
| ESP32 DevKit (WROOM-32) | Any board with BLE |
| MPU-6050 breakout (GY-521) | 16 g range is enough for drop tests; an MPU-9250 or LSM6DSO also works with a library swap |
| 3.7 V LiPo, 400 mAh, plus a TP4056 charger board | About 8 hours at 100 Hz streaming |
| Helmet clip | CAD in this folder when Hannes commits it |

## Flash

1. Arduino IDE, add the ESP32 board package (Espressif).
2. Library Manager: install Adafruit MPU6050 and Adafruit Unified Sensor.
3. Open `esp32_helmet/esp32_helmet.ino`, board ESP32 Dev Module, upload.
4. Serial monitor at 115200 shows "advertising" and any on-board impact flags.

## Protocol

Service `6d657472-6963-7300-0000-000000000001`.

- Stream characteristic, notify, 80 bytes: five frames of `uint32 t_ms, int16 ax, ay, az (milli-g), int16 gx, gy, gz (0.1 deg/s)`, little-endian.
- Impact characteristic, read and notify, one byte: 1 for ten seconds after a resultant above 6 g.

The phone converts milli-g to m/s squared and posts 6 second windows to `/api/telemetry`, exactly as it does with its own sensors. The server runs the same model on either source.

## Phone side

Web Bluetooth works in Chrome on Android. iOS Safari has no Web Bluetooth, so on iPhone the phone's own sensors are used and the helmet data is logged on the ESP32 for the drop tests. A native wrapper (Expo with react-native-ble-plx) is the production route and is out of scope for this sprint.

## Logging for drop tests

For the validation runs, flash with `LOG_SERIAL 1` (add `#define LOG_SERIAL 1` at the top and print each frame as CSV in `loop()`), connect over USB, and capture with:

```
screen -L /dev/tty.usbserial-0001 115200
```

Each drop produces one CSV. Follow `validation/DROP_TEST_PROTOCOL.md`.
