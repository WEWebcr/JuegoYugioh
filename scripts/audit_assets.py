import zipfile
import re

with zipfile.ZipFile('YuGiOh-ForbiddenMemoriesReborn.apk', 'r') as z:
    apk_assets = {n.replace('assets/', '', 1): n for n in z.namelist() if n.startswith('assets/')}
    apk_assets_lower = {k.lower(): k for k in apk_assets.keys()}

with open('YGOFMR2026-1.html', 'r', encoding='utf-8') as f:
    html = f.read()

paths = re.findall(r'[\'"]((?:imagenescartas|ImagenesPersonajes|musica|assets|data)/[^\'\"\s\?#<>]+)[\'\"\?#]', html, re.I)
print(f'Total path references found in HTML: {len(paths)}')

missing = []
case_mismatch = []

for p in set(paths):
    if p in apk_assets:
        continue
    elif p.lower() in apk_assets_lower:
        case_mismatch.append((p, apk_assets_lower[p.lower()]))
    else:
        missing.append(p)

print(f'Exact matches: {len(set(paths)) - len(missing) - len(case_mismatch)}')
print(f'Case mismatches: {len(case_mismatch)}')
for orig, real in case_mismatch[:10]:
    print(f'  HTML has: {orig} -> APK has: {real}')

print(f'Missing files: {len(missing)}')
for m in missing[:15]:
    print(f'  Missing: {m}')
