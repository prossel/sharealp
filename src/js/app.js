/**
 * app.js – Application controller.
 *
 * Owns the render loop: after every state mutation, calls render().
 * All event handlers live here; they mutate Store state then re-render.
 */
const App = (() => {

  function render() {
    const state = Store.get();
    document.getElementById('app').innerHTML =
      UI.renderSettings(state) +
      UI.renderParticipants(state) +
      UI.renderResults(state);
  }

  // ── Course settings ────────────────────────────────────
  function saveSettings() {
    const km = parseFloat(document.getElementById('input-km').value) || 0;
    const fuelCostPerKm = parseFloat(document.getElementById('input-rate').value) || 0;
    const state = Store.get();
    state.km = km;
    state.fuelCostPerKm = fuelCostPerKm;
    Store.set(state);
    render();
  }

  // ── Participants ───────────────────────────────────────
  function addParticipant() {
    const nameInput = document.getElementById('input-participant-name');
    const name = nameInput.value.trim();
    if (!name) return;
    const role = document.getElementById('input-participant-role').value;
    const isLeader = document.getElementById('input-participant-leader').checked;
    const state = Store.get();
    state.lastRole = role;
    state.participants.push({ id: Transport.uid(), name, isLeader, role });
    Store.set(state);
    render();
    // Return focus to name field and clear it for the next entry
    const nextInput = document.getElementById('input-participant-name');
    if (nextInput) { nextInput.value = ''; nextInput.focus(); }
  }

  function removeParticipant(id) {
    const state = Store.get();
    state.participants = state.participants.filter(p => p.id !== id);
    Store.set(state);
    render();
  }

  function updateParticipant(id, field, value) {
    const state = Store.get();
    const p = state.participants.find(p => p.id === id);
    if (p) p[field] = value;
    Store.set(state);
    render();
  }

  // ── Reset ──────────────────────────────────────────────
  function reset() {
    if (!confirm('Réinitialiser toutes les données ?')) return;
    Store.reset();
    render();
  }

  // Bootstrap
  document.addEventListener('DOMContentLoaded', render);

  return { saveSettings, addParticipant, removeParticipant, updateParticipant, reset };
})();
