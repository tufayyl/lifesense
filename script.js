// DOM Elements
const profileBtn = document.getElementById('profileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const profileModal = document.getElementById('profileModal');
const settingsModal = document.getElementById('settingsModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const cancelProfile = document.getElementById('cancelProfile');
const profileForm = document.getElementById('profileForm');
const themeToggle = document.getElementById('themeToggle');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');

// Display elements
const displayName = document.getElementById('displayName');
const displayAge = document.getElementById('displayAge');
const displayHeight = document.getElementById('displayHeight');
const displayWeight = document.getElementById('displayWeight');
const welcomeMessage = document.getElementById('welcomeMessage');
const tempAnalysis = document.getElementById('tempAnalysis');

// Load saved data from localStorage
function loadSavedData() {
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    // Load font size
    const savedFontSize = localStorage.getItem('fontSize') || '16';
    document.body.style.fontSize = savedFontSize + 'px';
    fontSizeSlider.value = savedFontSize;
    fontSizeValue.textContent = savedFontSize;

    // Load profile data
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        document.getElementById('name').value = profile.name || '';
        document.getElementById('age').value = profile.age || '';
        document.getElementById('height').value = profile.height || '';
        document.getElementById('weight').value = profile.weight || '';
        updateDashboard(profile);
    }
}

// Save profile data
function saveProfile(name, age, height, weight) {
    const profile = { name, age, height, weight };
    localStorage.setItem('profile', JSON.stringify(profile));
    updateDashboard(profile);
}

// Update dashboard with profile data
function updateDashboard(profile) {
    if (profile.name) {
        displayName.textContent = profile.name;
        displayAge.textContent = profile.age + ' years';
        displayHeight.textContent = profile.height + ' cm';
        displayWeight.textContent = profile.weight ? profile.weight + ' kg' : '-';
        welcomeMessage.textContent = `Welcome back, ${profile.name}! Here's your health overview.`;
    } else {
        displayName.textContent = '-';
        displayAge.textContent = '-';
        displayHeight.textContent = '-';
        displayWeight.textContent = '-';
        welcomeMessage.textContent = 'Welcome! Please complete your profile to see personalized information.';
    }
}

// Open Profile Modal
profileBtn.addEventListener('click', () => {
    profileModal.classList.add('active');
    // Load current values
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        document.getElementById('name').value = profile.name || '';
        document.getElementById('age').value = profile.age || '';
        document.getElementById('height').value = profile.height || '';
        document.getElementById('weight').value = profile.weight || '';
    }
});

// Close Profile Modal
closeProfileModal.addEventListener('click', () => {
    profileModal.classList.remove('active');
});

cancelProfile.addEventListener('click', () => {
    profileModal.classList.remove('active');
});

// Close modal when clicking outside
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove('active');
    }
});

// Open Settings Modal
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
});

// Close Settings Modal
closeSettingsModal.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

// Handle Profile Form Submission
profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value;
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;

    if (name && age && height && weight) {
        saveProfile(name, age, height, weight);
        profileModal.classList.remove('active');
        
        // Show success message (optional)
        alert('Profile saved successfully!');
    }
});

// Handle Theme Toggle
themeToggle.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// Handle Font Size Change
fontSizeSlider.addEventListener('input', (e) => {
    const fontSize = e.target.value;
    document.body.style.fontSize = fontSize + 'px';
    fontSizeValue.textContent = fontSize;
    localStorage.setItem('fontSize', fontSize);
});

