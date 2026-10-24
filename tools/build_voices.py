"""Pre-renders every scripted line (mission briefings, radio calls, cutscene lines, soldier barks) to
assets/vo/*.mp3 with an offline neural voice (Piper, en_US 'joe' model, CC0), then gives each character
its own sound with ffmpeg: pitch, pace, EQ, compression and a radio band-pass + saturation for radio voices.
Writes assets/vo/manifest.json mapping "<variant>|<normalized text>" -> file.

Usage: python3 tools/build_voices.py /path/to/model.onnx   (needs: pip install piper-tts; ffmpeg)
Re-run after editing dialogue; unchanged lines are reused (files are content-addressed)."""
import hashlib, json, os, re, subprocess, sys, tempfile, wave
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets', 'vo')
OPERATORS = ['SPECTER', 'HAWK', 'VIPER', 'GHOST']
# variant: (semitones, length_scale, radio, extra eq)
VARIANTS = {
    'ctl': (-2.0, 1.04, True),   # CONTROL / HQ — calm, deep, over the radio
    'pil': (0.8, 0.94, True),    # EAGLE ONE pilot — quicker, over the radio
    'fem': (5.0, 1.0, False),    # Agent Mira Sol
    'op':  (-0.6, 1.0, False),   # the player operator (in person)
    'opf': (4.2, 0.98, False),   # GHOST (female operator)
    'en1': (-1.5, 0.92, False),  # enemy soldier voice A
    'en2': (-4.0, 0.95, False),  # enemy soldier voice B (heavier)
}

def norm(t):
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', t).strip().lower()

def js_strings(src, pattern):
    out = []
    for m in re.finditer(pattern, src):
        out.append(tuple((g or '').replace("\\'", "'") for g in m.groups()))
    return out

def collect():
    items = set()  # (variant, text)
    mis = open(os.path.join(ROOT, 'forest', 'missions.js'), encoding='utf-8').read()
    ctl = open(os.path.join(ROOT, 'forest', 'controller.js'), encoding='utf-8').read()
    voc = open(os.path.join(ROOT, 'voices.js'), encoding='utf-8').read()
    tuples = js_strings(mis, r"\['([A-Z][A-Z ]+)','((?:[^'\\]|\\.)*)'\]")
    for cs in OPERATORS:
        cap = cs[0] + cs[1:].lower()
        fix = lambda s: s.replace('SPECTER', cs).replace('Specter', cap)
        for who, text in tuples:
            w = fix(who)
            items.add((variant_for(w), fix(text)))
        for who, a, b in js_strings(ctl, r"who:'([A-Z ]+)'[^}]{0,40}?sub:'((?:[^'\\]|\\.)*)'(?:\+this\.cap\(\)\+'((?:[^'\\]|\\.)*)')?"):
            text = a + (cap + b if b else '')
            items.add((variant_for(who), text))
    # soldier barks and player lines
    enemy = voc[voc.index('enemy:{'):voc.index('player:{')]
    player = voc[voc.index('player:{'):voc.index('export const EMOTION')]
    for (s,) in js_strings(enemy, r"'((?:[^'\\]|\\.)+?)'(?=[,\]])"):
        if len(s) > 2 and not re.fullmatch(r'[a-z]+', s):
            items.add(('en1', s)); items.add(('en2', s))
    for (s,) in js_strings(player, r"'((?:[^'\\]|\\.)+?)'(?=[,\]])"):
        if len(s) > 2 and not re.fullmatch(r'[a-z]+', s):
            items.add(('op', s)); items.add(('opf', s))
    return sorted(items)

def variant_for(who):
    w = who.upper()
    if w in ('CONTROL', 'HQ'): return 'ctl'
    if w in ('EAGLE ONE', 'PILOT'): return 'pil'
    if w == 'MIRA SOL': return 'fem'
    if w == 'GHOST': return 'opf'
    if w in OPERATORS: return 'op'
    return 'ctl'

def ffilter(semi, radio):
    r = 2 ** (semi / 12)
    chain = [f'asetrate={int(22050*r)}', 'aresample=44100', f'atempo={1/r:.4f}', 'highpass=f=90', 'equalizer=f=3000:t=q:w=1.2:g=2.5']
    if radio:
        chain += ['highpass=f=320', 'lowpass=f=3300', 'acompressor=threshold=0.08:ratio=6:attack=4:release=60:makeup=3',
                  "aeval='tanh(2.4*val(0))/tanh(2.4)'", 'equalizer=f=1700:t=q:w=1:g=4']
    else:
        chain += ['acompressor=threshold=0.12:ratio=3:attack=6:release=80:makeup=1.6', 'equalizer=f=180:t=q:w=1:g=2']
    chain += ['alimiter=limit=0.89', 'apad=pad_dur=0.12']
    return ','.join(chain)

def main(model):
    from piper import PiperVoice
    from piper.config import SynthesisConfig
    os.makedirs(OUT, exist_ok=True)
    voice = PiperVoice.load(model)
    items = collect()
    manifest = {}
    jobs = []
    for var, text in items:
        semi, ls, radio = VARIANTS[var]
        h = hashlib.sha1(f'{var}|{text}|v2'.encode()).hexdigest()[:12]
        name = f'{var}_{h}.mp3'
        manifest[f'{var}|{norm(text)}'] = name
        dst = os.path.join(OUT, name)
        if os.path.exists(dst): continue
        jobs.append((var, text, semi, ls, radio, dst))
    print(len(items), 'lines,', len(jobs), 'to render')
    tmp = tempfile.mkdtemp()
    def enc(args):
        src, dst, semi, radio = args
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', ffilter(semi, radio), '-ac', '1', '-ar', '44100', '-b:a', '56k', dst], check=True)
        os.remove(src)
    pending = []
    for i, (var, text, semi, ls, radio, dst) in enumerate(jobs):
        wav = os.path.join(tmp, f'{i}.wav')
        with wave.open(wav, 'wb') as w:
            voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=ls, noise_scale=0.6, noise_w_scale=0.75))
        pending.append((wav, dst, semi, radio))
        if (i + 1) % 25 == 0: print(' ', i + 1)
    with ThreadPoolExecutor(4) as ex: list(ex.map(enc, pending))
    used = set(manifest.values())
    for f in os.listdir(OUT):
        if f.endswith('.mp3') and f not in used: os.remove(os.path.join(OUT, f))
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), separators=(',', ':'), sort_keys=True)
    print('manifest', len(manifest))

if __name__ == '__main__':
    main(sys.argv[1])
