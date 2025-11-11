// --- Ensure Supabase and Chart.js are loaded before this file ---

// Initialize Supabase client
const supabaseUrl = "https://bbrleisgatjcrlnxatcc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmxlaXNnYXRqY3JsbnhhdGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTE1NTYsImV4cCI6MjA3ODE2NzU1Nn0.r1YvySsMPFoMZMLhkTNQmDotbL6eIWUoaWN3xv91TuI";

const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

console.log("Supabase client initialized:", supabase);

// Chart contexts (thumbnail and large)
const thumbEl = document.getElementById("tempThumb");
const largeEl = document.getElementById("tempChartLarge");
let thumbCtx = null;
let largeCtx = null;
if (thumbEl) thumbCtx = thumbEl.getContext("2d");
if (largeEl) largeCtx = largeEl.getContext("2d");

let tempThumbChart = null;
let tempLargeChart = null;

// UI elements
const tempCard = document.getElementById("tempCard");
const tempModal = document.getElementById("tempModal");
const openTempBtn = document.getElementById("openTempBtn");
const closeTempModal = document.getElementById("closeTempModal");
const tempStatusEl = document.getElementById("tempStatus");

// state for lazy rendering
let latestLabels = [];
let latestValues = [];
let isNormal = false;
let thumbRendered = false;
let largeRendered = false;
let dateFilterStart = null;
let dateFilterEnd = null;

async function fetchTemperature(startDate = null, endDate = null) {
  try {
    let query = supabase
      .from("temper")
      .select("degree, time")
      .order("time", { ascending: true });
    
    // Apply date filters if provided
    if (startDate) {
      query = query.gte("time", startDate);
    }
    if (endDate) {
      // Add one day to endDate to include the entire end date
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      query = query.lt("time", endDatePlusOne.toISOString());
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Supabase fetch error:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.warn("No data found in table.");
      if (tempStatusEl) tempStatusEl.textContent = "No temperature readings yet.";
      return;
    }

    const labels = data.map((row) => {
      const date = new Date(row.time);
      // Show both date and time when filtering, or just time for all data
      if (startDate || endDate) {
        return date.toLocaleString([], { 
          month: "short", 
          day: "numeric", 
          hour: "2-digit", 
          minute: "2-digit" 
        });
      }
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    });
    const values = data.map((row) => row.degree);

    // Update status based on the last value
    const lastVal = values[values.length - 1];
    if (tempStatusEl) {
      if (lastVal >= 30 && lastVal <= 40) {
        tempStatusEl.textContent = "Your body temperature is normal.";
        tempStatusEl.style.color = "var(--text-secondary)";
      } else if (lastVal > 40 && lastVal <= 50) {
        tempStatusEl.textContent = "Body temperature is higher than usual.";
        tempStatusEl.style.color = "#e07a5f";
      } else if (lastVal > 50) {
        tempStatusEl.textContent = "Temperature is high — please check with a doctor.";
        tempStatusEl.style.color = "#d9534f";
      } else {
        tempStatusEl.textContent = "Temperature reading is out of expected range.";
      }
    }

    // store latest for lazy rendering
    latestLabels = labels;
    latestValues = values;

    // determine normality
    isNormal = lastVal >= 30 && lastVal <= 40;

    // If normal: don't render charts now. They'll be rendered on hover/click.
    // If not normal: render thumbnail immediately and make it visible.
    if (!isNormal) {
      if (tempCard) tempCard.classList.add("visible-thumb");
      // render thumbnail immediately
      renderThumb();
      thumbRendered = true;
    } else {
      if (tempCard) tempCard.classList.remove("visible-thumb");
      // destroy any existing thumbnail to ensure it's not visible
      if (tempThumbChart) {
        tempThumbChart.destroy();
        tempThumbChart = null;
        thumbRendered = false;
      }
      // do not render large chart until opened
    }
  } catch (err) {
    console.error("fetchTemperature error:", err);
  }
}

// Initial fetch and auto-refresh
fetchTemperature();
setInterval(() => {
  fetchTemperature(dateFilterStart, dateFilterEnd);
}, 10000);

