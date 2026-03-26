/**
 * ui.js – DOM rendering helpers.
 * All functions receive state and return HTML strings or update the DOM.
 * No business logic here — delegate to Transport.* for calculations.
 */
const UI = (() => {

  function renderParticipants(state) {
    const { participants } = state;
    return `
      <section id="section-participants">
        <h2>Participants</h2>
        <div class="form-row">
          <div class="field">
            <label for="input-participant-name">Nom</label>
            <input id="input-participant-name" type="text" placeholder="ex. Alice" />
          </div>
          <div class="field" style="flex:0;align-self:flex-end">
            <button class="btn-primary" onclick="App.addParticipant()">Ajouter</button>
          </div>
        </div>
        ${participants.length ? `
        <table style="margin-top:1rem">
          <thead><tr><th>Nom</th><th></th></tr></thead>
          <tbody>
            ${participants.map(p => `
              <tr>
                <td>${escHtml(p.name)}</td>
                <td><button class="btn-danger" onclick="App.removeParticipant('${p.id}')">✕</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : ''}
      </section>`;
  }

  function renderVehicles(state) {
    const { participants, vehicles } = state;
    if (!participants.length) return '';
    const options = participants.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
    return `
      <section id="section-vehicles">
        <h2>Véhicules</h2>
        <div class="form-row">
          <div class="field">
            <label>Conducteur</label>
            <select id="input-vehicle-owner">${options}</select>
          </div>
          <div class="field">
            <label>Description (optionnel)</label>
            <input id="input-vehicle-desc" type="text" placeholder="ex. VW Golf" />
          </div>
          <div class="field">
            <label>km totaux</label>
            <input id="input-vehicle-km" type="number" min="0" value="0" />
          </div>
          <div class="field">
            <label>CHF/km</label>
            <input id="input-vehicle-cost" type="number" min="0" step="0.01" value="0.70" />
          </div>
          <div class="field" style="flex:0;align-self:flex-end">
            <button class="btn-primary" onclick="App.addVehicle()">Ajouter</button>
          </div>
        </div>
        ${vehicles.length ? `
        <table style="margin-top:1rem">
          <thead><tr><th>Conducteur</th><th>Description</th><th>km</th><th>CHF/km</th><th>Coût</th><th></th></tr></thead>
          <tbody>
            ${vehicles.map(v => {
              const owner = participants.find(p => p.id === v.ownerId);
              const cost = (v.km * v.fuelCostPerKm).toFixed(2);
              return `<tr>
                <td>${escHtml(owner?.name ?? '?')}</td>
                <td>${escHtml(v.description)}</td>
                <td>${v.km}</td>
                <td>${v.fuelCostPerKm}</td>
                <td>${cost} CHF</td>
                <td><button class="btn-danger" onclick="App.removeVehicle('${v.id}')">✕</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>` : ''}
      </section>`;
  }

  function renderTrips(state) {
    const { participants, vehicles, trips } = state;
    if (!vehicles.length) return '';
    const vehicleOptions = vehicles.map(v => {
      const owner = participants.find(p => p.id === v.ownerId);
      return `<option value="${v.id}">${escHtml(owner?.name ?? '?')} – ${escHtml(v.description)}</option>`;
    }).join('');
    return `
      <section id="section-trips">
        <h2>Trajets</h2>
        <div class="form-row">
          <div class="field">
            <label>Véhicule</label>
            <select id="input-trip-vehicle">${vehicleOptions}</select>
          </div>
          <div class="field">
            <label>Passagers</label>
            <select id="input-trip-passengers" multiple size="4">
              ${participants.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="field" style="flex:0;align-self:flex-end">
            <button class="btn-primary" onclick="App.addTrip()">Ajouter trajet</button>
          </div>
        </div>
        ${trips.length ? `
        <table style="margin-top:1rem">
          <thead><tr><th>Véhicule</th><th>Passagers</th><th></th></tr></thead>
          <tbody>
            ${trips.map(t => {
              const vehicle = vehicles.find(v => v.id === t.vehicleId);
              const owner = participants.find(p => p.id === vehicle?.ownerId);
              const passengers = t.passengerIds.map(id => participants.find(p => p.id === id)?.name ?? '?');
              return `<tr>
                <td>${escHtml(owner?.name ?? '?')} – ${escHtml(vehicle?.description ?? '')}</td>
                <td>${passengers.map(escHtml).join(', ')}</td>
                <td><button class="btn-danger" onclick="App.removeTrip('${t.id}')">✕</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>` : ''}
      </section>`;
  }

  function renderResults(state) {
    const { participants } = state;
    if (!participants.length) return '';

    const balances = Transport.computeBalances(state);
    const transfers = Transport.computeTransfers(balances);
    const nameOf = id => participants.find(p => p.id === id)?.name ?? id;

    return `
      <section id="section-results">
        <h2>Résultats</h2>
        <table>
          <thead><tr><th>Participant</th><th>Solde</th></tr></thead>
          <tbody>
            ${participants.map(p => {
              const b = balances[p.id] ?? 0;
              const cls = b >= 0 ? 'result-positive' : 'result-negative';
              const sign = b >= 0 ? '+' : '';
              return `<tr>
                <td>${escHtml(p.name)}</td>
                <td class="${cls}">${sign}${b.toFixed(2)} CHF</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${transfers.length ? `
        <h2 style="margin-top:1.25rem">Virements à effectuer</h2>
        <table>
          <thead><tr><th>De</th><th>À</th><th>Montant</th></tr></thead>
          <tbody>
            ${transfers.map(t => `
              <tr>
                <td>${escHtml(nameOf(t.from))}</td>
                <td>${escHtml(nameOf(t.to))}</td>
                <td>${t.amount.toFixed(2)} CHF</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : '<p style="margin-top:0.75rem;color:#555">Aucun virement nécessaire.</p>'}
        <div style="margin-top:1rem">
          <button class="btn-secondary" onclick="App.reset()">Réinitialiser</button>
        </div>
      </section>`;
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { renderParticipants, renderVehicles, renderTrips, renderResults };
})();
