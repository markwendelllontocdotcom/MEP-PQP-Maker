"""Build-time extractor: turns the R1 sample PQP (tools/R1.docx) into the app's
content model (src/content/r1.json) and copies the Word parts the generator
re-uses (styles, numbering, theme, font table) into src/content/docx-parts.json.

Run:  python3 tools/extract_r1.py
"""
import json, re, sys, zipfile, os
from lxml import etree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, 'R1.docx')
OUT = os.path.join(ROOT, 'src', 'content', 'r1.json')
PARTS = os.path.join(ROOT, 'src', 'content', 'docx-parts.json')

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
def w(tag): return '{%s}%s' % (W, tag)
def wv(el, attr='val'):
    return None if el is None else el.get(w(attr))

z = zipfile.ZipFile(SRC)
doc = etree.fromstring(z.read('word/document.xml'))
numbering = etree.fromstring(z.read('word/numbering.xml'))
styles = etree.fromstring(z.read('word/styles.xml'))

# ---------------------------------------------------------------- numbering
abstract = {}
for a in numbering.iter(w('abstractNum')):
    lv = {}
    for l in a.iter(w('lvl')):
        ind = l.find('.//' + w('ind'))
        rf = l.find('.//' + w('rFonts'))
        lv[l.get(w('ilvl'))] = {
            'fmt': wv(l.find(w('numFmt'))),
            'text': wv(l.find(w('lvlText'))),
            'start': int(wv(l.find(w('start'))) or 1),
            'left': int(ind.get(w('left')) or 0) if ind is not None and ind.get(w('left')) else 0,
            'hanging': int(ind.get(w('hanging')) or 0) if ind is not None and ind.get(w('hanging')) else 0,
            'font': rf.get(w('ascii')) if rf is not None else None,
        }
    abstract[a.get(w('abstractNumId'))] = lv
nums = {n.get(w('numId')): n.find(w('abstractNumId')).get(w('val')) for n in numbering.iter(w('num'))}

def numdef(numId, ilvl):
    return abstract.get(nums.get(numId), {}).get(ilvl)

BULLET_KIND = {'': 'arrow', '': 'bullet', 'o': 'circle', '': 'square', '': 'check'}

# ---------------------------------------------------------------- styles
style_sz = {}
for s in styles.iter(w('style')):
    sid = s.get(w('styleId'))
    sz = s.find('.//' + w('rPr') + '/' + w('sz'))
    if sz is not None:
        style_sz[sid] = int(sz.get(w('val')))
STYLE_LEFT = {'ListParagraph': 720}

# ---------------------------------------------------------------- runs
def run_props(r):
    rPr = r.find(w('rPr'))
    p = {}
    if rPr is None:
        return p
    def on(tag):
        e = rPr.find(w(tag))
        return e is not None and e.get(w('val')) not in ('0', 'false', 'none')
    if on('b'): p['b'] = 1
    if on('i'): p['i'] = 1
    u = rPr.find(w('u'))
    if u is not None and u.get(w('val')) not in (None, 'none'): p['u'] = 1
    sz = rPr.find(w('sz'))
    if sz is not None: p['sz'] = int(sz.get(w('val')))
    col = rPr.find(w('color'))
    if col is not None and col.get(w('val')) not in (None, 'auto', '000000'):
        p['c'] = col.get(w('val'))
    if on('vanish'): p['hidden'] = 1
    if on('caps'): p['caps'] = 1
    return p

