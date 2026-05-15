import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent / 'src'
patterns = [
    (re.compile(r'`http://localhost:8000/api/([^`]+)`'), r'getApiUrl(`/\1`)'),
    (re.compile(r"'http://localhost:8000/api/([^']*)'"), r"getApiUrl('/\1')"),
    (re.compile(r'"http://localhost:8000/api/([^\"]*)"'), r'getApiUrl("/\1")'),
    (re.compile(r'`http://localhost:8000/storage/([^`]+)`'), r'getStorageUrl(`/storage/\1`)'),
    (re.compile(r"'http://localhost:8000/storage/([^']*)'"), r"getStorageUrl('/storage/\1')"),
    (re.compile(r'"http://localhost:8000/storage/([^\"]*)"'), r'getStorageUrl("/storage/\1")'),
]

for path in sorted(root.rglob('*.jsx')):
    text = path.read_text(encoding='utf-8')
    new_text = text
    for pat, repl in patterns:
        new_text = pat.sub(repl, new_text)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        print(f'updated {path}')
