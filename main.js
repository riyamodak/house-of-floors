// main.js — v5
console.log("main.js v5 loaded");

(async function () {
  // Load config (works in every browser)
  const res = await fetch("/config.json");
  const config = await res.json();
  console.log("config.floors:", config.floors?.length, config.floors);

  // ----- STATE (must exist before functions use it) -----
  const state = {
    floors: new Map(),     // id -> { node, queue:[] }
    orderedIds: [],        // top -> bottom
    car: { floor: null, direction: 1, riders: [], capacity: config.elevator.capacity },
    worldOffset: 0,
    middleSlot: Math.floor(config.viewport.visibleFloors / 2), // for 3 floors => 1
  };

  // ----- STARTUP -----
  function start() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  function init() {
    console.log("init() running");
    const shaft = document.querySelector("#shaft");
    const cameraHeight = config.viewport.visibleFloors * config.viewport.floorHeight;
    shaft.style.height = cameraHeight + "px";

    buildTower(config.floors);

    document.querySelectorAll(".floor").forEach((el) => {
      el.style.height = config.viewport.floorHeight + "px";
    });

    state.car.floor =
      state.orderedIds[Math.min(state.middleSlot, state.orderedIds.length - 1)] ??
      state.orderedIds[0];

    snapCameraToFloor(state.car.floor);

    // If you want to run the elevator loop later, call runLoop() here.
    // runLoop();

    window.addEventListener("resize", scaleToFit);
    scaleToFit();
  }

  // ----- BUILD FLOORS -----
  function buildTower(floorsFromConfig) {
    console.log("building floors…", floorsFromConfig?.length);
    const tower = document.querySelector("#tower");

    const floors = (floorsFromConfig ?? []).map((f) => ({
      id: f.id,
      bg: f.bg ?? `assets/floors/floor${f.id}.png`,
    }));

    // Sort with highest id at top; reverse if you prefer bottom-first
    floors.sort((a, b) => b.id - a.id);
    state.orderedIds = floors.map((f) => f.id);

    for (const f of floors) {
      const row = document.createElement("div");
      row.className = "floor";
      row.dataset.floorId = f.id;
      row.innerHTML = `<img class="bg" src="${f.bg}" alt="Floor ${f.id}"><div class="queue"></div>`;
      const img = row.querySelector("img");
      img.onerror = () => console.error("Missing image:", f.bg);
      tower.appendChild(row);
      console.log("added floor", f.id, "→", f.bg);
      state.floors.set(f.id, { node: row, queue: [] });
    }

    console.log("tower children:", tower.children.length);
  }

  // ----- CAMERA -----
  function floorToCameraOffset(floorId) {
    const ids = state.orderedIds;
    const idx = ids.indexOf(floorId);
    const slot = state.middleSlot; // e.g., 1 when visibleFloors=3
    const h = config.viewport.floorHeight;
    const maxOffset = Math.max(0, (ids.length - config.viewport.visibleFloors) * h);
    const desired = (idx - slot) * h;
    return clamp(desired, 0, maxOffset);
  }

  function snapCameraToFloor(floorId) {
    state.worldOffset = floorToCameraOffset(floorId);
    const t = `translateY(-${state.worldOffset}px)`;
    document.querySelector("#tower").style.transform = t;
    console.log("snapCameraToFloor", { floorId, offset: state.worldOffset, transform: t });
  }

  // ----- OPTIONAL: elevator loop (left here for later) -----
  function runLoop() {
    // setInterval(stepScheduler, 1800);
  }

  // ----- UTIL -----
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  

  // GO
  start();
})();
