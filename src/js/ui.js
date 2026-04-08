/**
 * ui.js – DOM rendering helpers.
 * All functions receive state and return HTML strings or update the DOM.
 * No business logic here — delegate to Transport.* for calculations.
 */
const UI = (() => {

  const ROLES = [
    { value: 'driver',      label: 'Conducteur',   icon: '🚗' },
    { value: 'passenger',   label: 'Passager',      icon: '💺' },
    { value: 'independent', label: 'Indépendant',   icon: '🚶' },
  ];
  const ROLE_ORDER = Object.fromEntries(ROLES.map((r, i) => [r.value, i]));

  function sortParticipants(list) {
    return [...list].sort((a, b) => {
      const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
  }

  function renderSettings(state) {
    return `
      <section id="section-settings">
        <h2>Course</h2>
        <div class="form-row">
          <div class="field field--wide">
            <label for="input-description">Description</label>
            <input id="input-description" type="text" maxlength="32"
              value="${escHtml(state.description ?? '')}"
              onchange="App.updateSetting('description', this.value)" />
          </div>
          <div class="field-group">
            <div class="field">
              <label for="input-km">Kilomètres totaux</label>
              <input id="input-km" type="number" min="0" value="${state.km}"
                onchange="App.updateSetting('km', parseFloat(this.value) || 0)" />
            </div>
            <div class="field">
              <label for="input-rate">CHF/km</label>
              <input id="input-rate" type="number" min="0" step="0.01" value="${state.fuelCostPerKm}"
                onchange="App.updateSetting('fuelCostPerKm', parseFloat(this.value) || 0)" />
            </div>
          </div>
        </div>
        <p style="margin-top:0.5rem;font-size:0.85rem;color:#666">
          Coût par voiture : <strong>${(state.km * state.fuelCostPerKm).toFixed(2)} CHF</strong>
        </p>
      </section>`;
  }

  function renderParticipants(state) {
    const { participants, lastRole } = state;
    const roleOptions = (selected) => ROLES.map(r =>
      `<option value="${r.value}"${r.value === selected ? ' selected' : ''}>${r.icon} ${r.label}</option>`
    ).join('');
    return `
      <section id="section-participants">
        <h2>Participants</h2>
        <div class="form-row">
          <div class="field">
            <label for="input-participant-name">Nom</label>
            <input id="input-participant-name" type="text" placeholder="ex. Alice"
              onkeydown="if(event.key==='Enter') App.addParticipant()" />
          </div>
          <div class="field">
            <label for="input-participant-role">Rôle</label>
            <select id="input-participant-role">${roleOptions(lastRole)}</select>
          </div>
          <div class="field" style="flex:0;align-self:center;padding-top:1.25rem">
            <label style="display:flex;align-items:center;gap:0.4rem;white-space:nowrap">
              <input id="input-participant-leader" type="checkbox" />
              Chef de course
            </label>
          </div>
          <div class="field" style="flex:0;align-self:flex-end">
            <button class="btn-primary" onclick="App.addParticipant()">Ajouter</button>
          </div>
        </div>
        ${participants.length ? `
        <table style="margin-top:1rem">
          <thead><tr><th>Nom</th><th>Rôle</th><th>Chef ★</th><th></th></tr></thead>
          <tbody>
            ${sortParticipants(participants).map(p => `
              <tr>
                <td>${escHtml(p.name)}</td>
                <td>
                  <select onchange="App.updateParticipant('${p.id}', 'role', this.value)">
                    ${roleOptions(p.role)}
                  </select>
                </td>
                <td style="text-align:center">
                  <input type="checkbox" ${p.isLeader ? 'checked' : ''}
                    onchange="App.updateParticipant('${p.id}', 'isLeader', this.checked)" />
                </td>
                <td><button class="btn-danger" onclick="App.removeParticipant('${p.id}')">✕</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : ''}
      </section>`;
  }

  function renderResults(state) {
    const { participants } = state;
    if (!participants.length) return '';

    const balances = Transport.computeBalances(state);
    const transfers = Transport.computeTransfers(balances);
    const { costPerCar, costPerVoyager, nNonLeaderVoyagers, nNonLeaders, shareL, L, V } = Transport.computeSummary(state);
    const nameOf = id => participants.find(p => p.id === id)?.name ?? id;

    const sorted = sortParticipants(participants);
    return `
      <section id="section-results">
        <h2>Résultats</h2>
        ${state.description ? `<p style="margin-top:0;margin-bottom:1rem;font-weight:600">${escHtml(state.description)}</p>` : ''}
        <table style="margin-bottom:1rem">
          <tbody>
            <tr><td style="color:#555;font-size:0.85rem">Coût par voiture</td><td><strong>${costPerCar.toFixed(2)} CHF</strong></td></tr>
            <tr><td style="color:#555;font-size:0.85rem">Coût par place (siège)</td><td><strong>${costPerVoyager.toFixed(2)} CHF</strong></td></tr>
            <tr><td style="color:#555;font-size:0.85rem">Part chefs de course (L)</td><td><strong>${L.toFixed(2)} CHF</strong> <span style="color:#888;font-size:0.85rem">(${nNonLeaders}&nbsp;×&nbsp;${shareL.toFixed(2)}&nbsp;CHF)</span></td></tr>
            <tr><td style="color:#555;font-size:0.85rem">Part voyageurs non-chefs (V)</td><td><strong>${V.toFixed(2)} CHF</strong> <span style="color:#888;font-size:0.85rem">(${nNonLeaderVoyagers}&nbsp;×&nbsp;${costPerVoyager.toFixed(2)}&nbsp;CHF)</span></td></tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th>Participant</th><th>Rôle</th><th>Solde</th></tr></thead>
          <tbody>
            ${sorted.map(p => {
              const b = balances[p.id] ?? 0;
              const cls = b >= 0 ? 'result-positive' : 'result-negative';
              const sign = b >= 0 ? '+' : '';
              const role = ROLES.find(r => r.value === p.role);
              const roleLabel = role ? `${role.icon} ${role.label}` : p.role;
              return `<tr>
                <td>${escHtml(p.name)}${p.isLeader ? ' ★' : ''}</td>
                <td style="font-size:0.85rem;color:#666">${roleLabel}</td>
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
        <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn-secondary" onclick="App.reset()">Réinitialiser</button>
          <button id="btn-share" class="btn-primary" onclick="App.share()">🔗 Partager les résultats</button>
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

  return { renderSettings, renderParticipants, renderResults };
})();