// helper to render thumbnail chart
function renderThumb() {
  if (!thumbCtx || !latestValues || latestValues.length === 0) return;
  if (tempThumbChart) tempThumbChart.destroy();
  tempThumbChart = new Chart(thumbCtx, {
    type: "line",
    data: {
      labels: latestLabels,
      datasets: [
        {
          label: "",
          data: latestValues,
          borderColor: "#ff4b5c",
          backgroundColor: "rgba(255,75,92,0.2)",
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { display: false, min: 29 }, x: { display: false } },
    },
  });
}

// helper to render large chart when modal opened
function renderLarge() {
  if (!largeCtx || !latestValues || latestValues.length === 0) return;
  if (tempLargeChart) tempLargeChart.destroy();
  tempLargeChart = new Chart(largeCtx, {
    type: "line",
    data: {
      labels: latestLabels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: latestValues,
          borderColor: "#ff4b5c",
          backgroundColor: "rgba(255,75,92,0.3)",
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true, position: "top" } },
      scales: {
        y: { beginAtZero: false, min: 29 },
        x: { ticks: { autoSkip: true, maxTicksLimit: 8 } },
      },
    },
  });
}

// UI interactions: hover to lazy-render thumbnail (when normal), click to open modal and render large
if (tempCard) {
  tempCard.addEventListener("mouseenter", () => {
    if (isNormal && !thumbRendered) {
      renderThumb();
      thumbRendered = true;
    }
  });

  tempCard.addEventListener("click", (e) => {
    if (tempModal) tempModal.classList.add("active");
    // render large chart lazily
    if (!largeRendered) {
      renderLarge();
      largeRendered = true;
    }
  });
}

if (openTempBtn) {
  openTempBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (tempModal) tempModal.classList.add("active");
    if (!largeRendered) {
      renderLarge();
      largeRendered = true;
    }
  });
}

if (closeTempModal) {
  closeTempModal.addEventListener("click", () => {
    if (tempModal) tempModal.classList.remove("active");
  });
}

if (tempModal) {
  tempModal.addEventListener("click", (e) => {
    if (e.target === tempModal) tempModal.classList.remove("active");
  });
}

// Date filter functionality
const tempStartDateInput = document.getElementById("tempStartDate");
const tempEndDateInput = document.getElementById("tempEndDate");
const applyDateFilterBtn = document.getElementById("applyDateFilter");
const clearDateFilterBtn = document.getElementById("clearDateFilter");

// Set default end date to today and start date to 7 days ago
function setDefaultDates() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  if (tempEndDateInput) {
    tempEndDateInput.value = today.toISOString().split('T')[0];
  }
  if (tempStartDateInput) {
    tempStartDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
  }
}

// Apply date filter
if (applyDateFilterBtn) {
  applyDateFilterBtn.addEventListener("click", async () => {
    const startDate = tempStartDateInput?.value || null;
    const endDate = tempEndDateInput?.value || null;
    
    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date!");
      return;
    }
    
    dateFilterStart = startDate ? new Date(startDate).toISOString() : null;
    dateFilterEnd = endDate ? new Date(endDate).toISOString() : null;
    
    // Fetch filtered data
    await fetchTemperature(dateFilterStart, dateFilterEnd);
    
    // Re-render charts with filtered data
    if (thumbRendered) {
      renderThumb();
    }
    if (largeRendered) {
      renderLarge();
    }
  });
}

// Clear date filter
if (clearDateFilterBtn) {
  clearDateFilterBtn.addEventListener("click", async () => {
    dateFilterStart = null;
    dateFilterEnd = null;
    if (tempStartDateInput) tempStartDateInput.value = "";
    if (tempEndDateInput) tempEndDateInput.value = "";
    
    // Fetch all data
    await fetchTemperature();
    
    // Re-render charts
    if (thumbRendered) {
      renderThumb();
    }
    if (largeRendered) {
      renderLarge();
    }
  });
}

// Initialize default dates when modal opens
if (tempModal) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (tempModal.classList.contains('active')) {
          setDefaultDates();
        }
      }
    });
  });
  observer.observe(tempModal, { attributes: true });
}

// Also set defaults on page load
document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
});
