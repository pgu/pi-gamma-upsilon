# Les grecques en finance

Cours interactif (français, termes financiers en anglais) pour débutant complet : delta, gamma, vega, theta, rho, puis application « desk » (P&L explain, delta-hedging).

Site statique, zéro dépendance, zéro build : HTML + CSS + ES modules + SVG.

## Lancer en local

```sh
npm start        # http://localhost:8000  (python3 -m http.server -d site)
npm test         # vérifie le pricer Black-Scholes et les grecques (différences finies)
```

Les ES modules exigent un serveur HTTP : ouvrir `index.html` en `file://` ne marche pas.

## Structure

```
site/
  index.html
  css/style.css
  js/
    bs.js          pricing + grecques (unités desk : vega/pt, theta/jour, rho/pt)
    market.js      modèle de marché simulé (smile, term structure)
    strat.js       stratégies multi-jambes : coût, P&L, grecques nettes
    charts.js      graphiques SVG maison (ligne, histogramme)
    ui.js          sliders, quiz, callouts, progression (localStorage)
    glossary.js    glossaire + popover au clic
    app.js         routeur (#/leçon) et navigation
    lessons/       une leçon = { id, title, blurb, minutes, html(), init(root, done) }
tests/bs.test.mjs
```

### Ajouter une leçon

Créer `site/js/lessons/lN-xxx.js` (copier une leçon existante), l'ajouter dans `site/js/lessons/index.js`.

## Publier

Le workflow `.github/workflows/pages.yml` teste puis déploie `site/` sur GitHub Pages à chaque push sur `main`
(activer *Settings → Pages → Source : GitHub Actions*).
