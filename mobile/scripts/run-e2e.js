#!/usr/bin/env node

/**
 * E2E Test Runner Script
 * 
 * This script automates the entire E2E testing process:
 * 1. Checks if APK exists (builds if needed)
 * 2. Starts Android emulator if not running
 * 3. Installs the APK on the emulator
 * 4. Runs Maestro tests
 * 
 * Usage: npm run e2e
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const APK_DIR = path.join(__dirname, '..', 'android-build');
const APK_PATH = path.join(APK_DIR, 'app-release.apk');
const FLOWS_DIR = path.join(__dirname, '..', 'e2e', 'flows');
const PACKAGE_NAME = 'com.travelhub.app';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}${colors.bold}[Step ${step}]${colors.reset} ${message}`);
}

function runCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf-8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (options.ignoreError) {
      return error.stdout || '';
    }
    throw error;
  }
}

function getMaestroCommand() {
  // Check common Maestro installation paths on Windows
  const possiblePaths = [
    'maestro',
    'C:\\maestro\\bin\\maestro.bat',
    'C:\\maestro\\bin\\maestro',
    path.join(process.env.USERPROFILE || '', '.maestro', 'bin', 'maestro'),
  ];
  
  for (const cmd of possiblePaths) {
    try {
      runCommand(`"${cmd}" --version`, { silent: true });
      return cmd;
    } catch {
      continue;
    }
  }
  return null;
}

let MAESTRO_CMD = 'maestro';

function checkMaestroInstalled() {
  const cmd = getMaestroCommand();
  if (cmd) {
    MAESTRO_CMD = cmd;
    return true;
  }
  return false;
}

function checkAdbInstalled() {
  try {
    runCommand('adb version', { silent: true });
    return true;
  } catch {
    return false;
  }
}

function isEmulatorRunning() {
  try {
    const output = runCommand('adb devices', { silent: true });
    // Parse adb devices output - look for lines with actual devices
    // Format: "emulator-5554\tdevice" or "XXXXXXXX\tdevice"
    const lines = output.split('\n').filter(line => {
      const trimmed = line.trim();
      // Skip header and empty lines
      if (!trimmed || trimmed.startsWith('List of')) return false;
      // Check for actual device entries (ends with device, offline, or unauthorized)
      return trimmed.includes('\tdevice') || trimmed.includes('\toffline') || trimmed.includes('\tunauthorized');
    });
    return lines.length > 0;
  } catch {
    return false;
  }
}

function waitForDevice(timeout = 60000) {
  log('Waiting for device to be ready...', 'yellow');
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const output = runCommand('adb shell getprop sys.boot_completed', { silent: true, ignoreError: true });
      if (output.trim() === '1') {
        log('Device is ready!', 'green');
        return true;
      }
    } catch {
      // Device not ready yet
    }
    // Wait 2 seconds before checking again
    execSync('ping -n 3 127.0.0.1 > nul', { shell: true, stdio: 'ignore' });
  }
  
  throw new Error('Timeout waiting for device');
}

function installApk(retries = 3) {
  log('Installing APK on device...', 'yellow');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Verify device is still connected before install
      if (!isEmulatorRunning()) {
        log(`No device found (attempt ${attempt}/${retries}), waiting...`, 'yellow');
        execSync('ping -n 3 127.0.0.1 > nul', { shell: true, stdio: 'ignore' });
        continue;
      }
      
      // Uninstall existing app first (ignore errors if not installed)
      runCommand(`adb uninstall ${PACKAGE_NAME}`, { silent: true, ignoreError: true });
      // Install the new APK
      runCommand(`adb install -r "${APK_PATH}"`);
      log('APK installed successfully!', 'green');
      return;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to install APK: ${error.message}`);
      }
      log(`Install attempt ${attempt} failed, retrying...`, 'yellow');
      execSync('ping -n 3 127.0.0.1 > nul', { shell: true, stdio: 'ignore' });
    }
  }
}

function buildApk() {
  log('Building APK locally with Expo + Gradle...', 'yellow');
  log('This may take several minutes on first run...', 'yellow');
  
  const mobileDir = path.join(__dirname, '..');
  const androidDir = path.join(mobileDir, 'android');
  
  // Create build directory if it doesn't exist
  if (!fs.existsSync(APK_DIR)) {
    fs.mkdirSync(APK_DIR, { recursive: true });
  }
  
  try {
    // Step 1: Run expo prebuild to generate android folder
    log('Running expo prebuild...', 'yellow');
    runCommand('npx expo prebuild --platform android', { 
      cwd: mobileDir 
    });
    
    // Step 2: Build the APK using Gradle
    log('Building APK with Gradle...', 'yellow');
    const isWindows = process.platform === 'win32';
    const gradleCmd = isWindows ? 'gradlew.bat' : './gradlew';
    
    runCommand(`${gradleCmd} assembleDebug`, { 
      cwd: androidDir
    });
    
    // Step 3: Copy the APK to our build directory
    const builtApkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(builtApkPath)) {
      fs.copyFileSync(builtApkPath, APK_PATH);
      log('APK built successfully!', 'green');
    } else {
      throw new Error('APK not found after build. Check Gradle output for errors.');
    }
  } catch (error) {
    log(`Build failed: ${error.message}`, 'red');
    log('\nManual build steps:', 'yellow');
    log('1. cd mobile', 'yellow');
    log('2. npx expo prebuild --platform android', 'yellow');
    log('3. cd android && gradlew.bat assembleDebug', 'yellow');
    log('4. Copy android/app/build/outputs/apk/debug/app-debug.apk to android-build/', 'yellow');
    throw error;
  }
}

let metroProcess = null;

function setupAdbReverse() {
  log('Setting up ADB port forwarding...', 'yellow');
  try {
    runCommand('adb reverse tcp:8081 tcp:8081', { silent: true });
    log('ADB reverse port forwarding set up', 'green');
  } catch (error) {
    log('Warning: Could not set up ADB reverse', 'yellow');
  }
}

function startMetro() {
  log('Starting Metro bundler...', 'yellow');
  const mobileDir = path.join(__dirname, '..');
  
  // Check if Metro is already running
  try {
    const http = require('http');
    const checkMetro = new Promise((resolve) => {
      const req = http.get('http://localhost:8081/status', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => { req.destroy(); resolve(false); });
    });
    
    // Sync check - just try to start anyway
  } catch {
    // Continue to start Metro
  }
  
  metroProcess = spawn('npx', ['expo', 'start', '--localhost', '--android'], {
    cwd: mobileDir,
    shell: true,
    stdio: 'pipe',
    detached: false
  });
  
  // Wait for Metro to be ready
  log('Waiting for Metro to start...', 'yellow');
  const startTime = Date.now();
  const timeout = 60000; // 60 seconds
  
  while (Date.now() - startTime < timeout) {
    try {
      execSync('curl -s http://localhost:8081/status', { stdio: 'ignore', timeout: 2000 });
      log('Metro bundler is ready!', 'green');
      return;
    } catch {
      execSync('ping -n 2 127.0.0.1 > nul', { shell: true, stdio: 'ignore' });
    }
  }
  
  log('Metro bundler started (may still be loading)', 'yellow');
}

function stopMetro() {
  if (metroProcess) {
    log('Stopping Metro bundler...', 'yellow');
    try {
      process.kill(metroProcess.pid);
    } catch {
      // Process may have already exited
    }
    metroProcess = null;
  }
}

function runMaestroTests(flowFile = null) {
  log('Running Maestro E2E tests...', 'cyan');
  
  const testPath = flowFile ? path.join(FLOWS_DIR, flowFile) : FLOWS_DIR;
  const logsDir = path.join(__dirname, '..', 'e2e', 'logs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const debugOutput = path.join(logsDir, `run-${timestamp}`);
  const junitOutput = path.join(logsDir, `results-${timestamp}.xml`);
  
  if (!fs.existsSync(testPath)) {
    throw new Error(`Test path not found: ${testPath}`);
  }
  
  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  log(`Debug output: ${debugOutput}`, 'yellow');
  log(`JUnit report: ${junitOutput}`, 'yellow');
  
  try {
    runCommand(`"${MAESTRO_CMD}" test "${testPath}" --debug-output "${debugOutput}" --format junit --output "${junitOutput}"`);
    log('\n✅ All E2E tests passed!', 'green');
  } catch (error) {
    log('\n❌ Some E2E tests failed', 'red');
    log(`Check debug output at: ${debugOutput}`, 'yellow');
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const buildOnly = args.includes('--build-only');
  const flowFile = args.find(arg => arg.endsWith('.yaml'));
  
  console.log(`
${colors.cyan}${colors.bold}╔════════════════════════════════════════╗
║     Travel Hub E2E Test Runner         ║
╚════════════════════════════════════════╝${colors.reset}
`);

  // Step 1: Check prerequisites
  logStep(1, 'Checking prerequisites...');
  
  if (!checkAdbInstalled()) {
    log('❌ ADB is not installed. Please install Android SDK.', 'red');
    log('   Download: https://developer.android.com/studio', 'yellow');
    process.exit(1);
  }
  log('✓ ADB is installed', 'green');
  
  if (!checkMaestroInstalled()) {
    log('❌ Maestro is not installed.', 'red');
    log('   Install with: curl -Ls "https://get.maestro.mobile.dev" | bash', 'yellow');
    log('   Or on Windows: iwr -useb "https://get.maestro.mobile.dev" | iex', 'yellow');
    process.exit(1);
  }
  log('✓ Maestro is installed', 'green');

  // Step 2: Build APK if needed
  logStep(2, 'Checking APK...');
  
  if (!skipBuild && !fs.existsSync(APK_PATH)) {
    log('APK not found, building...', 'yellow');
    buildApk();
  } else if (skipBuild) {
    log('Skipping build (--skip-build flag)', 'yellow');
    if (!fs.existsSync(APK_PATH)) {
      log('❌ APK not found. Run without --skip-build first.', 'red');
      process.exit(1);
    }
  } else {
    log('✓ APK exists', 'green');
  }
  
  if (buildOnly) {
    log('\nBuild completed (--build-only flag)', 'green');
    process.exit(0);
  }

  // Step 3: Check emulator
  logStep(3, 'Checking Android device/emulator...');
  
  if (!isEmulatorRunning()) {
    log('No device found. Please start an Android emulator or connect a device.', 'yellow');
    log('Starting emulator...', 'yellow');
    
    try {
      // Try to start the first available emulator
      const avdList = runCommand('emulator -list-avds', { silent: true });
      const avds = avdList.trim().split('\n').filter(Boolean);
      
      if (avds.length === 0) {
        log('❌ No Android emulators found. Please create one in Android Studio.', 'red');
        process.exit(1);
      }
      
      // Start emulator in background
      const emulatorProcess = spawn('emulator', ['-avd', avds[0]], {
        detached: true,
        stdio: 'ignore'
      });
      emulatorProcess.unref();
      
      waitForDevice();
    } catch (error) {
      log('❌ Failed to start emulator. Please start one manually.', 'red');
      process.exit(1);
    }
  } else {
    log('✓ Device is connected', 'green');
  }

  // Step 4: Install APK
  logStep(4, 'Installing APK...');
  installApk();

  // Step 5: Run Maestro tests (release APK has JS bundle embedded, no Metro needed)
  logStep(5, 'Running E2E tests...');
  runMaestroTests(flowFile);
}

main().catch(error => {
  stopMetro();
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
