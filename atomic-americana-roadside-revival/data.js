"use strict";

window.AtomicData = (() => {
  const DINER_STAGES = [
    { name: "Abandoned", description: "Broken glass, a battered roof, and weeds have swallowed the old Moonbeam Diner.", task: "Clear the parking lot", cost: { wrenches: 1, caps: 0 } },
    { name: "Cleanup", description: "The worst rubble is gone. The shell of the diner is ready for a proper repair crew.", task: "Repair the diner exterior", cost: { wrenches: 2, caps: 0 } },
    { name: "Exterior Repairs", description: "Patched walls, sound windows, and a repaired roof give the diner its shape again.", task: "Restore the neon sign", cost: { wrenches: 3, caps: 0 } },
    { name: "Neon Restored", description: "The Moonbeam sign flickers over the highway again, but the cracked lot needs work.", task: "Rebuild the parking lot", cost: { wrenches: 4, caps: 100 } },
    { name: "Parking Lot Restored", description: "Fresh stripes and polished cruisers are ready. One last push will open the doors.", task: "Grand reopening", cost: { wrenches: 5, caps: 250 } },
    { name: "Grand Reopening", description: "Coffee is hot, the neon glows, and Moonbeam Junction has a heartbeat once more.", task: null, cost: null }
  ];

  const LANDMARKS = {
    moonbeamDiner: { id: "moonbeamDiner", name: "Moonbeam Diner", locked: false, position: { x: 38, y: 44 }, stages: DINER_STAGES },
    starliteDriveIn: { id: "starliteDriveIn", name: "Starlite Drive-In", locked: true, unlockText: "Coming Soon", position: { x: 72, y: 25 } },
    atomicService: { id: "atomicService", name: "Atomic Service Station", locked: true, unlockText: "Coming Soon", position: { x: 12, y: 25 } }
  };

  const LEVELS = [
    { id: 1, name: "Parking Lot Patrol", targetScore: 1500, moves: 25, rewards: { wrenches: 1, caps: 25, stars: 1 } },
    { id: 2, name: "Rubble Roundup", targetScore: 2000, moves: 25, rewards: { wrenches: 1, caps: 40, stars: 1 } },
    { id: 3, name: "Chrome & Concrete", targetScore: 2500, moves: 25, rewards: { wrenches: 1, caps: 60, stars: 1 } },
    { id: 4, name: "Neon Night Shift", targetScore: 3000, moves: 24, rewards: { wrenches: 2, caps: 80, stars: 1 } },
    { id: 5, name: "Fresh White Lines", targetScore: 3500, moves: 24, rewards: { wrenches: 2, caps: 110, stars: 1 } },
    { id: 6, name: "Grand Reopening Run", targetScore: 4000, moves: 23, rewards: { wrenches: 2, caps: 140, stars: 1 } }
  ];

  return { LANDMARKS, LEVELS, TILE_TYPES: ["🚗", "🎳", "📻", "🍔", "⛽", "🎸"] };
})();
