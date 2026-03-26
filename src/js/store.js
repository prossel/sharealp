/**
 * store.js – Persistence layer (localStorage).
 *
 * Single source of truth: one JSON object keyed by "cas-transport-state".
 * All other modules read/write via Store.get() / Store.set().
 */
const Store = (() => {
  const KEY = 'cas-transport-state';

  const defaults = {
    participants: [],   // [{ id, name }]
    vehicles: [],       // [{ id, ownerId, description, km, fuelCostPerKm }]
    trips: [],          // [{ id, vehicleId, passengerIds }]
  };

  function get() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) ?? structuredClone(defaults);
    } catch {
      return structuredClone(defaults);
    }
  }

  function set(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  return { get, set, reset, defaults };
})();
