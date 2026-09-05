import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import xcode from 'xcode';
import plist from 'plist';
const cfg = JSON.parse(fs.readFileSync('store/testflight.json'));
if (
  process.platform !== 'darwin' ||
  process.env.ANIMALITOS_DISTRIBUTION !== 'testflight'
)
  throw new Error(
    'TestFlight requires the explicit macOS distribution environment',
  );
const temp = process.env.RUNNER_TEMP;
if (!temp) throw new Error('RUNNER_TEMP is required');
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0)
    throw new Error(`${command} failed with ${result.status}`);
  return result;
};
const keychain = path.join(temp, 'animalitos-signing.keychain-db');
const certificate = path.join(temp, 'animalitos-distribution.p12');
const profile = path.join(temp, 'animalitos.mobileprovision');
const profilePlist = path.join(temp, 'animalitos-profile.plist');
const password = crypto.randomBytes(24).toString('hex');
const decode = (key, target) => {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
  fs.writeFileSync(target, Buffer.from(process.env[key], 'base64'), {
    mode: 0o600,
  });
};
decode('IOS_DISTRIBUTION_P12_BASE64', certificate);
decode('IOS_APP_STORE_PROFILE_BASE64', profile);
const keyDir = path.join(process.env.HOME, '.appstoreconnect', 'private_keys');
fs.mkdirSync(keyDir, { recursive: true });
const apiKeyPath = path.join(keyDir, `AuthKey_${process.env.ASC_KEY_ID}.p8`);
decode('ASC_PRIVATE_KEY_BASE64', apiKeyPath);
try {
  run('security', ['cms', '-D', '-i', profile, '-o', profilePlist]);
  const provision = plist.parse(fs.readFileSync(profilePlist, 'utf8'));
  if (
    provision.Entitlements['application-identifier'] !==
      `${cfg.teamId}.${cfg.bundleId}` ||
    provision.Entitlements['get-task-allow'] !== false ||
    provision.Entitlements['beta-reports-active'] !== true
  )
    throw new Error(
      'Profile does not match SleepyLittleFriends App Store distribution',
    );
  if (Date.parse(provision.ExpirationDate) <= Date.now())
    throw new Error('Expired profile');
  const profiles = path.join(
    process.env.HOME,
    'Library',
    'MobileDevice',
    'Provisioning Profiles',
  );
  fs.mkdirSync(profiles, { recursive: true });
  fs.copyFileSync(
    profile,
    path.join(profiles, `${provision.UUID}.mobileprovision`),
  );
  run('security', ['create-keychain', '-p', password, keychain]);
  run('security', ['set-keychain-settings', '-lut', '21600', keychain]);
  run('security', ['unlock-keychain', '-p', password, keychain]);
  run('security', [
    'import',
    certificate,
    '-k',
    keychain,
    '-P',
    process.env.IOS_DISTRIBUTION_P12_PASSWORD,
    '-T',
    '/usr/bin/codesign',
    '-T',
    '/usr/bin/security',
  ]);
  run('security', ['list-keychains', '-d', 'user', '-s', keychain]);
  run('security', [
    'set-key-partition-list',
    '-S',
    'apple-tool:,apple:,codesign:',
    '-s',
    '-k',
    password,
    keychain,
  ]);
  const project = xcode.project('ios/App/App.xcodeproj/project.pbxproj');
  project.parseSync();
  for (const entry of Object.values(project.pbxXCBuildConfigurationSection())) {
    if (entry.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER !== cfg.bundleId)
      continue;
    Object.assign(entry.buildSettings, {
      CODE_SIGN_STYLE: 'Manual',
      DEVELOPMENT_TEAM: cfg.teamId,
      CODE_SIGN_IDENTITY: '"Apple Distribution"',
      PROVISIONING_PROFILE_SPECIFIER: JSON.stringify(provision.Name),
    });
  }
  fs.writeFileSync(
    'ios/App/App.xcodeproj/project.pbxproj',
    project.writeSync(),
  );
  const archive = path.join(temp, 'SleepyLittleFriends.xcarchive');
  run('xcodebuild', [
    'archive',
    '-project',
    'ios/App/App.xcodeproj',
    '-scheme',
    'App',
    '-configuration',
    'Release',
    '-destination',
    'generic/platform=iOS',
    '-archivePath',
    archive,
    'ARCHS=arm64',
    'ONLY_ACTIVE_ARCH=NO',
  ]);
  const app = path.join(archive, 'Products', 'Applications', 'App.app');
  const archivedInfoPath = path.join(temp, 'archived-info.plist');
  run('plutil', [
    '-convert',
    'xml1',
    '-o',
    archivedInfoPath,
    path.join(app, 'Info.plist'),
  ]);
  const archivedInfo = plist.parse(fs.readFileSync(archivedInfoPath, 'utf8'));
  if (
    archivedInfo.CFBundleIdentifier !== cfg.bundleId ||
    archivedInfo.CFBundleShortVersionString !== cfg.marketingVersion ||
    String(archivedInfo.CFBundleVersion) !== String(cfg.buildNumber)
  )
    throw new Error(
      'Archived app identity/version does not match the TestFlight release',
    );
  const voices =
    fs
      .readdirSync(path.join(app, 'public/voice/elevenlabs/es'))
      .filter((x) => x.endsWith('.mp3')).length +
    fs
      .readdirSync(path.join(app, 'public/voice/elevenlabs/en'))
      .filter((x) => x.endsWith('.mp3')).length;
  if (voices !== 68) throw new Error('Archived app must contain all 68 voices');
  run('codesign', ['--verify', '--deep', '--strict', app]);
  const options = path.join(temp, 'ExportOptions.plist');
  fs.writeFileSync(
    options,
    plist.build({
      method: 'app-store-connect',
      destination: 'export',
      teamID: cfg.teamId,
      signingStyle: 'manual',
      signingCertificate: 'Apple Distribution',
      provisioningProfiles: { [cfg.bundleId]: provision.Name },
      manageAppVersionAndBuildNumber: false,
      uploadSymbols: true,
      stripSwiftSymbols: true,
    }),
  );
  const output = path.join(temp, 'animalitos-export');
  run('xcodebuild', [
    '-exportArchive',
    '-archivePath',
    archive,
    '-exportOptionsPlist',
    options,
    '-exportPath',
    output,
  ]);
  const ipa = path.join(
    output,
    fs.readdirSync(output).find((name) => name.endsWith('.ipa')),
  );
  fs.mkdirSync('artifacts', { recursive: true });
  const artifact = `artifacts/SleepyLittleFriends-${cfg.marketingVersion}-build${cfg.buildNumber}-TestFlight.ipa`;
  fs.copyFileSync(ipa, artifact);
  const manifest = {
    app: 'SleepyLittleFriends',
    purpose: 'TestFlight',
    version: cfg.marketingVersion,
    build: cfg.buildNumber,
    bundleId: cfg.bundleId,
    appId: cfg.appId,
    commit: process.env.GITHUB_SHA,
    run: process.env.GITHUB_RUN_ID,
    sha256: crypto
      .createHash('sha256')
      .update(fs.readFileSync(artifact))
      .digest('hex'),
    bytes: fs.statSync(artifact).size,
    profileId: provision.UUID,
    signatureVerified: true,
  };
  fs.writeFileSync(
    'artifacts/testflight-build.json',
    JSON.stringify(manifest, null, 2) + '\n',
  );
  run('xcrun', [
    'altool',
    '--validate-app',
    '--type',
    'ios',
    '--file',
    artifact,
    '--apiKey',
    process.env.ASC_KEY_ID,
    '--apiIssuer',
    process.env.ASC_ISSUER_ID,
  ]);
  run('xcrun', [
    'altool',
    '--upload-app',
    '--type',
    'ios',
    '--file',
    artifact,
    '--apiKey',
    process.env.ASC_KEY_ID,
    '--apiIssuer',
    process.env.ASC_ISSUER_ID,
  ]);
  manifest.uploadAccepted = true;
  fs.writeFileSync(
    'artifacts/testflight-build.json',
    JSON.stringify(manifest, null, 2) + '\n',
  );
} finally {
  spawnSync('security', ['delete-keychain', keychain], { stdio: 'ignore' });
  for (const file of [certificate, profile, profilePlist, apiKeyPath])
    fs.rmSync(file, { force: true });
}
