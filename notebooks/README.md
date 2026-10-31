# Notebooks Python

Versions Python des playgrounds du cours : mêmes formules, mêmes conventions de desk (vega par point de vol, theta par jour, rho par point de taux). Les notebooks sont livrés **avec leurs résultats** : tu peux les lire directement sur GitHub, ou les exécuter et les modifier.

| # | Notebook | Leçons du cours |
|---|---|---|
| 01 | [Black-Scholes et les cinq grecques](01_black_scholes_et_grecques.ipynb) | Pricing, delta, gamma, vega, theta, rho |
| 02 | [Volatilité implicite et smile](02_volatilite_implicite_et_smile.ipynb) | Implied vol, skew, bid/ask en vol |
| 03 | [Delta-hedging Monte Carlo](03_delta_hedging_monte_carlo.ipynb) | Vol réalisée vs implicite, fréquence de couverture, coûts |
| 04 | [Lire une option chain avec pandas](04_option_chain.ipynb) | Mouvement implicite, 25Δ put, skew ; esquisse pour de vraies données |
| 05 | [Stratégies et P&L explain](05_strategies_et_pnl_explain.ipynb) | Stratégies multi-jambes, grecques nettes, carte de risque |
| 06 | [Options américaines et arbre binomial](06_options_americaines_binomial.ipynb) | Exercice anticipé, frontière d'exercice |

## Lancer

```sh
cd notebooks
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

Lance toujours Jupyter **depuis ce dossier** : les notebooks font `import greeks` (le module [`greeks.py`](greeks.py)).

## La bibliothèque `greeks.py`

Petit jumeau Python de [`site/js/bs.js`](../site/js/bs.js) : `price`, `greeks`, `second_order` (vanna, volga, charm), `implied_vol` (Brent), `binomial` (CRR, américain ou européen), `smile_iv` (modèle de marché **simulé**). Elle accepte des tableaux numpy pour le spot.

## Tests

```sh
python -m pytest        # depuis notebooks/
```

`test_greeks.py` vérifie la bibliothèque contre une valeur de manuel (call ATM 1 an : 10,4506), les différences finies, et **les valeurs produites par le moteur JavaScript** du site : les deux implémentations ne peuvent pas diverger sans que le test échoue.

## Données

Rien ici n'utilise de données de marché réelles, sauf l'esquisse optionnelle (non exécutée) du notebook 04. Les chaînes d'options et les smiles sont **simulés**.