def para_runs(p):
    out = []
    for r in p.iter(w('r')):
        # skip deleted text and field instructions
        anc = r.getparent()
        skip = False
        while anc is not None and anc is not p:
            if anc.tag in (w('del'), w('moveFrom')):
                skip = True
            anc = anc.getparent()
        if skip:
            continue
        props = run_props(r)
        if props.pop('hidden', None):
            continue
        txt = ''
        for ch in r:
            if ch.tag == w('t'):
                txt += ch.text or ''
            elif ch.tag == w('tab'):
                txt += '\t'
            elif ch.tag == w('br'):
                if ch.get(w('type')) == 'page':
                    continue
                txt += '\n'
            elif ch.tag == w('noBreakHyphen'):
                txt += '-'
            elif ch.tag == w('sym'):
                txt += chr(int(ch.get(w('char')), 16))
        if not txt:
            continue
        if props.pop('caps', None):
            txt = txt.upper()
        out.append(dict(props, x=txt))
    # merge neighbours with identical formatting
    merged = []
    for r in out:
        if merged and {k: v for k, v in merged[-1].items() if k != 'x'} == {k: v for k, v in r.items() if k != 'x'}:
            merged[-1]['x'] += r['x']
        else:
            merged.append(r)
    return merged

def runs_text(runs):
    return ''.join(r['x'] for r in runs)

def tidy(runs):
    """Removes whitespace artefacts copied from R1: repeated spaces, trailing tabs/spaces, space before : or ."""
    for r in runs:
        r['x'] = re.sub(r'(?<=\S) {2,}(?=\S)', ' ', r['x'])
    # trailing whitespace at paragraph end
    while runs and not runs[-1]['x'].strip():
        runs.pop()
    if runs:
        runs[-1]['x'] = runs[-1]['x'].rstrip(' \t\xa0')
        runs[-1]['x'] = re.sub(r'\s+([:.])$', r'\1', runs[-1]['x'])
    for r in runs:
        r['x'] = re.sub(r'(?<=\w) +(:)(?=\s|$)', r'\1', r['x'])
    return runs

# token replacement across the merged run list (done per run after merge)
TOKENS = [
    (re.compile(r'Oxypro Electromechanical Work LLC’?'), '{{COMPANY}}'),
    (re.compile(r'\[Project Name\]'), '{{P01}}'),
    (re.compile(r'\[Client Name\]'), '{{R01}}'),
    (re.compile(r'OXYPRO(?!-)'), '{{CO}}'),
    (re.compile(r'\b7 working days'), '{{Q06}} working days'),
]
def tokenise(runs):
    for r in runs:
        for rx, rep in TOKENS:
            r['x'] = rx.sub(rep, r['x'])
    return runs

def para_fmt(p, style):
    pPr = p.find(w('pPr'))
    f = {}
    if pPr is None:
        return f
    jc = pPr.find(w('jc'))
    if jc is not None:
        f['jc'] = jc.get(w('val'))
    ind = pPr.find(w('ind'))
    if ind is not None:
        for a, k in (('left', 'l'), ('start', 'l'), ('hanging', 'h'), ('firstLine', 'f'), ('right', 'r')):
            v = ind.get(w(a))
            if v is not None:
                f[k] = int(v)
    tabs = pPr.find(w('tabs'))
    if tabs is not None:
        tl = []
        for t in tabs.findall(w('tab')):
            if t.get(w('val')) == 'clear':
                continue
            tl.append({'v': t.get(w('val')), 'p': int(t.get(w('pos'))), **({'ld': t.get(w('leader'))} if t.get(w('leader')) else {})})
        if tl:
            f['tabs'] = tl
    return f

def numinfo(p):
    pPr = p.find(w('pPr'))
    if pPr is None:
        return None
    n = pPr.find(w('numPr'))
    if n is None:
        return None
    nid = wv(n.find(w('numId')))
    il = wv(n.find(w('ilvl'))) or '0'
    if nid in (None, '0'):
        return None
    return nid, il

def depth_of(d):
    """hierarchical depth from a decimal lvlText such as %1.%2.%3 or 4.%2.%3"""
    if not d or d['fmt'] != 'decimal' or not d['text']:
        return 0
    parts = [x for x in d['text'].rstrip('.').split('.') if x]
    return len(parts) if len(parts) >= 2 else 0

