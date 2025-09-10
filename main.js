
// main.js — v6
console.log("main.js v6 loaded");

(async function () {
  // Load config (works in every browser)
  const res = await fetch("/config.json");
  const config = await res.json();
  console.log("config.floors:", config.floors?.length, config.floors);

    // ----- HELPERS -----
  const dpr = () => window.devicePixelRatio || 1;
  const dprRound = (px) => Math.round(px * dpr()) / dpr();
  const px = (n) => `${n}px`;
  const visibleFloors = 5;                         // how many floors you want visible

  // ----- STATE (must exist before functions use it) -----
  const state = {
    floors: new Map(),     // id -> { node, queue:[] }
    orderedIds: [],        // top -> bottom
    car: { floor: null, direction: 1, riders: [], capacity: config.elevator.capacity },
    worldOffset: 0,
    middleSlot: Math.floor(visibleFloors / 2), // for visible floors / 2
  };


  function computeFloorHeightFromScreen() {
  // divide width by 5 to get floor height
  const screenHeight = window.innerHeight;
  return Math.floor(screenHeight / visibleFloors);
  }


  function applyCssVars() {
    // Keep CSS in sync with config
    const h = computeFloorHeightFromScreen();
    document.documentElement.style.setProperty("--floor-h", px(h));
    // If you change car width in CSS, mirror here as well:
    document.documentElement.style.setProperty("--car-w", "200px");
  }

  function applyCameraHeight() {
    const shaft = document.querySelector("#shaft");
    const shaftHeight = window.innerHeight; 
    const rounded = dprRound(shaftHeight); // DPR-rounded height prevents half-pixel seams at odd zoom levels
    shaft.style.height = px(rounded);
  }

  // TODO: Use later in animation, figures out how far to move the tower vertically so that the requested floor appears in the correct “camera slot” of the viewport.
  // Without it, the elevator wouldn’t know how far to scroll the tower when you say “go to floor 5.” It ensures the requested floor is aligned properly in the viewport, and you don’t scroll beyond the first/last floor
  // function floorToCameraOffset(floorId) {
  //   const ids = state.orderedIds;
  //   const idx = ids.indexOf(floorId);
  //   const slot = state.middleSlot; // e.g., 1 when visibleFloors=3
  //   const h = config.viewport.floorHeight;
  //   const maxOffset = Math.max(0, (ids.length - config.viewport.visibleFloors) * h);
  //   const desired = (idx - slot) * h;
  //   return clamp(desired, 0, maxOffset);
  // }

  // Snap instantly (no animation) to a floor; rounds to device pixels to kill seams
  function snapCameraToFloor(floorId) {
    state.worldOffset = floorToCameraOffset(floorId);
    const y = -dprRound(state.worldOffset); // negative because we move the tower up
    const t = `translate3d(0, ${y}px, 0)`;
    const tower = document.querySelector("#tower");
    tower.style.transform = t;
    console.log("snapCameraToFloor", { floorId, offset: state.worldOffset, transform: t });
  }

  // If/when you animate between floors, use this to keep y on whole pixels.
  // function animateCameraToFloor(floorId, duration = 0.6) {
  //   state.worldOffset = floorToCameraOffset(floorId);
  //   const y = -dprRound(state.worldOffset);
  //   gsap.to("#tower", {
  //     y,                   // GSAP manipulates translateY for us
  //     duration,
  //     ease: "power2.out",
  //     snap: { y: 1 }       // <--- critical: whole-pixel snapping
  //   });
  // }

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
    applyCssVars();
    applyCameraHeight();
    console.log(window.innerHeight);
    console.log(window.innerWidth);
    buildTower(config.floors);

    // Ensure each floor element matches the configured height (CSS var already does this;
    // setting explicit inline height here is defensive if custom styles slip in).
    // document.querySelectorAll(".floor").forEach((el) => {
    //   el.style.height = px(config.viewport.floorHeight);
    // });

    // Pick initial floor (center one in view if possible)
    // state.car.floor =
    //   state.orderedIds[Math.min(state.middleSlot, state.orderedIds.length - 1)] ??
    //   state.orderedIds[0];

    // snapCameraToFloor(state.car.floor);
    // To animate instead:
    // animateCameraToFloor(state.car.floor, 0.4);

    // Recompute on resize/zoom changes
    window.addEventListener("resize", () => {
      applyCssVars();
      applyCameraHeight();
      // Re-apply camera transform with DPR rounding to avoid new seams
      snapCameraToFloor(state.car.floor);
    });
  }

  // ----- OPTIONAL: elevator loop (left here for later) -----
  // function runLoop() {
  //   // setInterval(stepScheduler, 1800);
  // }

  // // ----- UTIL -----
  // function clamp(v, a, b) {
  //   return Math.max(a, Math.min(b, v));
  // }

  // GO
  start();
})();
