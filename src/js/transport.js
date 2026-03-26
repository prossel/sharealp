/**
 * transport.js – Pure calculation logic (no DOM, no side-effects).
 *
 * Cost model:
 *   Each vehicle trip has a total cost = km × fuelCostPerKm.
 *   That cost is split equally between the driver and all passengers.
 *   The driver "pays" their share via the car; passengers owe the driver.
 *
 * Result: a map of participantId → net balance (positive = to receive, negative = to pay).
 */
const Transport = (() => {

  /**
   * @param {object} state - full Store state
   * @returns {Map<string, number>} participantId → net balance in CHF
   */
  function computeBalances(state) {
    const { participants, vehicles, trips } = state;

    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
    const balances = Object.fromEntries(participants.map(p => [p.id, 0]));

    for (const trip of trips) {
      const vehicle = vehicleMap[trip.vehicleId];
      if (!vehicle) continue;

      const occupants = [vehicle.ownerId, ...trip.passengerIds];
      const uniqueOccupants = [...new Set(occupants)];
      const totalCost = vehicle.km * vehicle.fuelCostPerKm;
      const share = totalCost / uniqueOccupants.length;

      for (const id of uniqueOccupants) {
        if (id === vehicle.ownerId) {
          // Driver already paid → receives from others
          balances[id] = (balances[id] ?? 0) + totalCost - share;
        } else {
          // Passenger owes their share
          balances[id] = (balances[id] ?? 0) - share;
        }
      }
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

  return { computeBalances, computeTransfers, uid };
})();
