"""The isolated fault host must fail exactly once without changing production."""
import unittest
from fastapi.testclient import TestClient
from tools.ux5_test_server import UXTestHost, fixtures


class UXHostTests(unittest.TestCase):
    def setUp(self):
        self.host = UXTestHost()
        self.client = TestClient(self.host, base_url='http://127.0.0.1:8766')

    def test_one_shot_failure_and_recovery_are_exact(self):
        settings = {'quantity': 10}
        expected = self.client.post('/api/simulate', json=settings).json()
        self.assertTrue(self.client.post('/__ux5/fail-next').json()['armed'])
        self.assertEqual(self.client.post('/api/simulate', json=settings).status_code, 503)
        recovered = self.client.post('/api/simulate', json=settings)
        self.assertEqual(recovered.status_code, 200)
        self.assertEqual(recovered.json(), expected)
        self.assertEqual(self.client.get('/__ux5/status').json(), {'armed': False, 'failures_served': 1})

    def test_cross_origin_cannot_arm_or_simulate(self):
        for route in ('/__ux5/fail-next', '/api/simulate'):
            self.assertEqual(self.client.post(route, headers={'Origin':'https://example.com'}, json={}).status_code, 403)
        self.assertFalse(self.client.get('/__ux5/status').json()['armed'])
        self.assertEqual(self.client.post('/api/simulate', headers={'Origin':'http://127.0.0.1:8766'}, json={}).status_code, 200)

    def test_fixture_results_reproduce_exactly(self):
        for session in fixtures().values():
            for run in session['runs']:
                result = run['result']
                payload = {k:result[k] for k in ('settings','model_version','scenario_snapshot')}
                self.assertEqual(self.client.post('/api/reproduce', json=payload).json(), result)

    def test_fixture_preparation_is_explicit_test_setup(self):
        for name in fixtures():
            response = self.client.get('/__ux5/prepare/' + name)
            self.assertEqual(response.status_code, 200)
            self.assertIn('This is not an import test', response.text)
            self.assertIn('localStorage.setItem("coock-workshop-v1"', response.text)
            self.assertIn('location.replace("/")', response.text)
            self.assertEqual(response.headers['cache-control'], 'no-store')
        self.assertEqual(self.client.get('/__ux5/prepare/missing').status_code, 404)

    def test_adverse_week_cannot_be_released_despite_final_inspection(self):
        result = fixtures()['adverse-week']['runs'][0]['result']
        summary = result['summary']
        self.assertEqual(result['settings']['release_policy'], 'final')
        self.assertGreater(summary['detected_rejects'], 0)
        self.assertLess(summary['released'], summary['order_target'])
        self.assertFalse(summary['release_on_time'])
        self.assertAlmostEqual(summary['working_minutes'], summary['available_minutes'])


if __name__ == '__main__':
    unittest.main()
