# Перед публикацией добавляет ко всем файлам игры метку версии (?v=...),
# чтобы планшет не показывал старую игру из кэша, а сразу брал свежую.
import json, os, re, sys

root, ver = sys.argv[1], sys.argv[2]
html_path = os.path.join(root, "index.html")
html = open(html_path, encoding="utf-8").read()

files = []
for d in ("js", "levels", "lang", "lib"):
    for dirpath, _, names in os.walk(os.path.join(root, d)):
        for n in names:
            if n.endswith(".js"):
                files.append(os.path.relpath(os.path.join(dirpath, n), root).replace(os.sep, "/"))

m = re.search(r'<script type="importmap">(.*?)</script>', html, re.S)
imap = json.loads(m.group(1))
imports = imap.setdefault("imports", {})
for k, v in list(imports.items()):
    imports[k] = v + "?v=" + ver
for f in sorted(files):
    imports["./" + f] = "./" + f + "?v=" + ver
html = html[:m.start(1)] + "\n" + json.dumps(imap, indent=1, ensure_ascii=False) + "\n  " + html[m.end(1):]
html = html.replace('src="js/main.js"', f'src="js/main.js?v={ver}"')
html = re.sub(r'href="(css/[^"?]+)"', lambda mm: f'href="{mm.group(1)}?v={ver}"', html)
open(html_path, "w", encoding="utf-8").write(html)
print(f"stamped {len(files)} files with v={ver}")
