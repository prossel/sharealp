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
    document.title = state.description
      ? `${state.description} - ShareAlp – Partage des frais de transport`
      : 'ShareAlp – Partage des frais de transport';
    syncUrl(state);
  }

  function syncUrl(state) {
    const encoded = Store.serialize(state);
    const defaultEncoded = Store.serialize(Store.defaults);
    if (encoded && encoded !== defaultEncoded) {
      history.replaceState(null, '', '?s=' + encoded);
    } else {
      history.replaceState(null, '', location.pathname);
    }
  }

  // ── Course settings ────────────────────────────────────
  function updateSetting(field, value) {
    const state = Store.get();
    state[field] = value;
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

  // ── Share ──────────────────────────────────────────────
  function share() {
    const url = location.href;
    if (navigator.share) {
      navigator.share({ title: 'ShareAlp', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btn-share');
        if (!btn) return;
        const original = btn.textContent;
        btn.textContent = '✓ Lien copié !';
        btn.disabled = true;
        setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2000);
      }).catch(() => {
        prompt('Copiez ce lien :', url);
      });
    }
  }

  // ── Reset ──────────────────────────────────────────────
  function reset() {
    if (!confirm('Réinitialiser toutes les données ?')) return;
    Store.reset();
    render();
  }

  // Bootstrap — load from URL ?s= if present, else localStorage
  document.addEventListener('DOMContentLoaded', () => {
    const param = new URLSearchParams(location.search).get('s');
    if (param) {
      const state = Store.deserialize(param);
      if (state) Store.set(state);
    }
    render();
  });

  return { updateSetting, addParticipant, removeParticipant, updateParticipant, reset, share };
})();
