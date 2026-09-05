"""Generate the optional Spain narration using the existing account and included quota."""
import concurrent.futures, hashlib, importlib.util, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('elevenlabs', ROOT / 'scripts/generate-elevenlabs-voice.py')
el = importlib.util.module_from_spec(spec)
spec.loader.exec_module(el)
VOICE = 'SzSUM9aqTucCylaROOmf'
OUT = ROOT / 'work/spain-voice'

def main():
    key = el.get_key()
    lines = json.loads((ROOT / 'docs/voice-script.json').read_text(encoding='utf-8-sig'))
    quota = json.loads(el.request('/user/subscription', key)[0])
    required = sum(len(t['es']) for t in lines.values())
    if quota['character_limit'] - quota['character_count'] < required:
        raise RuntimeError('Insufficient included credits; no overage enabled')
    OUT.mkdir(parents=True, exist_ok=True)
    def generate(item):
        name, translations = item
        text = translations['es']
        target = OUT / (name + '.mp3')
        receipt = OUT / (name + '.json')
        identity = hashlib.sha256(json.dumps([VOICE, el.MODEL, el.SETTINGS, text],sort_keys=True).encode()).hexdigest()
        if target.exists() and receipt.exists():
            old = json.loads(receipt.read_text())
            if old['identity'] == identity and old['sha256'] == hashlib.sha256(target.read_bytes()).hexdigest():
                return old
        sample = ROOT / 'work/valeria-welcome.mp3'
        if name == 'welcome' and sample.exists():
            data = sample.read_bytes()
        else:
            data, _ = el.request('/text-to-speech/' + VOICE + '?output_format=' + el.FORMAT, key,
                {'text': text, 'model_id': el.MODEL, 'language_code': 'es', 'voice_settings': el.SETTINGS})
        if len(data) < 1000 or not (data[:3] == b'ID3' or data[0] == 255):
            raise RuntimeError('Invalid MP3: ' + name)
        target.write_bytes(data)
        info = {'key': name, 'identity': identity, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes':len(data), 'text':text}
        receipt.write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
        print(name,flush=True)
        return info
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        receipts = list(pool.map(generate, lines.items()))
    manifest = {'provider':'ElevenLabs', 'voiceId':VOICE,'voiceName':'Valeria - Clear, Relaxed, Engaging','language':'es-ES','catalogAccent':'peninsular','model':el.MODEL,'settings':el.SETTINGS,'outputFormat':el.FORMAT,'characters':required,'clips':len(receipts),'files':receipts}
    (OUT / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'complete':len(receipts),'characters':required}),flush=True)
if __name__ == '__main__':
    main()
