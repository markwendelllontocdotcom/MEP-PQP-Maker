"""Subsets Carlito (metric-compatible with Calibri, SIL OFL) and DejaVu Sans
(bullet symbols) and writes src/fonts/vfs.json for pdfmake."""
import base64, json, os, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = {
    'Carlito-Regular.ttf': '/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf',
    'Carlito-Bold.ttf': '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf',
    'Carlito-Italic.ttf': '/usr/share/fonts/truetype/crosextra/Carlito-Italic.ttf',
    'Carlito-BoldItalic.ttf': '/usr/share/fonts/truetype/crosextra/Carlito-BoldItalic.ttf',
}
LATIN = 'U+0020-007E,U+00A0-017F,U+0218-021B,U+02C6,U+02DA,U+02DC,U+2010-2027,U+2030-203A,U+2044,U+20AC,U+2116,U+2122,U+2190-2195,U+2212,U+2264,U+2265,U+00D7,U+00F7,U+2022,U+25CF'
SYM = 'U+0020,U+006F,U+2022,U+25AA,U+25A0,U+25BA,U+27A2,U+2713,U+2714,U+25CB'
out = {}
tmp = tempfile.mkdtemp()
def subset(src, name, uni):
    dst = os.path.join(tmp, name)
    subprocess.run(['pyftsubset', src, '--unicodes=' + uni, '--output-file=' + dst, '--layout-features=kern,liga', '--no-hinting'], check=True)
    from fontTools.ttLib import TTFont
    f = TTFont(dst)
    cmap = f.getBestCmap()
    if 0x2D in cmap and 0x2011 not in cmap:
        for t in f['cmap'].tables:
            if t.isUnicode():
                t.cmap[0x2011] = cmap[0x2D]
        f.save(dst)
    out[name] = base64.b64encode(open(dst, 'rb').read()).decode()
for name, src in SRC.items():
    subset(src, name, LATIN)
subset('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'Symbols.ttf', SYM)
json.dump(out, open(os.path.join(ROOT, 'src', 'fonts', 'vfs.json'), 'w'))
print({k: len(v) for k, v in out.items()})
