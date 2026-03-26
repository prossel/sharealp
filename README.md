# CAS Transport

Web app pour répartir les frais de transport d'une course du [Club Alpin Suisse](https://www.sac-cas.ch/) entre les participants.

## Utilisation

Ouvrez `index.html` directement dans le navigateur — aucun serveur requis.

1. **Participants** – ajoutez tous les membres de la course.
2. **Véhicules** – enregistrez chaque voiture (conducteur, km, coût/km).
3. **Trajets** – indiquez qui était dans quel véhicule.
4. **Résultats** – consultez les soldes et les virements à effectuer.

Les données sont sauvegardées automatiquement dans le `localStorage` du navigateur.

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
