"""Prepare the game's fixed, non-personal narration. No player data is sent."""
import asyncio, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "work" / "tts"))
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
LINES=json.loads((ROOT/"docs"/"voice-script.json").read_text(encoding="utf-8-sig"))
VOICES={"es":"es-ES-ElviraNeural","en":"en-US-JennyNeural"}
async def main():
    semaphore=asyncio.Semaphore(3)
    async def generate(key,lang,text):
        target=ROOT/"work"/"microsoft-voice"/lang/(key+".mp3")
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and target.stat().st_size>1000:
            return
        async with semaphore:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text,VOICES[lang],rate="-8%",pitch="+0Hz").save(str(target))
                    if target.stat().st_size<1000:
                        raise RuntimeError("Empty narration")
                    print(lang+"/"+key,flush=True)
                    return
                except Exception:
                    if attempt==2:
                        raise
                    await asyncio.sleep(2*(attempt+1))
    await asyncio.gather(*(generate(key,lang,words[lang]) for key,words in LINES.items() for lang in VOICES))
    manifest={"voices":VOICES,"rate":"-8%","provider":"Microsoft Edge neural text-to-speech, generated via edge-tts 7.2.8","clips":len(LINES)*2,"lines":LINES}
    (ROOT/"work"/"microsoft-voice"/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    print("COMPLETE",len(LINES)*2,flush=True)
asyncio.run(main())

