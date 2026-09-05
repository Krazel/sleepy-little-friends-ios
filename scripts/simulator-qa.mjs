import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
if (process.platform !== 'darwin')
  throw new Error('iOS simulator QA needs macOS');
fs.mkdirSync('artifacts', { recursive: true });
const run = (cmd, args, log) => {
  const fd = log ? fs.openSync('artifacts/' + log, 'w') : undefined;
  try {
    const result = spawnSync(cmd, args, {
      stdio: fd ? ['ignore', fd, fd] : 'pipe',
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      if (log)
        console.error(
          fs.readFileSync('artifacts/' + log, 'utf8').slice(-10000),
        );
      throw new Error(`${cmd} ${args[0]} failed`);
    }
    return result.stdout;
  } finally {
    if (fd) fs.closeSync(fd);
  }
};
const all = JSON.parse(
  run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']),
);
const runtime = Object.keys(all.devices)
  .filter((x) => x.includes('iOS-26'))
  .sort()
  .reverse()[0];
if (!runtime) throw new Error('iOS 26 simulator unavailable');
const devices = all.devices[runtime];
const phone =
  devices.find((x) => x.name.includes('iPhone') && !x.name.includes('Pro')) ||
  devices.find((x) => x.name.includes('iPhone'));
const ipad = devices.find((x) => x.name.includes('iPad'));
if (!phone || !ipad) throw new Error('Phone and tablet simulators required');
const derived = path.join(process.env.RUNNER_TEMP, 'SleepyDerived');
const result = path.resolve('artifacts/NativeQA.xcresult');
let failure;
try {
  run(
    'xcodebuild',
    [
      'test',
      '-project',
      'ios/App/App.xcodeproj',
      '-scheme',
      'App',
      '-configuration',
      'Debug',
      '-destination',
      `platform=iOS Simulator,id=${phone.udid}`,
      '-derivedDataPath',
      derived,
      '-resultBundlePath',
      result,
      'CODE_SIGNING_ALLOWED=NO',
      '-parallel-testing-enabled',
      'NO',
    ],
    'simulator-test.log',
  );
} catch (error) {
  failure = error;
}
if (fs.existsSync(result)) {
  spawnSync(
    'xcrun',
    [
      'xcresulttool',
      'export',
      'attachments',
      '--path',
      result,
      '--output-path',
      path.resolve('artifacts/screenshots'),
    ],
    { stdio: 'inherit' },
  );
}
if (failure) throw failure;
run('xcrun', ['simctl', 'boot', ipad.udid]);
run('xcrun', ['simctl', 'bootstatus', ipad.udid, '-b']);
const app = path.join(derived, 'Build/Products/Debug-iphonesimulator/App.app');
run('xcrun', ['simctl', 'install', ipad.udid, app]);
run('xcrun', [
  'simctl',
  'launch',
  ipad.udid,
  'com.krazel.animalitosadormir',
  '-AppleLanguages',
  '(en)',
  '-AppleLocale',
  'en_US',
]);
await new Promise((resolve) => setTimeout(resolve, 15000));
run('xcrun', [
  'simctl',
  'io',
  ipad.udid,
  'screenshot',
  path.resolve('artifacts/ipad-home-en.png'),
]);
fs.writeFileSync(
  'artifacts/native-qa.json',
  JSON.stringify(
    {
      commit: process.env.GITHUB_SHA,
      run: process.env.GITHUB_RUN_ID,
      runtime,
      phone: phone.name,
      ipad: ipad.name,
      iphoneInteractionTest: 'passed',
      ipadValidation: 'launch screenshot',
      physicalDeviceTested: false,
    },
    null,
    2,
  ),
);
console.log('Native interaction test passed; iPhone and iPad evidence saved');

