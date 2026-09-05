"""Generate fixed game narration with the existing ElevenLabs configuration.
The credential is read in memory and never copied into the game or its output.
"""
from __future__ import annotations
import argparse, concurrent.futures, hashlib, json, os, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://api.elevenlabs.io/v1'
VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'
VOICE_NAME = 'Sarah - Mature, Reassuring, Confident'
MODEL = 'eleven_multilingual_v2'
SETTINGS = {'stability': .58, 'similarity_boost': .75, 'style': .20, 'use_speaker_boost': True, 'speed': .90}
FORMAT = 'mp3_44100_128'

def get_key():
    if os.environ.get('ELEVENLABS_API_KEY'):
        return os.environ['ELEVENLABS_API_KEY']
    source = Path(os.environ.get('ELEVENLABS_ENV_FILE', str(ROOT.parents[1] / 'CreadorVideosAI' / 'api' / '.env.local')))
    for raw in source.read_text(encoding='utf-8-sig').splitlines():
        if '=' not in raw or raw.lstrip().startswith('#'):
            continue
        name, value = raw.split('=', 1)
        if name.strip() == 'ELEVENLABS_API_KEY':
            return value.strip().strip('\"\'')
    raise RuntimeError('ELEVENLABS_API_KEY is not configured')

def request(path, key, payload=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(payload).encode('utf-8') if payload else None,
        headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' if payload else 'application/json'},
        method='POST' if payload else 'GET')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                return response.read(), dict(response.headers)
        except urllib.error.HTTPError as error:
            if error.code == 429 and attempt < 2:
                time.sleep(3 * (attempt + 1))
                continue
            # Do not echo request headers, credentials, or arbitrary response text.
            try:
                detail = json.loads(error.read()).get('detail', {})
                status = detail.get('status', 'request_failed') if isinstance(detail, dict) else 'request_failed'
            except (ValueError, AttributeError):
                status = 'request_failed'
            raise RuntimeError(f'ElevenLabs HTTP {error.code}: {status}') from None
    raise RuntimeError('ElevenLabs rate limit')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', action='store_true', help='Generate the missing clips; default is a read-only quota check')
    parser.add_argument('--output', type=Path, default=ROOT / 'work' / 'elevenlabs-voice')
    args = parser.parse_args()
    key = get_key()
    lines = json.loads((ROOT / 'docs' / 'voice-script.json').read_text(encoding='utf-8-sig'))
    settings_id = hashlib.sha256(json.dumps({'voice': VOICE_ID, 'model': MODEL, 'settings': SETTINGS, 'format': FORMAT}, sort_keys=True).encode()).hexdigest()
    jobs = [(lang, name, text[lang]) for name, text in lines.items() for lang in ['es', 'en']]
    subscription = json.loads(request('/user/subscription', key)[0])
    remaining = subscription['character_limit'] - subscription['character_count']
    print(json.dumps({'remainingCredits': remaining, 'tier': subscription.get('tier'), 'characters': sum(len(t) for _, _, t in jobs), 'clips': len(jobs)}), flush=True)
    if not args.generate:
        return
    def generate(job):
        lang, name, text = job
        target = args.output / lang / (name + '.mp3')
        receipt = args.output / 'receipts' / (lang + '-' + name + '.json')
        identity = hashlib.sha256((settings_id + lang + text).encode()).hexdigest()
        if receipt.exists() and target.exists():
            saved = json.loads(receipt.read_text(encoding='utf-8'))
            if saved.get('identity') == identity and saved.get('sha256') == hashlib.sha256(target.read_bytes()).hexdigest():
                return saved
        payload = {'text': text, 'model_id': MODEL, 'voice_settings': SETTINGS}
        data, headers = request('/text-to-speech/' + VOICE_ID + '?output_format=' + FORMAT, key, payload)
        if len(data) < 1000 or not (data[:3] == b'ID3' or data[0] == 255):
            raise RuntimeError('Invalid MP3: ' + lang + '/' + name)
        target.parent.mkdir(parents=True, exist_ok=True)
        receipt.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        saved = {'language': lang, 'key': name, 'identity': identity, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data), 'characters': len(text), 'reportedCharacterCost': headers.get('character-cost')}
        receipt.write_text(json.dumps(saved, indent=2), encoding='utf-8')
        print(lang + '/' + name, flush=True)
        return saved
    # Reserve the conservative full character count; never enable paid overage or rotate accounts.
    if remaining < sum(len(text) for _, _, text in jobs):
        raise RuntimeError('Insufficient included credits; no narration was generated')
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        receipts = list(executor.map(generate, jobs))
    after = json.loads(request('/user/subscription', key)[0])
    manifest = {'provider': 'ElevenLabs API', 'model': MODEL, 'voices': {lang: {'id': VOICE_ID, 'name': VOICE_NAME} for lang in ['es','en']}, 'voiceSettings': SETTINGS, 'outputFormat': FORMAT, 'clips': len(receipts), 'characters': sum(len(t) for _,_,t in jobs), 'remainingCreditsAfter': after['character_limit'] - after['character_count'], 'lines': lines, 'files': receipts}
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'complete': len(receipts), 'remainingCredits': manifest['remainingCreditsAfter']}), flush=True)

if __name__ == '__main__':
    main()
