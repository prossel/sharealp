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
      UI.renderParticipants(state) +
      UI.renderVehicles(state) +
      UI.renderTrips(state) +
      UI.renderResults(state);
  }

  // ── Participants ───────────────────────────────────────
  function addParticipant() {
    const input = document.getElementById('input-participant-name');
    const name = input.value.trim();
    if (!name) return;
    const state = Store.get();
    state.participants.push({ id: Transport.uid(), name });
    Store.set(state);
    render();
  }

  function removeParticipant(id) {
    const state = Store.get();
    state.participants = state.participants.filter(p => p.id !== id);
    // Cascade: remove vehicles and trips that referenced this participant
    state.vehicles = state.vehicles.filter(v => v.ownerId !== id);
    state.trips = state.trips
      .map(t => ({ ...t, passengerIds: t.passengerIds.filter(pid => pid !== id) }))
      .filter(t => state.vehicles.some(v => v.id === t.vehicleId));
    Store.set(state);
    render();
  }

  // ── Vehicles ───────────────────────────────────────────
  function addVehicle() {
    const ownerId = document.getElementById('input-vehicle-owner').value;
    const description = document.getElementById('input-vehicle-desc').value.trim();
    const km = parseFloat(document.getElementById('input-vehicle-km').value) || 0;
    const fuelCostPerKm = parseFloat(document.getElementById('input-vehicle-cost').value) || 0;
    if (!ownerId) return;
    const state = Store.get();
    state.vehicles.push({ id: Transport.uid(), ownerId, description, km, fuelCostPerKm });
    Store.set(state);
    render();
  }

  function removeVehicle(id) {
    const state = Store.get();
    state.vehicles = state.vehicles.filter(v => v.id !== id);
    state.trips = state.trips.filter(t => t.vehicleId !== id);
    Store.set(state);
    render();
  }

  // ── Trips ──────────────────────────────────────────────
  function addTrip() {
    const vehicleId = document.getElementById('input-trip-vehicle').value;
    const passengerIds = [...document.getElementById('input-trip-passengers').selectedOptions].map(o => o.value);
    if (!vehicleId) return;
    const state = Store.get();
    state.trips.push({ id: Transport.uid(), vehicleId, passengerIds });
    Store.set(state);
    render();
  }

  function removeTrip(id) {
    const state = Store.get();
    state.trips = state.trips.filter(t => t.id !== id);
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

  return { addParticipant, removeParticipant, addVehicle, removeVehicle, addTrip, removeTrip, reset };
})();
