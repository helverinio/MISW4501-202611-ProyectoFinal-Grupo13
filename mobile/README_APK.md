# Generating APK for Android Testing

This guide explains how to build an APK file that you can share and install on Android devices.

---

## Option 1: EAS Build (Recommended)

EAS Build runs in Expo's cloud, avoiding local environment issues like Windows path length limits.

### Prerequisites

- **Node.js** (v20 or higher recommended)
- **Expo account** (free at https://expo.dev)

### Build Steps

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS (first time only)
eas build:configure

# 4. Build APK
eas build --platform android --profile preview
```

After the build completes (~10-15 min), you'll receive a **download link** for the APK from the Expo dashboard.

---

## Option 2: Local Build

### Prerequisites

- **Node.js** (v18 or higher)
- **Java JDK 17+**
- **Android SDK** (or Android Studio installed)
- `ANDROID_HOME` environment variable set to your Android SDK path

> ⚠️ **Windows Users:** If you encounter path length errors, use Option 1 (EAS Build) or move the project to a shorter path like `D:\app`.

### Build Steps

#### 1. Install dependencies

```bash
cd mobile
npm install
```

#### 2. Generate native Android project

```bash
npx expo prebuild --platform android --clean
```

#### 3. Build the APK

**Windows (PowerShell):**
```powershell
cd android
.\gradlew assembleRelease
```

**macOS/Linux:**
```bash
cd android
./gradlew assembleRelease
```

#### 4. Locate the APK

Once the build completes, the APK will be located at:

```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Installing on Android Device

1. Transfer the `app-release.apk` file to the target device (via WhatsApp, email, USB, or cloud storage)
2. On the Android device, open the APK file
3. If prompted, enable **"Install from unknown sources"** in device settings
4. Complete the installation

## Troubleshooting

### Build fails with Java errors
Ensure you have JDK 17+ installed and `JAVA_HOME` is set correctly.

### Gradle wrapper not found
Run the prebuild step again: `npx expo prebuild --platform android --clean`

### APK crashes on launch
- Ensure all environment variables in `.env.local` are correctly configured
- Check that the API URL is accessible from the device
