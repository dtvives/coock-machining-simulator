"""Isolated loopback-only UX test host; never imported by the production app.

Run: .venv\\Scripts\\python.exe -m tools.ux5_test_server
Control: POST http://127.0.0.1:8766/__ux5/fail-next
The next /api/simulate returns 503 once, then normal processing resumes.
"""
from copy import deepcopy
import json
from pathlib import Path

from starlette.responses import HTMLResponse, JSONResponse
from simulator.api import app as production_app
from simulator.engine import simulate
from simulator.schemas import Settings

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / '.tmp' / 'ux5'


def fixtures():
    first = simulate(Settings())
    second = simulate(Settings(feed_mm_rev=0.30))
    runs = [dict(id=f'ux5-{i}', name=f'Proef {i}', prediction='', reflection='', result=r)
            for i, r in enumerate((first, second), 1)]
    old = dict(format='coock-workshop-v2', settings=deepcopy(second['settings']),
               prediction='', reflection='', baseline='ux5-1', runs=runs)
    current = deepcopy(old)
    current['runs'][0]['decisions'] = [dict(value='Nog onvoldoende gemeten bewijs voor mijn doel',
        at='2026-11-15T10:00:00.000Z', afterReveal=False)]
    current['runs'][0]['revealedAt'] = '2026-11-15T10:01:00.000Z'
    closing = deepcopy(old)
    closing['runs'] = closing['runs'][:1]
    closing['settings'] = deepcopy(first['settings'])
    # Deliberately excessive feed: geometric finish fails even on a fresh edge.
    # This deterministic counterexample tests interpretation, not seed hunting.
    adverse_result = simulate(Settings(mode='week', quantity=800,
        feed_mm_rev=0.30, release_policy='final'))
    adverse = dict(format='coock-workshop-v2', settings=deepcopy(adverse_result['settings']),
        prediction='', reflection='', baseline='ux6-adverse', runs=[dict(
            id='ux6-adverse', name='Proef 1', prediction='', reflection='', result=adverse_result)])
    return {'legacy-v2': old, 'current-v2': current, 'week-task': old,
            'closing-task': closing, 'adverse-week': adverse}


def write_fixtures():
    FIXTURES.mkdir(parents=True, exist_ok=True)
    for name, value in fixtures().items():
        (FIXTURES / f'{name}.json').write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')


class UXTestHost:
    def __init__(self):
        self.fail_next = False
        self.failures_served = 0

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await production_app(scope, receive, send)
        path = scope['path']
        headers = dict(scope['headers'])
        origin = headers.get(b'origin')
        client = (scope.get('client') or ('testclient', 0))[0]
        if client not in {'127.0.0.1', '::1', 'testclient'}:
            return await JSONResponse({'detail': 'Loopback test host only'}, 403)(scope, receive, send)
        if origin and origin not in {b'http://127.0.0.1:8766', b'http://localhost:8766'}:
            return await JSONResponse({'detail': 'Same-origin test requests only'}, 403)(scope, receive, send)
        if path == '/__ux5/fail-next' and scope['method'] == 'POST':
            self.fail_next = True
            return await JSONResponse({'armed': True})(scope, receive, send)
        if path == '/__ux5/status':
            return await JSONResponse({'armed': self.fail_next, 'failures_served': self.failures_served})(scope, receive, send)
        if path.startswith('/__ux5/prepare/') and scope['method'] == 'GET':
            name = path.removeprefix('/__ux5/prepare/')
            session = fixtures().get(name)
            if session is None:
                return await JSONResponse({'detail': 'Unknown UX fixture'}, 404)(scope, receive, send)
            # Explicit test setup only, NOT an exercise-file import. Legacy raw
            # JSON is supported by the app cache reader. Escape HTML-sensitive
            # characters even though these fixtures contain only synthetic data.
            payload = json.dumps(session, ensure_ascii=True).replace('<', '\\u003c')
            html = '<!doctype html><meta charset="utf-8"><title>UX test setup</title>'
            html += '<p>Preparing synthetic UX fixture. This is not an import test.</p>'
            html += '<script>localStorage.setItem("coock-workshop-v1", JSON.stringify('
            html += payload + '));location.replace("/");</script>'
            return await HTMLResponse(html, headers={'Cache-Control': 'no-store'})(scope, receive, send)
        if path == '/api/simulate' and scope['method'] == 'POST' and self.fail_next:
            self.fail_next = False
            self.failures_served += 1
            return await JSONResponse({'detail': 'UX-test: eenmalige mislukte berekening.'}, 503)(scope, receive, send)
        # Production middleware trusts port 8766. This dedicated wrapper has already
        # enforced loopback/same-origin; remove only this test host's Origin header.
        forwarded = dict(scope)
        forwarded['headers'] = [(k, v) for k, v in scope['headers'] if k.lower() != b'origin']
        return await production_app(forwarded, receive, send)


app = UXTestHost()

if __name__ == '__main__':
    import uvicorn
    write_fixtures()
    uvicorn.run(app, host='127.0.0.1', port=8766, log_level='warning')