def slug(s):
    s = re.sub(r'\(.*?\)|\[.*?\]', '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return s[:40]

# ---------------------------------------------------------------- tables
def table_model(tbl):
    grid = [int(g.get(w('w'))) for g in tbl.iter(w('gridCol'))]
    tblPr = tbl.find(w('tblPr'))
    jc = wv(tblPr.find(w('jc'))) if tblPr is not None else None
    ind = tblPr.find(w('tblInd')) if tblPr is not None else None
    rows = []
    for tr in tbl.findall(w('tr')):
        cells = []
        for tc in tr.findall(w('tc')):
            tcPr = tc.find(w('tcPr'))
            cell = {}
            if tcPr is not None:
                shd = tcPr.find(w('shd'))
                if shd is not None and shd.get(w('fill')) not in (None, 'auto', 'FFFFFF'):
                    cell['fill'] = shd.get(w('fill'))
                gs = tcPr.find(w('gridSpan'))
                if gs is not None:
                    cell['span'] = int(gs.get(w('val')))
                vm = tcPr.find(w('vMerge'))
                if vm is not None:
                    cell['vm'] = vm.get(w('val')) or 'cont'
                va = tcPr.find(w('vAlign'))
                if va is not None:
                    cell['va'] = va.get(w('val'))
            paras = []
            for p in tc.findall(w('p')):
                runs = tokenise(para_runs(p))
                pf = para_fmt(p, None)
                ni = numinfo(p)
                para = {'r': runs}
                if pf.get('jc'):
                    para['jc'] = pf['jc']
                if ni:
                    d = numdef(*ni)
                    if d and d['fmt'] == 'bullet':
                        para['li'] = BULLET_KIND.get(d['text'], 'bullet')
                if runs or not paras:
                    paras.append(para)
            # drop trailing empty paragraphs
            while len(paras) > 1 and not paras[-1]['r']:
                paras.pop()
            cell['p'] = paras
            cells.append(cell)
        rows.append({'c': cells})
    out = {'t': 'tbl', 'grid': grid, 'rows': rows}
    if jc:
        out['jc'] = jc
    if ind is not None and ind.get(w('w')):
        out['ind'] = int(ind.get(w('w')))
    return out

# ---------------------------------------------------------------- walk body
body = doc.find(w('body'))
blocks = []
started = False
cur = {'h1': None, 'h2': None, 'role': None}
h1_ids = ['intro', 'scope', 'org', 'abbr', 'proc', 'hse', 'amend', 'annex']
h1_count = 0
list_counters = {}
units_seen = []
table_no = 0
stop = False
last_d3_title = None

def units():
    u = [cur['h1']]
    if cur['h2']:
        u.append(cur['h2'])
    if cur['role']:
        u.append(cur['role'])
    return u

for el in body:
    if stop:
        break
    if el.tag == w('sdt'):
        continue  # cached TOC
    if el.tag == w('tbl'):
        table_no += 1
        if not started:
            continue
        tm = table_model(el)
        tm['u'] = units()
        if cur['h1'] == 'amend':
            continue
        if table_no == 4:
            tm['id'] = 'ext_origin'
        blocks.append(tm)
        continue
    if el.tag != w('p'):
        continue
    pPr = el.find(w('pPr'))
    style = wv(pPr.find(w('pStyle'))) if pPr is not None else None
    style = style or 'Normal'
    runs = tidy(tokenise(para_runs(el)))
    text = runs_text(runs).strip()
    if style in ('Heading1', 'Heading2') and not text:
        continue
    if style == 'Heading1':
        started = True
        hid = h1_ids[h1_count]
        h1_count += 1
        cur = {'h1': hid, 'h2': None, 'role': None}
        blocks.append({'t': 'h1', 'id': hid, 'x': text, 'u': [hid]})
        units_seen.append({'id': hid, 'level': 1, 'title': text})
        if hid == 'scope':
            blocks.append({'t': 'slot', 'id': 'scope', 'u': [hid]})
        if hid == 'amend':
            blocks.append({'t': 'slot', 'id': 'amend', 'u': [hid]})
        if hid == 'annex':
            blocks.append({'t': 'slot', 'id': 'annex', 'u': [hid]})
            stop = True
        continue
    if not started:
        continue
    if cur['h1'] == 'scope':
        if text:
            for b in blocks:
                if b['t'] == 'slot' and b['id'] == 'scope':
                    b['base'] = {'r': runs, 'sz': style_sz.get(style, 22), 'l': para_fmt(el, style).get('l', STYLE_LEFT.get(style, 0))}
        continue
    if cur['h1'] in ('amend', 'annex'):
        continue  # generated from project data
    if style == 'Heading2':
        clean = text.rstrip(':').strip()
        hid = cur['h1'] + ':' + slug(clean)
        cur['h2'] = hid
        cur['role'] = None
        blocks.append({'t': 'h2', 'id': hid, 'x': clean, 'u': [cur['h1'], hid]})
        units_seen.append({'id': hid, 'level': 2, 'title': clean, 'parent': cur['h1']})
        continue
    if not text:
        continue
    fmt = para_fmt(el, style)
    ni = numinfo(el)
    d = numdef(*ni) if ni else None
    dep = depth_of(d)
    sz_default = style_sz.get(style, 22)
    if ni and ni[0] == '35':
        # R1's role list under 3.2 (numbered 1.1.x in R1) -> plain bullets
        rid = cur['h2'] + '/' + slug(text)
        blocks.append({'t': 'li', 'k': 'bullet', 'num': '12', 'il': '0', 'l': 1440, 'h': 360,
                       'r': runs, 'u': units() + [rid], 'sz': sz_default, 'rolelist': 1})
        continue
    if dep >= 3:
        is_title = all(r.get('u') for r in runs if r['x'].strip())
        if dep == 3 and cur['h2'] == 'org:responsibilities-and-authorities':
            rid = cur['h2'] + '/' + slug(text)
            cur['role'] = rid
            units_seen.append({'id': rid, 'level': 3, 'title': text, 'parent': cur['h2']})
        elif dep == 3:
            cur['role'] = None
        blk = {'t': 'n', 'd': dep, 'r': runs, 'u': units(), 'sz': sz_default}
        if fmt.get('jc'):
            blk['jc'] = fmt['jc']
        if is_title:
            blk['title'] = 1
        blocks.append(blk)
        continue
    if d and (d['fmt'] in ('bullet', 'lowerLetter', 'upperLetter', 'lowerRoman', 'upperRoman') or (d['fmt'] == 'decimal' and dep == 0)):
        if d['fmt'] == 'bullet':
            kind = BULLET_KIND.get(d['text'], 'bullet')
        else:
            kind = {'lowerLetter': 'la', 'upperLetter': 'ua', 'lowerRoman': 'lr', 'upperRoman': 'ur', 'decimal': 'dec'}[d['fmt']]
            kind += ')' if d['text'].endswith(')') else '.'
        left = fmt.get('l', d['left'])
        hang = fmt.get('h', d['hanging'])
        key = ni[0] + ':' + ni[1]
        n_ = list_counters.get(key, d['start'] - 1) + 1
        list_counters[key] = n_
        blk = {'t': 'li', 'k': kind, 'num': ni[0], 'il': ni[1], 'l': left, 'h': hang, 'n': n_,
               'r': runs, 'u': units(), 'sz': sz_default}
        if fmt.get('jc'):
            blk['jc'] = fmt['jc']
        blocks.append(blk)
        continue
    # plain paragraph (R1 indents some with spaces / tabs: trim them)
    if runs:
        runs[0]['x'] = runs[0]['x'].lstrip(' \t\xa0')
        runs[-1]['x'] = runs[-1]['x'].rstrip(' ')
    blk = {'t': 'p', 'r': runs, 'u': units(), 'sz': sz_default,
           'l': fmt.get('l', STYLE_LEFT.get(style, 0))}
    for k in ('h', 'f', 'jc', 'tabs'):
        if k in fmt:
            blk[k] = fmt[k]
    if style == 'ListParagraph':
        blk['s'] = 'ListParagraph'
    if runs_text(runs).strip() in ('Hard Copies', 'Information in Electronic form'):
        blk['jc'] = 'center'; blk['l'] = 0; blk.pop('tabs', None); blk['keep'] = 1
    if runs_text(runs).strip() == 'Applicable Forms':
        blk['keep'] = 1
    mt = re.match(r'^(.*?\S)[\s\t]{2,}(\([A-Za-z-]+\))$', runs_text(runs).strip())
    if mt:
        bold = 1 if any(r.get('b') for r in runs) else None
        rr = {'x': mt.group(1) + '\t' + mt.group(2)}
        if bold: rr['b'] = 1
        blk['r'] = [rr]
        blk['l'] = 851
        blk['tabs'] = [{'v': 'left', 'p': 851 + 3969}]
        blk.pop('h', None); blk.pop('f', None)
    blocks.append(blk)

# ---------------------------------------------------------------- slots for additions
def insert_after(pred_index, block):
    blocks.insert(pred_index + 1, block)

def last_index(pred):
    idx = None
    for i, b in enumerate(blocks):
        if pred(b):
            idx = i
    return idx

# intro paragraph -> slot (text depends on Q01)
for i, b in enumerate(blocks):
    if b['t'] == 'p' and runs_text(b['r']).startswith('This project quality plan is in line with'):
        blocks[i] = {'t': 'slot', 'id': 'intro_qms', 'u': b['u'], 'base': b}
        break

# Q05 sentence: end of 5.5.2 Procurement Procedure (before "Applicable Forms")
i = last_index(lambda b: b['t'] == 'n' and b['d'] == 4 and 'proc:procurement' in b['u'] and 'LPO' in runs_text(b['r']))
insert_after(i, {'t': 'slot', 'id': 'q05', 'u': blocks[i]['u']})
# Q04 sentence: end of 5.10 Work Inspections
i = last_index(lambda b: b['t'] == 'n' and b['d'] == 3 and 'proc:work-inspections' in b['u'])
insert_after(i, {'t': 'slot', 'id': 'q04', 'u': blocks[i]['u']})
# 5.19.6 Quality KPIs: end of 5.19
i = last_index(lambda b: 'proc:quality-assurance-and-control' in b.get('u', []))
insert_after(i, {'t': 'slot', 'id': 'kpi', 'u': ['proc', 'proc:quality-assurance-and-control', 'proc:quality-kpis']})
# 5.21 Authority Requirements: end of section 5
i = last_index(lambda b: b.get('u', [None])[0] == 'proc')
insert_after(i, {'t': 'slot', 'id': 'auth', 'u': ['proc', 'proc:authority-requirements']})

units_out = []
for u in units_seen:
    units_out.append(u)
    if u['id'] == 'proc:quality-assurance-and-control':
        pass
# extra toggle units for the additions
extra = [
    {'id': 'proc:quality-kpis', 'level': 3, 'title': 'Quality KPIs (added)', 'parent': 'proc:quality-assurance-and-control', 'added': 1},
    {'id': 'proc:authority-requirements', 'level': 2, 'title': 'Authority Requirements (added)', 'parent': 'proc', 'added': 1},
]
# place after their parents
def place(lst, item, after_id):
    idx = max(i for i, x in enumerate(lst) if x['id'] == after_id or x.get('parent') == after_id or x['id'].startswith(after_id + '/'))
    lst.insert(idx + 1, item)
place(units_out, extra[0], 'proc:quality-assurance-and-control')
place(units_out, extra[1], 'proc:project-close-out')

json.dump({'source': 'Project Quality Plan - Template R1.docx', 'blocks': blocks, 'units': units_out},
          open(OUT, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))

# ---------------------------------------------------------------- Word parts reused by the generator
def part(name):
    return z.read(name).decode('utf8')
json.dump({
    'styles': part('word/styles.xml'),
    'numbering': part('word/numbering.xml'),
    'theme': part('word/theme/theme1.xml'),
    'fontTable': part('word/fontTable.xml'),
}, open(PARTS, 'w', encoding='utf8'), ensure_ascii=False)

print('blocks', len(blocks), 'units', len(units_out), 'size', os.path.getsize(OUT))
from collections import Counter
print(Counter(b['t'] for b in blocks))
