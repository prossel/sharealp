/**
 * store.js – Persistence layer (localStorage).
 *
 * Single source of truth: one JSON object keyed by "cas-transport-state".
 * All other modules read/write via Store.get() / Store.set().
 */
const Store = (() => {
  const KEY = 'cas-transport-state';

  // Role order matches ROLES array in ui.js — index is stored in URL
  const ROLE_KEYS = ['driver', 'passenger', 'independent'];

  const defaults = {
    km: 0,
    fuelCostPerKm: 0.70,
    lastRole: 'passenger',  // sticky default for the add form
    participants: [],        // [{ id, name, isLeader, role }]
                             // role: 'driver' | 'passenger' | 'independent'
  };

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

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

  // Compact format: [km, fuelCostPerKm, [[name, isLeader01, roleIdx], ...]]
  // - lastRole and participant IDs are not stored (not useful for recipient)
  // - UTF-8 safe via unescape(encodeURIComponent(...)) before btoa
  // - Base64url (no +, /, = chars) so no URL-encoding needed
  function serialize(state) {
    try {
      const compact = [
        state.km,
        state.fuelCostPerKm,
        state.participants.map(p => [
          p.name,
          p.isLeader ? 1 : 0,
          ROLE_KEYS.indexOf(p.role),
        ]),
      ];
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch { return ''; }
  }

  function deserialize(str) {
    try {
      const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(b64)));
      const [km, fuelCostPerKm, parts] = JSON.parse(json);
      return {
        km: km ?? 0,
        fuelCostPerKm: fuelCostPerKm ?? defaults.fuelCostPerKm,
        lastRole: defaults.lastRole,
        participants: (parts ?? []).map(([name, isLeader, roleIdx]) => ({
          id: uid(),
          name,
          isLeader: !!isLeader,
          role: ROLE_KEYS[roleIdx] ?? 'passenger',
        })),
      };
    } catch { return null; }
  }

  return { get, set, reset, serialize, deserialize, defaults };
})();
