# ShareAlp

Web app pour répartir les frais de transport d'une course du [Club Alpin Suisse](https://www.sac-cas.ch/) entre les participants.

## Utilisation

Ouvrez [`index.html`](https://prossel.github.io/shareAlp/) directement dans le navigateur — aucun serveur requis.

1. **Course** – saisissez la description, le nombre de kilomètres et le tarif CHF/km.
2. **Participants** – ajoutez chaque membre avec son rôle (`Conducteur`, `Passager` ou `Indépendant`) et cochez le(s) chef(s) de course.
3. **Résultats** – consultez les soldes et les virements minimaux à effectuer.

Les données sont sauvegardées automatiquement dans le `localStorage` du navigateur.

Le bouton "Partager" génère une URL avec les données encodées, permettant de partager la course avec d'autres personnes.

## Architecture

```
index.html          Point d'entrée
src/
  css/style.css     Styles
  js/
    store.js        Persistence (localStorage)
    transport.js    Calculs purs (balance, virements)
    ui.js           Rendu HTML
    app.js          Contrôleur / boucle de rendu
```

## Développement

Aucune dépendance, aucun build. Ouvrez `index.html` dans un navigateur ou utilisez un serveur local :

```bash
npx serve .
# ou
python3 -m http.server
```
