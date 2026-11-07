#!/usr/bin/env python3
"""Prompt locally without echo; save only to ignored .env.local."""
import getpass
import os
from pathlib import Path
import re
import tempfile

root = Path(__file__).resolve().parent.parent
target = root / '.env.local'
print('Google Maps 키 설정 · I EAT BUSAN')
print('키를 붙여넣고 Enter를 누르세요. 입력한 내용은 화면에 표시되지 않습니다.')
try:
    key = getpass.getpass('Google Maps API 키: ').strip()
except (KeyboardInterrupt, EOFError):
    print('\n설정을 취소했습니다.'); raise SystemExit(0)
if not re.fullmatch(r'[A-Za-z0-9_-]{20,200}', key):
    print('키 형식을 확인한 뒤 다시 실행해 주세요. 파일은 변경하지 않았습니다.')
    raise SystemExit(1)
lines = target.read_text().splitlines() if target.exists() else []
setting = 'GOOGLE_MAPS_BROWSER_KEY=' + key
pattern = re.compile(r'^\s*(?:export\s+)?GOOGLE_MAPS_BROWSER_KEY\s*=')
output = [line for line in lines if not pattern.match(line)]
output.append(setting)
fd, temporary = tempfile.mkstemp(prefix='.maps-env-', dir=root)
try:
    os.fchmod(fd, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write('\n'.join(output) + '\n')
    os.replace(temporary, target)
finally:
    if os.path.exists(temporary): os.unlink(temporary)
print('저장했습니다. 상세지도 화면을 새로고침하면 적용됩니다.')
print('로컬 주소: http://127.0.0.1:8765/#/map/detail')
