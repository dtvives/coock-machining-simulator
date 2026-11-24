"""Boundary and persistence tests against the real ASGI application."""
import csv
import io
import json
import unittest

from fastapi.testclient import TestClient
from simulator.api import app


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_and_scenarios(self):
        self.assertEqual(self.client.get('/api/health').json()['status'], 'ok')
        self.assertEqual({s['id'] for s in self.client.get('/api/scenarios').json()}, {'steel-shaft', 'tight-finish'})

    def test_defaults_and_exact_json_roundtrip(self):
        response = self.client.post('/api/simulate', json={})
        self.assertEqual(response.status_code, 200)
        run = json.loads(json.dumps(response.json(), allow_nan=False))
        saved = {key: run[key] for key in ('settings', 'model_version', 'scenario_snapshot')}
        repeated = self.client.post('/api/reproduce', json=saved)
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.json(), run)

    def test_reproduce_refuses_changed_model_or_scenario(self):
        run = self.client.post('/api/simulate', json={}).json()
        saved = {key: run[key] for key in ('settings', 'model_version', 'scenario_snapshot')}
        saved['model_version'] = 'unavailable'
        self.assertEqual(self.client.post('/api/reproduce', json=saved).status_code, 409)
        saved['model_version'] = run['model_version']
        saved['scenario_snapshot']['ra_limit_um'] = 999
        self.assertEqual(self.client.post('/api/reproduce', json=saved).status_code, 409)

    def test_invalid_and_extreme_input(self):
        for payload in ({'speed_m_min': 0}, {'feed_mm_rev': 100}, {'quantity': 5001}, {'seed': -1}, {'inspect_every': 0}, {'logging': 'false'}, {'quantity': True}, {'mode': 'production'}, {'scenario_id': '../x'}, {'playback': 4}, {'quantity': 1.5}):
            with self.subTest(payload=payload):
                r = self.client.post('/api/simulate', json=payload)
                self.assertEqual(r.status_code, 422)
                self.assertIn('invoer', r.json()['detail'])
        self.assertEqual(self.client.post('/api/simulate', content='{"speed_m_min":NaN}', headers={'Content-Type':'application/json'}).status_code, 422)

    def test_exports_retain_true_and_observed_quality(self):
        r = self.client.post('/api/export/csv', json={'quantity': 7})
        self.assertEqual(r.status_code, 200)
        rows = list(csv.DictReader(io.StringIO(r.text.lstrip('\ufeff')), delimiter=';'))
        self.assertEqual(len(rows), 7)
        self.assertEqual(rows[1]['observed_good'], '')
        self.assertIn('good', rows[1])
        text = self.client.post('/api/export/summary', json={}).text
        self.assertIn('seed 42', text)
        self.assertIn('geen automatische jaaromrekening', text)

    def test_zero_good_export_is_explicit(self):
        payload = {'feed_mm_rev': .4, 'quantity': 3}
        run = self.client.post('/api/simulate', json=payload).json()
        self.assertEqual(run['summary']['good'], 0)
        self.assertIsNone(run['summary']['cost_per_good_eur'])
        self.assertIn('geen goede stukken', self.client.post('/api/export/summary', json=payload).text)

    def test_untrusted_hosts_and_cross_site_posts_blocked(self):
        self.assertEqual(self.client.get('/api/health', headers={'Host': 'external.example'}).status_code, 400)
        self.assertEqual(self.client.post('/api/simulate', json={}, headers={'Origin': 'https://external.example'}).status_code, 403)
        self.assertEqual(self.client.post('/api/simulate', json={}, headers={'Origin': 'http://127.0.0.1:8766'}).status_code, 200)

    def test_final_release_and_reproducible_exports(self):
        payload = {'mode':'week','quantity':80,'change_after_parts':80,'release_policy':'final'}
        response = self.client.post('/api/simulate', json=payload)
        self.assertEqual(response.status_code, 200)
        run = response.json()
        self.assertEqual(run['model_version'], '2.0.0')
        self.assertEqual(run['summary']['released'], 80)
        self.assertTrue(run['summary']['release_on_time'])
        self.assertEqual(run, self.client.post('/api/reproduce', json={k:run[k] for k in ('settings','model_version','scenario_snapshot')}).json())
        rows = list(csv.DictReader(io.StringIO(self.client.post('/api/export/csv',json=payload).text.lstrip('\ufeff')), delimiter=';'))
        self.assertEqual(sum(r['observed_good']=='True' for r in rows),80)
        self.assertIn('Vrijgegeven (gemeten goed): 80',self.client.post('/api/export/summary',json=payload).text)

    def test_legacy_model_rejected_without_claiming_reproduction(self):
        run = self.client.post('/api/simulate',json={}).json()
        saved = {k:run[k] for k in ('settings','model_version','scenario_snapshot')}
        saved['model_version']='1.0.0'
        saved['settings'].pop('release_policy')
        saved['settings'].pop('inspection_offset')
        self.assertEqual(self.client.post('/api/reproduce',json=saved).status_code,409)

    def test_shifted_sampling_validation(self):
        for payload in ({'inspection_offset':-1},{'inspection_offset':5,'inspect_every':5},{'release_policy':'guess'}):
            self.assertEqual(self.client.post('/api/simulate',json=payload).status_code,422)
        r=self.client.post('/api/simulate',json={'inspection_offset':1,'inspect_every':5,'quantity':10}).json()
        self.assertEqual([p['number'] for p in r['parts'] if p['inspected']],[1,6])


if __name__ == '__main__':
    unittest.main()
