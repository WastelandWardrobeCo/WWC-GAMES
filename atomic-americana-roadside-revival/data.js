"use strict";

window.AtomicData = (() => {
  const DINER_STAGES = [
    { name: "Abandoned", description: "Broken glass, a battered roof, and weeds have swallowed the old Moonbeam Diner.", task: "Clear the debris", cost: { caps: 10, scrap: 2, wrenches: 0 } },
    { name: "Cleanup", description: "The worst rubble is gone. The shell of the diner is ready for a proper repair crew.", task: "Patch the exterior", cost: { caps: 20, scrap: 4, wrenches: 0 } },
    { name: "Exterior Repairs", description: "Patched walls, sound windows, and a repaired roof give the diner its shape again.", task: "Repair the neon", cost: { caps: 30, scrap: 5, wrenches: 1 } },
    { name: "Neon Restored", description: "The Moonbeam sign flickers over the highway again, but the cracked lot needs work.", task: "Restore the parking lot", cost: { caps: 50, scrap: 8, wrenches: 2 } },
    { name: "Parking Lot Restored", description: "Fresh stripes and polished cruisers are ready. One last push will open the doors.", task: "Grand reopening", cost: { caps: 80, scrap: 12, wrenches: 3 } },
    { name: "Grand Reopening", description: "Coffee is hot, the neon glows, and Moonbeam Junction has a heartbeat once more.", task: null, cost: null }
  ];

  const LANDMARKS = {
    moonbeamDiner: { id: "moonbeamDiner", name: "Moonbeam Diner", locked: false, position: { x: 38, y: 44 }, stages: DINER_STAGES },
    starliteDriveIn: { id: "starliteDriveIn", name: "Starlite Drive-In", locked: true, unlockText: "Coming Soon", position: { x: 72, y: 25 } },
    atomicService: { id: "atomicService", name: "Atomic Service Station", locked: true, unlockText: "Coming Soon", position: { x: 12, y: 25 } }
  };

  const WORK_SESSION = {
    moves: 20,
    completionBonus: { caps: 10, scrap: 0, wrenches: 0 },
    rewards: {
      match3: { caps: 3, scrap: 0, wrenches: 0 },
      match4: { caps: 6, scrap: 1, wrenches: 0 },
      match5: { caps: 10, scrap: 0, wrenches: 1 }
    }
  };

  return { LANDMARKS, WORK_SESSION, TILE_TYPES: ["🚗", "🎳", "📻", "🍔", "⛽", "🎸"] };
})();