// Health Analysis Functions (Temperature, Heart Rate, SpO2)
async function fetchTemperatureAnalysis() {
    try {
        // Wait for Supabase to be available
        // Use shared Supabase client
        const supabase = window.supabaseClient;
        if (!supabase) {
            console.warn('Supabase client not initialized yet, retrying...');
            setTimeout(fetchTemperatureAnalysis, 1000);
            return;
        }

        // Fetch last 15 temperature readings
        const { data: tempData, error: tempError } = await supabase
            .from("temper")
            .select("degree, time")
            .order("time", { ascending: false })
            .limit(15);

        // Fetch last 10 heart rate and SpO2 readings
        const TIMESTAMP_COLUMN = "created_at";
        const { data: hrData, error: hrError } = await supabase
            .from("heartrate")
            .select(`bpm, spo2, ${TIMESTAMP_COLUMN}`)
            .order(TIMESTAMP_COLUMN, { ascending: false })
            .limit(10);

        if (tempError || hrError) {
            console.error('Supabase error:', tempError || hrError);
            if (tempAnalysis) {
                tempAnalysis.innerHTML = '<div class="temp-analysis-message">Unable to load health data. Please try again later.</div>';
            }
            return;
        }

        // Process temperature data
        let tempAverage = null;
        let tempLatest = null;
        let tempStatus = 'normal';
        let tempStatusText = 'normal';
        
        if (tempData && tempData.length > 0) {
            const reversedData = [...tempData].reverse();
            const tempValues = reversedData.map(row => row.degree);
            tempAverage = tempValues.reduce((sum, val) => sum + val, 0) / tempValues.length;
            tempLatest = tempData[0].degree;
            
            if (tempAverage >= 30 && tempAverage <= 37.5) {
                tempStatus = 'normal';
                tempStatusText = 'normal';
            } else if (tempAverage > 37.5 && tempAverage <= 38.5) {
                tempStatus = 'elevated';
                tempStatusText = 'slightly elevated';
            } else if (tempAverage > 38.5) {
                tempStatus = 'high';
                tempStatusText = 'high';
            } else {
                tempStatus = 'low';
                tempStatusText = 'low';
            }
        }

        // Process heart rate data
        let hrAverage = null;
        let hrLatest = null;
        let hrStatus = 'normal';
        let hrStatusText = 'normal';
        
        if (hrData && hrData.length > 0) {
            const hrValues = hrData.map(row => row.bpm).filter(v => v != null);
            if (hrValues.length > 0) {
                hrAverage = hrValues.reduce((sum, val) => sum + val, 0) / hrValues.length;
                // Latest is first in descending order
                hrLatest = hrData.find(row => row.bpm != null)?.bpm || hrValues[0];
                
                // Normal heart rate: 60-100 bpm for adults
                if (hrAverage >= 60 && hrAverage <= 100) {
                    hrStatus = 'normal';
                    hrStatusText = 'normal';
                } else if (hrAverage > 100 && hrAverage <= 120) {
                    hrStatus = 'elevated';
                    hrStatusText = 'slightly elevated';
                } else if (hrAverage > 120) {
                    hrStatus = 'high';
                    hrStatusText = 'high';
                } else if (hrAverage < 60) {
                    hrStatus = 'low';
                    hrStatusText = 'low';
                }
            }
        }

        // Process SpO2 data
        let spo2Average = null;
        let spo2Latest = null;
        let spo2Status = 'normal';
        let spo2StatusText = 'normal';
        
        if (hrData && hrData.length > 0) {
            const spo2Values = hrData.map(row => row.spo2).filter(v => v != null);
            if (spo2Values.length > 0) {
                spo2Average = spo2Values.reduce((sum, val) => sum + val, 0) / spo2Values.length;
                // Latest is first in descending order
                spo2Latest = hrData.find(row => row.spo2 != null)?.spo2 || spo2Values[0];
                
                // Normal SpO2: 95-100%
                if (spo2Average >= 95 && spo2Average <= 100) {
                    spo2Status = 'normal';
                    spo2StatusText = 'normal';
                } else if (spo2Average >= 90 && spo2Average < 95) {
                    spo2Status = 'low';
                    spo2StatusText = 'low';
                } else if (spo2Average < 90) {
                    spo2Status = 'very low';
                    spo2StatusText = 'very low';
                }
            }
        }

        // Get patient profile for context
        const savedProfile = localStorage.getItem('profile');
        let patientContext = '';
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            patientContext = `Patient: ${profile.name || 'User'}, Age: ${profile.age || 'N/A'}, Height: ${profile.height || 'N/A'} cm, Weight: ${profile.weight || 'N/A'} kg. `;
        }

        // Generate combined AI response
        const aiResponse = await generateHealthAnalysis(
            tempAverage, tempLatest, tempStatusText,
            hrAverage, hrLatest, hrStatusText,
            spo2Average, spo2Latest, spo2StatusText,
            patientContext
        );
        
        // Display the analysis
        if (tempAnalysis) {
            tempAnalysis.innerHTML = `
                <div class="temp-ai-response">
                    <div class="temp-ai-text">${aiResponse}</div>
                </div>
            `;
        }
    } catch (err) {
        console.error('Health analysis error:', err);
        if (tempAnalysis) {
            tempAnalysis.innerHTML = '<div class="temp-analysis-error">Unable to load health analysis. Please try again later.</div>';
        }
    }
}

