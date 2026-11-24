"""Reproduce v2 workshop comparisons and preserve compact headless evidence."""
from collections import Counter
from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from simulator import MODEL_VERSION
from simulator.engine import simulate
from simulator.schemas import Settings


def record(title, expectation, **overrides):
    settings = Settings(**overrides)
    result = simulate(settings)
    summary = result['summary']
    assert summary['produced'] == summary['good'] + summary['rejected']
    assert summary['produced'] == summary['inspected'] + summary['uninspected']
    assert abs(summary['working_minutes'] + summary['unused_minutes'] - summary['available_minutes']) < 1e-6
    assert result == simulate(settings)
    measured_ages = Counter(str(p['age_on_edge']) for p in result['parts'] if p['inspection_kind'] == 'sample')
    return dict(case=title, expectation=expectation, settings=result['settings'], summary=summary,
                periodic_measured_ages=dict(sorted(measured_ages.items(), key=lambda item:int(item[0]))))


def main():
    if MODEL_VERSION != '2.0.0':
        raise RuntimeError('Deze vergelijking vereist model 2.0.0; voer uit na integratie van de v2-kern.')
    rows = []
    for scenario in ('steel-shaft', 'tight-finish'):
        for seed in (42, 43, 44):
            for policy in ('sample', 'final'):
                for interval in (8, 40, 80):
                    rows.append(record(f'{scenario}: wissel {interval}, {policy}, seed {seed}',
                                       'Vroeg wisselen kost meer; laat wisselen kan kwaliteit en vrijgave beperken.',
                                       scenario_id=scenario, mode='week', quantity=800, seed=seed,
                                       change_after_parts=interval, release_policy=policy))
    for offset in (0, 10):
        rows.append(record(f'Meetfase {offset}', 'Een gelijk meetbudget kan andere gereedschapsleeftijden bemonsteren.',
                           mode='trial', quantity=800, change_after_parts=80, inspect_every=40,
                           inspection_offset=offset, release_policy='sample'))
    rows.append(record('Aanvullen na eindcontrole', 'Eindcontrole ontdekt verborgen afkeur; aanvullende productie kan het tekort herstellen.',
                       mode='week', quantity=800, change_after_parts=50, release_policy='final', stop_on_reject=True))
    rows.append(record('Onmogelijke vrijgave', 'Roostereinde begrenst ook eindcontrole en aanvullende productie.',
                       mode='week', quantity=5000, release_policy='final'))
    rows.append(record('Geen vrijgegeven stukken', 'Een slechte procesinstelling wordt niet goed door uitsluitend te controleren.',
                       mode='week', quantity=50, feed_mm_rev=.4, release_policy='final'))
    path = Path(__file__).resolve().parents[1] / 'docs' / 'scenario-results-v2.json'
    path.write_text(json.dumps(dict(model_version=MODEL_VERSION, cases=rows), indent=2, ensure_ascii=False, allow_nan=False), encoding='utf-8')
    print('| Proef | Bruto | Goed | Vrijgegeven | Min dienst | EUR/goed |')
    print('| --- | ---: | ---: | ---: | ---: | ---: |')
    for row in rows:
        s = row['summary']
        cost = '-' if s['cost_per_good_eur'] is None else f"{s['cost_per_good_eur']:.2f}"
        print(f"| {row['case']} | {s['produced']} | {s['good']} | {s['released']} | {s['working_minutes']:.2f} | {cost} |")


if __name__ == '__main__':
    main()
