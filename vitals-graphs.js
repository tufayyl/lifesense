// Wrap in IIFE to avoid leaking globals / redeclarations
(function () {
  // Requires Chart.js and Supabase (already loaded in index.html)
  // Renders two live sparkline charts: Heart Rate (bpm) and SpO2 (%)

  // Toggle mock vs live mode
  const USE_MOCK_DATA = false; // Use real data from Supabase
  const REFRESH_INTERVAL_MS = 5000; // Refresh every 5 seconds
  const DEFAULT_MAX_POINTS = 150; // rolling window length

  // Use shared Supabase client (initialized in supabase-init.js)
  let supa = null;

  // Canvas elements
  const hrCanvas = document.getElementById("hrChart");
  const spo2Canvas = document.getElementById("spo2Chart");

  let hrCtx = null;
  let spo2Ctx = null;
  if (hrCanvas) hrCtx = hrCanvas.getContext("2d");
  if (spo2Canvas) spo2Ctx = spo2Canvas.getContext("2d");

  let hrChart = null;
  let spo2Chart = null;

  // Colors from current theme
  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#ffffff";
  }
  function getTickColor() {
    return getCssVar("--text-primary") || "#ffffff";
  }
  function getGridColor(lightness = 0.06) {
    // Use a subtle grid based on text color; fallback light gray
    const darkMode = document.documentElement.getAttribute("data-theme") === "dark";
    return darkMode ? "rgba(255,255,255,0.12)" : `rgba(0,0,0,${lightness})`;
  }

  // Rolling buffers (not used in live mode, but kept for compatibility)
  let hrLabels = [];
  let hrValues = [];
  let spo2Labels = [];
  let spo2Values = [];

  // Determine max points based on canvas width (roughly 6px per point), fallback to default
  function computeMaxPoints() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(hrCanvas?.clientWidth || 0, 0) * dpr;
    if (!w) return DEFAULT_MAX_POINTS;
    return Math.max(60, Math.min(DEFAULT_MAX_POINTS, Math.floor(w / 6)));
  }

  let MAX_POINTS = DEFAULT_MAX_POINTS;

  // Fetchers — fetch from heartrate table
  // Try common timestamp column names: created_at, timestamp, time
  const TIMESTAMP_COLUMN = "created_at"; // Change to "timestamp" or "time" if needed
  
  async function fetchHeartRate() {
    if (!supa) return { labels: [], values: [] };
    try {
      const { data, error } = await supa
        .from("heartrate")
        .select(`bpm, ${TIMESTAMP_COLUMN}`)
        .order(TIMESTAMP_COLUMN, { ascending: true })
        .limit(MAX_POINTS);
      if (error) {
        console.error("Supabase heartrate error:", error);
        // Log the full error to help identify the correct column name
        if (error.message) {
          console.error("Error details:", error.message);
        }
        return { labels: [], values: [] };
      }
      if (!data || data.length === 0) {
        return { labels: [], values: [] };
      }
      const labels = data.map((row) => {
        const timestamp = row[TIMESTAMP_COLUMN] || row.created_at || row.timestamp || row.time;
        return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      });
      const values = data.map((row) => row.bpm);
      return { labels, values };
    } catch (e) {
      console.error("fetchHeartRate exception:", e);
      return { labels: [], values: [] };
    }
  }

  async function fetchSpO2() {
    if (!supa) return { labels: [], values: [] };
    try {
      const { data, error } = await supa
        .from("heartrate")
        .select(`spo2, ${TIMESTAMP_COLUMN}`)
        .order(TIMESTAMP_COLUMN, { ascending: true })
        .limit(MAX_POINTS);
      if (error) {
        console.error("Supabase heartrate spo2 error:", error);
        // Log the full error to help identify the correct column name
        if (error.message) {
          console.error("Error details:", error.message);
        }
        return { labels: [], values: [] };
      }
      if (!data || data.length === 0) {
        return { labels: [], values: [] };
      }
      const labels = data.map((row) => {
        const timestamp = row[TIMESTAMP_COLUMN] || row.created_at || row.timestamp || row.time;
        return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      });
      const values = data.map((row) => row.spo2);
      return { labels, values };
    } catch (e) {
      console.error("fetchSpO2 exception:", e);
      return { labels: [], values: [] };
    }
  }

  function renderHr(labels, values) {
    if (!hrCtx) return;
    if (hrChart) hrChart.destroy();
    hrChart = new Chart(hrCtx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "",
            data: values,
            borderColor: "#e67e22",
            backgroundColor: "transparent",
            borderWidth: 1.5,
            tension: 0.35,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "x",
        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: "index" } },
        scales: {
          y: {
            display: true,
            grid: { color: getGridColor(0.06) },
            ticks: { color: getTickColor() },
            beginAtZero: true,
            suggestedMin: 0,
            suggestedMax: 120
          },
          x: {
            display: true,
            grid: { color: getGridColor(0.04) },
            ticks: { color: getTickColor(), maxTicksLimit: 6 }
          },
        },
      },
    });
  }

  function renderSpO2(labels, values) {
    if (!spo2Ctx) return;
    if (spo2Chart) spo2Chart.destroy();
    spo2Chart = new Chart(spo2Ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "",
            data: values,
            borderColor: "#2ecc71",
            backgroundColor: "transparent",
            borderWidth: 1.5,
            tension: 0.35,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "x",
        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: "index" } },
        scales: {
          y: {
            display: true,
            grid: { color: getGridColor(0.06) },
            ticks: { color: getTickColor() },
            suggestedMin: 88,
            suggestedMax: 100
          },
          x: {
            display: true,
            grid: { color: getGridColor(0.04) },
            ticks: { color: getTickColor(), maxTicksLimit: 6 }
          },
        },
      },
    });
  }

  async function refreshVitals() {
    // Fetch both in parallel
    const [hr, sp] = await Promise.all([fetchHeartRate(), fetchSpO2()]);

    if (hr && hr.labels && hr.values) {
      if (!hrChart) renderHr(hr.labels, hr.values);
      else {
        hrChart.data.labels = hr.labels;
        hrChart.data.datasets[0].data = hr.values;
        hrChart.update("none");
      }
    }

    if (sp && sp.labels && sp.values) {
      if (!spo2Chart) renderSpO2(sp.labels, sp.values);
      else {
        spo2Chart.data.labels = sp.labels;
        spo2Chart.data.datasets[0].data = sp.values;
        spo2Chart.update("none");
      }
    }
  }

  // Append a new mock point and enforce rolling window
  function pushHrMock() {
    const nowLabel = new Date().toLocaleTimeString([], { hour12: false });
    const i = hrLabels.length ? hrLabels.length + 1 : 1;
    const base = 76;
    const next = base + Math.round(6 * Math.sin(i / 6) + 3 * Math.cos(i / 10));
    hrLabels.push(nowLabel);
    hrValues.push(next);
    if (hrLabels.length > MAX_POINTS) {
      hrLabels.shift();
      hrValues.shift();
    }
  }

  function pushSpO2Mock() {
    const nowLabel = new Date().toLocaleTimeString([], { hour12: false });
    const i = spo2Labels.length ? spo2Labels.length + 1 : 1;
    const base = 97;
    const next = base + Math.round(1.2 * Math.sin(i / 12));
    spo2Labels.push(nowLabel);
    spo2Values.push(next);
    if (spo2Labels.length > MAX_POINTS) {
      spo2Labels.shift();
      spo2Values.shift();
    }
  }

  function seedMockSeries() {
    hrLabels = [];
    hrValues = [];
    spo2Labels = [];
    spo2Values = [];
    for (let i = 0; i < MAX_POINTS; i++) {
      pushHrMock();
      pushSpO2Mock();
    }
  }

  // Initial render - fetch from Supabase
  document.addEventListener("DOMContentLoaded", () => {
    MAX_POINTS = computeMaxPoints();
    
    // Wait for shared Supabase client to be available
    function initSupabase() {
      if (window.supabaseClient) {
        supa = window.supabaseClient;
      } else {
        // Retry if client not ready yet
        console.warn('Shared Supabase client not ready yet, retrying...');
        setTimeout(initSupabase, 500);
        return;
      }
      
      // Initial fetch and render
      refreshVitals();
      
      // Set up periodic refresh
      setInterval(refreshVitals, REFRESH_INTERVAL_MS);
      
      // Update chart colors when theme changes
      const observer = new MutationObserver(() => {
        if (hrChart) {
          hrChart.options.scales.x.ticks.color = getTickColor();
          hrChart.options.scales.y.ticks.color = getTickColor();
          hrChart.options.scales.x.grid.color = getGridColor(0.04);
          hrChart.options.scales.y.grid.color = getGridColor(0.06);
          hrChart.update("none");
        }
        if (spo2Chart) {
          spo2Chart.options.scales.x.ticks.color = getTickColor();
          spo2Chart.options.scales.y.ticks.color = getTickColor();
          spo2Chart.options.scales.x.grid.color = getGridColor(0.04);
          spo2Chart.options.scales.y.grid.color = getGridColor(0.06);
          spo2Chart.update("none");
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      
      // Adjust window length on resize
      window.addEventListener("resize", () => {
        const newMax = computeMaxPoints();
        if (newMax !== MAX_POINTS) {
          MAX_POINTS = newMax;
          refreshVitals();
        }
      });
    }
    
    initSupabase();
  });
})();