async function generateHealthAnalysis(
    tempAverage, tempLatest, tempStatus,
    hrAverage, hrLatest, hrStatus,
    spo2Average, spo2Latest, spo2Status,
    patientContext
) {
    try {
        // Build the prompt with all three metrics
        let prompt = `${patientContext}`;
        
        if (tempAverage !== null) {
            prompt += `Temperature: average ${tempAverage.toFixed(2)}°C (latest ${tempLatest.toFixed(2)}°C), status: ${tempStatus}. `;
        }
        
        if (hrAverage !== null) {
            prompt += `Heart Rate: average ${hrAverage.toFixed(0)} bpm (latest ${hrLatest.toFixed(0)} bpm), status: ${hrStatus}. `;
        }
        
        if (spo2Average !== null) {
            prompt += `SpO2: average ${spo2Average.toFixed(1)}% (latest ${spo2Latest.toFixed(1)}%), status: ${spo2Status}. `;
        }
        
        prompt += `Please provide a very brief, friendly, and professional health assessment in exactly 2 short sentences covering all three metrics. Keep it concise and encouraging.`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();
        
        // Fallback response if AI fails
        if (data?.reply) {
            return data.reply;
        }
        
        // Generate fallback message
        let fallbackMessage = '';
        const parts = [];
        
        if (tempAverage !== null) {
            if (tempStatus === 'normal') {
                parts.push(`Temperature is normal (${tempAverage.toFixed(1)}°C)`);
            } else {
                parts.push(`Temperature is ${tempStatus} (${tempAverage.toFixed(1)}°C)`);
            }
        }
        
        if (hrAverage !== null) {
            if (hrStatus === 'normal') {
                parts.push(`heart rate is normal (${hrAverage.toFixed(0)} bpm)`);
            } else {
                parts.push(`heart rate is ${hrStatus} (${hrAverage.toFixed(0)} bpm)`);
            }
        }
        
        if (spo2Average !== null) {
            if (spo2Status === 'normal') {
                parts.push(`SpO2 is normal (${spo2Average.toFixed(1)}%)`);
            } else {
                parts.push(`SpO2 is ${spo2Status} (${spo2Average.toFixed(1)}%)`);
            }
        }
        
        if (parts.length > 0) {
            const allNormal = (tempStatus === 'normal' || tempAverage === null) && 
                             (hrStatus === 'normal' || hrAverage === null) && 
                             (spo2Status === 'normal' || spo2Average === null);
            
            if (allNormal) {
                fallbackMessage = `Your ${parts.join(', ')}. All vitals are within normal ranges. Continue monitoring your health.`;
            } else {
                fallbackMessage = `Your ${parts.join(', ')}. ${parts.some(p => p.includes('high') || p.includes('low') || p.includes('elevated')) ? 'Please monitor your symptoms and consider consulting with a healthcare professional if needed.' : 'Continue monitoring your health.'}`;
            }
        } else {
            fallbackMessage = 'Health data is being collected. Please check back soon.';
        }
        
        return fallbackMessage;
    } catch (err) {
        console.error('AI response error:', err);
        return 'Health assessment is being processed. Please check back in a moment.';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    // Fetch temperature analysis after a short delay to ensure Supabase is loaded
    setTimeout(fetchTemperatureAnalysis, 1500);
    // Refresh analysis every 30 seconds
    setInterval(fetchTemperatureAnalysis, 30000);
});

