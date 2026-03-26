/**
 * store.js – Persistence layer (localStorage).
 *
 * Single source of truth: one JSON object keyed by "cas-transport-state".
 * All other modules read/write via Store.get() / Store.set().
 */
const Store = (() => {
  const KEY = 'cas-transport-state';

  const defaults = {
    km: 0,
    fuelCostPerKm: 0.70,
    lastRole: 'passenger',  // sticky default for the add form
    participants: [],        // [{ id, name, isLeader, role }]
                             // role: 'driver' | 'passenger' | 'independent'
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
