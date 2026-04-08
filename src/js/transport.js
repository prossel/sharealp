/**
 * transport.js – Pure calculation logic (no DOM, no side-effects).
 *
 * All cars do the same km at the same CHF/km rate:
 *   costPerCar = km × fuelCostPerKm
 *   totalCost  = N_drivers × costPerCar
 *
 * Two pools (split proportionally to voyager counts):
 *   costPerVoyager = totalCost / N_allVoyagers
 *   L = N_leaderVoyagers  × costPerVoyager  → paid equally by ALL non-leaders
 *   V = N_nonLeaderVoyagers × costPerVoyager → paid equally by non-leader voyageurs
 *
 * "Voyageur" = anyone with role 'driver' or 'passenger'.
 * Each driver is reimbursed costPerCar (same for everyone).
 * Leaders pay nothing.
 */
const Transport = (() => {

  /**
   * @param {object} state - full Store state
   * @returns {object} participantId → net balance in CHF
   */
  function computeBalances(state) {
    const { km, fuelCostPerKm, participants } = state;
    const costPerCar = km * fuelCostPerKm;

    const balances = Object.fromEntries(participants.map(p => [p.id, 0]));

    const drivers           = participants.filter(p =>  p.role === 'driver');
    const leaderVoyagers    = participants.filter(p =>  p.isLeader && (p.role === 'driver' || p.role === 'passenger'));
    const nonLeaderVoyagers = participants.filter(p => !p.isLeader && (p.role === 'driver' || p.role === 'passenger'));
    const nonLeaders        = participants.filter(p => !p.isLeader);

    const totalCost = drivers.length * costPerCar;
    const allVoyagers = leaderVoyagers.length + nonLeaderVoyagers.length;
    const costPerVoyager = allVoyagers > 0 ? totalCost / allVoyagers : 0;

    const L = leaderVoyagers.length * costPerVoyager;
    const V = nonLeaderVoyagers.length * costPerVoyager; // = nonLeaderVoyagers.length × costPerVoyager

    // All non-leaders pay their share of L
    if (nonLeaders.length > 0 && L > 0) {
      const share = L / nonLeaders.length;
      for (const p of nonLeaders) balances[p.id] -= share;
    }

    // Non-leader voyageurs additionally pay their share of V (= costPerVoyager each)
    if (nonLeaderVoyagers.length > 0 && V > 0) {
      for (const p of nonLeaderVoyagers) balances[p.id] -= costPerVoyager;
    }

    // Each driver is reimbursed costPerCar (same amount for all drivers)
    for (const p of drivers) {
      balances[p.id] += costPerCar;
    }

    return balances;
  }

  /**
   * Simplifies balances into a minimal list of transfers.
   * @param {object} balances - participantId → net balance
   * @returns {Array<{from, to, amount}>}
   */
  function computeTransfers(balances) {
    const creditors = [];
    const debtors = [];

    for (const [id, amount] of Object.entries(balances)) {
      if (amount > 0.005) creditors.push({ id, amount });
      else if (amount < -0.005) debtors.push({ id, amount: -amount });
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let ci = 0, di = 0;

    while (ci < creditors.length && di < debtors.length) {
      const c = creditors[ci];
      const d = debtors[di];
      const amount = Math.min(c.amount, d.amount);

      transfers.push({ from: d.id, to: c.id, amount: Math.round(amount * 100) / 100 });

      c.amount -= amount;
      d.amount -= amount;
      if (c.amount < 0.005) ci++;
      if (d.amount < 0.005) di++;
    }

    return transfers;
  }

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  /**
   * Returns the intermediate cost values for display purposes.
   * @param {object} state
   * @returns {{ costPerCar, costPerVoyager, L, V }}
   */
  function computeSummary(state) {
    const { km, fuelCostPerKm, participants } = state;
    const costPerCar = km * fuelCostPerKm;

    const drivers           = participants.filter(p =>  p.role === 'driver');
    const leaderVoyagers    = participants.filter(p =>  p.isLeader && (p.role === 'driver' || p.role === 'passenger'));
    const nonLeaderVoyagers = participants.filter(p => !p.isLeader && (p.role === 'driver' || p.role === 'passenger'));
    const nonLeaders        = participants.filter(p => !p.isLeader);

    const totalCost = drivers.length * costPerCar;
    const allVoyagers = leaderVoyagers.length + nonLeaderVoyagers.length;
    const costPerVoyager = allVoyagers > 0 ? totalCost / allVoyagers : 0;

    const L = leaderVoyagers.length * costPerVoyager;
    const V = nonLeaderVoyagers.length * costPerVoyager;

    return {
      costPerCar,
      costPerVoyager,
      nLeaderVoyagers: leaderVoyagers.length,
      nNonLeaderVoyagers: nonLeaderVoyagers.length,
      nNonLeaders: nonLeaders.length,
      shareL: nonLeaders.length > 0 ? L / nonLeaders.length : 0,
      L,
      V,
    };
  }

  return { computeBalances, computeTransfers, computeSummary, uid };
})();
