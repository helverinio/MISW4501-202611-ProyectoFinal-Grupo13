# E2E Testing with Maestro

This project uses **Maestro** for E2E testing with a locally built APK.

## Prerequisites

### 1. Install Maestro
```bash
# Windows (PowerShell as Admin)
iwr -useb "https://get.maestro.mobile.dev" | iex

# macOS/Linux
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### 2. Android SDK & Emulator
- Install [Android Studio](https://developer.android.com/studio)
- Create an Android Virtual Device (AVD) through AVD Manager
- Ensure `adb` is in your PATH

### 3. Verify Installation
```bash
maestro --version
adb version
```

## Running E2E Tests

### Single Command (Recommended)
```bash
# Full E2E test run (builds APK if needed, installs, and runs all tests)
npm run e2e

# Build APK only
npm run e2e:build

# Run tests without rebuilding (faster for subsequent runs)
npm run e2e:skip-build

# Run specific test flow
npm run e2e:login
npm run e2e:register
```

### Manual Steps (Alternative)
```bash
# 1. Build the APK
npm run prebuild:android
cd android && ./gradlew assembleDebug

# 2. Start emulator
emulator -avd <your-avd-name>

# 3. Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 4. Run Maestro tests
maestro test e2e/flows/
```

## Test Flows

| Flow | Description |
|------|-------------|
| `login.yaml` | Tests login form validation and submission |
| `register.yaml` | Tests registration form validation |
| `tab-navigation.yaml` | Tests switching between login/register tabs |

## Writing New Tests

Create new `.yaml` files in `e2e/flows/`:

```yaml
appId: com.travelhub.app
---
- launchApp:
    clearState: true

- tapOn:
    id: "your-test-id"

- inputText: "some text"

- assertVisible:
    id: "expected-element"
```

### Available Test IDs

**Login Screen:**
- `login-screen` - Main container
- `login-tab` / `register-tab` - Tab buttons
- `login-email-input` - Email field
- `login-password-input` - Password field
- `login-submit-button` - Login button
- `login-error-text` - Error message

**Register Screen:**
- `register-name-input` - Name field
- `register-email-input` - Email field
- `register-password-input` - Password field
- `register-confirm-password-input` - Confirm password field
- `register-submit-button` - Register button
- `register-error-text` - Error message
- `register-success-text` - Success message

## Troubleshooting

### "No device found"
Start an Android emulator via Android Studio or:
```bash
emulator -list-avds  # List available emulators
emulator -avd <name>  # Start specific emulator
```

### "Maestro not found"
Ensure Maestro is in your PATH. On Windows, restart terminal after installation.

### "APK not found"
Run `npm run e2e:build` first to build the APK.

### Tests timeout
Increase timeout in test files:
```yaml
- extendedWaitUntil:
    visible:
      id: "element-id"
    timeout: 15000
```
