document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".card, .servo-section, .chart-container, .tip-card, .container").forEach(el => {
    el.addEventListener("animationend", () => {
      el.classList.add("animated-once");
    }, { once: true });
  });
});

// Global state
let port, reader, buffer = '';
let sessionStart = Date.now();
let dangerEvents = [];
let historicalData = [];
let isConnected = false;
let cookiesAccepted = false;
let currentTheme = 'gradient';

// Audio settings (add after existing global variables)
let audioSettings = {
  masterVolume: 0.5,
  clickSoundEnabled: true,
  clickSoundVolume: 0.3,
  warningLevel1Enabled: true,
  warningLevel1Volume: 0.5,
  warningLevel2Enabled: true,
  warningLevel2Volume: 0.7,
  backgroundMusicEnabled: false,
  backgroundMusicVolume: 0.3,
  backgroundMusicFile: null
};

let backgroundMusic = null;
let lastWarningTime = 0;
const WARNING_COOLDOWN = 3000; // 3 seconds between warnings

// Load audio settings
function loadAudioSettings() {
  const saved = localStorage.getItem('visualAidAudioSettings');
  if (saved) {
    try {
      audioSettings = JSON.parse(saved);
      if (audioSettings.backgroundMusicEnabled && audioSettings.backgroundMusicFile) {
        initializeBackgroundMusic();
      }
    } catch(e) {
      console.error('Failed to load audio settings:', e);
    }
  }
}

// Save audio settings
function saveAudioSettings() {
  localStorage.setItem('visualAidAudioSettings', JSON.stringify(audioSettings));
}

// Audio helper functions
function updateAudioSetting(setting, value) {
  audioSettings[setting] = value;
  saveAudioSettings();
  
  // Update background music volume if it's playing
  if (setting === 'backgroundMusicVolume' || setting === 'masterVolume') {
    updateBackgroundMusicVolume();
  }
}

function toggleAudioSetting(setting) {
  audioSettings[setting] = !audioSettings[setting];
  saveAudioSettings();
}

// Click sound function
function playClickSound() {
  if (!audioSettings.clickSoundEnabled) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    
    const volume = audioSettings.clickSoundVolume * audioSettings.masterVolume;
    gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
    
    audioContext.resume();
  } catch(e) {
    console.error('Click sound error:', e);
  }
}

// Warning sound function
function playWarningSound(level) {
  const now = Date.now();
  if (now - lastWarningTime < WARNING_COOLDOWN) return;
  lastWarningTime = now;
  
  if (level === 1 && !audioSettings.warningLevel1Enabled) return;
  if (level === 2 && !audioSettings.warningLevel2Enabled) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (level === 1) {
      // Level 1: Single beep
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      const volume = audioSettings.warningLevel1Volume * audioSettings.masterVolume;
      gainNode.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (level === 2) {
      // Level 2: Double beep
      oscillator.type = 'square';
      oscillator.frequency.value = 1000;
      const volume = audioSettings.warningLevel2Volume * audioSettings.masterVolume;
      
      // First beep
      gainNode.gain.setValueAtTime(volume * 0.6, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      
      // Second beep
      gainNode.gain.setValueAtTime(volume * 0.6, audioContext.currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
      oscillator.stop(audioContext.currentTime + 0.35);
    }
    
    audioContext.resume();
  } catch(e) {
    console.error('Warning sound error:', e);
  }
}

// Background music functions
function handleMusicFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('audio/')) {
    alert('오디오 파일만 업로드할 수 있습니다.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    audioSettings.backgroundMusicFile = e.target.result;
    saveAudioSettings();
    
    if (audioSettings.backgroundMusicEnabled) {
      initializeBackgroundMusic();
    }
    
    alert('음악 파일이 성공적으로 업로드되었습니다!');
    showDetail('settings'); // Refresh settings page
  };
  reader.readAsDataURL(file);
}

function initializeBackgroundMusic() {
  if (!audioSettings.backgroundMusicFile) return;
  
  // Stop existing music
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic = null;
  }
  
  backgroundMusic = new Audio(audioSettings.backgroundMusicFile);
  backgroundMusic.loop = true;
  updateBackgroundMusicVolume();
  
  if (audioSettings.backgroundMusicEnabled) {
    backgroundMusic.play().catch(e => {
      console.error('Background music play error:', e);
    });
  }
}

function toggleBackgroundMusic() {
  if (audioSettings.backgroundMusicEnabled) {
    if (!backgroundMusic && audioSettings.backgroundMusicFile) {
      initializeBackgroundMusic();
    } else if (backgroundMusic) {
      backgroundMusic.play().catch(e => {
        console.error('Background music play error:', e);
      });
    }
  } else {
    if (backgroundMusic) {
      backgroundMusic.pause();
    }
  }
}

function updateBackgroundMusicVolume() {
  if (backgroundMusic) {
    backgroundMusic.volume = audioSettings.backgroundMusicVolume * audioSettings.masterVolume;
  }
}

// Initialize on load
window.addEventListener('load', function() {
  checkCookieConsent();
  initChart();
  loadTheme();
  loadAudioSettings(); // Add this line
  sessionStart = Date.now();
  updateSessionTime();
  setInterval(updateSessionTime, 1000);
  
  // Add click sound to all clickable elements
  document.addEventListener('click', function(e) {
    if (e.target.matches('button, .card.clickable, .nav-btn, a')) {
      playClickSound();
    }
  });
});

// Cookie Management
function checkCookieConsent() {
  const consent = localStorage.getItem('cookieConsent');
  if (consent === 'accepted') {
    cookiesAccepted = true;
    document.getElementById('cookieConsent').classList.add('hidden');
    loadHistoricalData();
    showComparison();
  } else {
    document.getElementById('cookieConsent').classList.remove('hidden');
  }
}

function acceptCookies() {
  localStorage.setItem('cookieConsent', 'accepted');
  cookiesAccepted = true;
  document.getElementById('cookieConsent').classList.add('hidden');
  loadHistoricalData();
}

function rejectCookies() {
  document.getElementById('cookieConsent').classList.add('hidden');
  cookiesAccepted = false;
}

function loadHistoricalData() {
  const saved = localStorage.getItem('visualAidHistory');
  if (saved) {
    try {
      historicalData = JSON.parse(saved);
      showComparison();
    } catch(e) {
      console.error('Failed to load history:', e);
    }
  }
}

function saveToHistory(data) {
  if (!cookiesAccepted) return;
  
  const newEntry = {
    distance: data.distance,
    lightLevel: data.lightLevel,
    dangerLevel: data.dangerLevel,
    timestamp: Date.now()
  };
  
  historicalData.push(newEntry);
  
  // Keep last 2000 entries
  if (historicalData.length > 2000) {
    historicalData = historicalData.slice(-2000);
  }
  
  localStorage.setItem('visualAidHistory', JSON.stringify(historicalData));
}

// Theme Management
function loadTheme() {
  const saved = localStorage.getItem('visualAidTheme');
  if (saved) {
    currentTheme = saved;
    document.body.setAttribute('data-theme', saved);
    updateThemeButtons();
  }
}

function changeTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('visualAidTheme', theme);
  updateThemeButtons();
  
  // Close the theme selector after selection
  const selector = document.getElementById('themeSelector');
  if (selector) {
    selector.classList.remove('show');
  }
}

function updateThemeButtons() {
  const buttons = document.querySelectorAll('.theme-selector button');
  buttons.forEach(btn => {
    const btnTheme = btn.getAttribute('data-theme');
    if (btnTheme === currentTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Settings button handler
document.querySelector('.settings-btn').addEventListener('click', function() {
  const selector = document.getElementById('themeSelector');
  selector.classList.toggle('show');
});

// Close theme selector when clicking outside
document.addEventListener('click', function(e) {
  const selector = document.getElementById('themeSelector');
  const settingsBtn = document.querySelector('.settings-btn');
  if (!selector.contains(e.target) && !settingsBtn.contains(e.target)) {
    selector.classList.remove('show');
  }
});

// Arduino Connection
document.getElementById("connectBtn").addEventListener("click", async () => {
  try {
    if (!navigator.serial) {
      alert("Web Serial API를 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해주세요.");
      return;
    }
    
    // Request port
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    // Set up text decoder stream
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();
    
    updateConnectionStatus(true);
    console.log("Arduino 연결 성공!");
    
    // Start reading loop
    readLoop();
    
  } catch(error) {
    console.error("연결 오류:", error);
    updateConnectionStatus(false);
    
    let errorMessage = "Arduino 연결에 실패했습니다.\n\n";
    
    if (error.name === 'NotFoundError') {
      errorMessage += "포트를 선택하지 않았거나 취소되었습니다.";
    } else if (error.name === 'NetworkError') {
      errorMessage += "포트가 이미 사용 중이거나 접근할 수 없습니다.\n시리얼 모니터를 닫고 다시 시도하세요.";
    } else if (error.name === 'InvalidStateError') {
      errorMessage += "포트가 이미 열려 있습니다.";
    } else {
      errorMessage += "오류: " + error.message;
    }
    
    alert(errorMessage);
  }
});

function updateConnectionStatus(connected) {
  isConnected = connected;
  const statusBadge = document.getElementById("statusBadge");
  const connectBtn = document.getElementById("connectBtn");
  
  if (connected) {
    statusBadge.innerHTML = "🟢 연결됨";
    statusBadge.classList.add("connected");
    connectBtn.innerHTML = "연결 끊기";
    connectBtn.disabled = false;
    connectBtn.onclick = disconnectArduino;
  } else {
    statusBadge.innerHTML = "🔴 연결 안 됨";
    statusBadge.classList.remove("connected");
    connectBtn.innerHTML = "Arduino 연결";
    connectBtn.disabled = false;
    connectBtn.onclick = null; // Reset to use the original event listener
  }
}

async function disconnectArduino() {
  try {
    if (reader) {
      await reader.cancel();
      reader.releaseLock();
    }
    if (port) {
      await port.close();
    }
    updateConnectionStatus(false);
    console.log("Arduino 연결 해제됨");
    alert("Arduino 연결이 해제되었습니다.");
  } catch(error) {
    console.error("연결 해제 오류:", error);
    updateConnectionStatus(false);
  }
}

async function readLoop() {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("Reader closed");
        break;
      }
      
      buffer += value;
      let lines = buffer.split("\n");
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          processData(line.trim());
        }
      }
    }
  } catch (error) {
    console.error("읽기 오류:", error);
    updateConnectionStatus(false);
    
    if (error.name !== 'NetworkError') {
      alert("데이터 읽기 중 오류가 발생했습니다. 연결을 다시 시도하세요.");
    }
  } finally {
    // Clean up
    if (reader) {
      try {
        reader.releaseLock();
      } catch(e) {
        console.error("Reader release error:", e);
      }
    }
  }
}

function processData(line) {
  if (!line) return;
  
  console.log("Received:", line); // Debug log
  
  try {
    // Try to parse as JSON first
    const data = JSON.parse(line);
    
    if (data.distance !== undefined && data.lightLevel !== undefined && data.dangerLevel !== undefined) {
      updateDisplay(data);
      return;
    }
  } catch(error) {
    // Not JSON, try plain text format
  }
  
  // Try to parse plain text format: "Distance: XX | Light: XXXX"
  const distanceMatch = line.match(/Distance[:\s]+(\d+)/i);
  const lightMatch = line.match(/Light[:\s]+(\d+)/i);
  
  if (distanceMatch && lightMatch) {
    const distance = parseInt(distanceMatch[1]);
    const light = parseInt(lightMatch[1]);
    
    // Calculate danger level based on Arduino thresholds
    let dangerLevel = 0;
    if (distance < 25 || light < 300 || light > 3500) {
      dangerLevel = 2;
    } else if (distance < 40 || light < 500 || light > 3000) {
      dangerLevel = 1;
    }
    
    updateDisplay({
      distance: distance,
      lightLevel: light,
      dangerLevel: dangerLevel
    });
  } else {
    console.log("Could not parse line:", line);
  }
}

function updateDisplay(data) {
  // Update values
  document.getElementById("distance").innerHTML = data.distance || "--";
  document.getElementById("lightLevel").innerHTML = data.lightLevel || "--";

  // Get status info
  const statusInfo = getStatusInfo(data.dangerLevel);
  document.getElementById("statusText").innerHTML = statusInfo.text;
  document.getElementById("recommendation").innerHTML = statusInfo.recommendation;

  // Update card styling
  const statusCard = document.getElementById("statusCard");
  statusCard.className = `card clickable danger-${data.dangerLevel}`;

  // Track danger events
  if (data.dangerLevel > 0) {
    dangerEvents.push({
      level: data.dangerLevel,
      timestamp: Date.now(),
      distance: data.distance,
      light: data.lightLevel
    });
    document.getElementById("dangerCount").innerHTML = dangerEvents.length;

    playWarningSound(data.dangerLevel);
  }

  // Update servo needle
  const servoAngle = calculateServoAngle(data.distance, data.dangerLevel);
  document.getElementById("servoNeedle").style.transform = 
    `translateX(-50%) rotate(${servoAngle}deg)`;

  // Update chart
  updateChart(data.distance, data.lightLevel);
  
  // Save to history
  saveToHistory(data);
}

function getStatusInfo(dangerLevel) {
  switch(dangerLevel) {
    case 0:
      return {
        text: "완벽한 환경입니다! ✅",
        recommendation: "훌륭합니다! 현재 설정은 눈 건강에 최적입니다. 이 상태를 유지하세요!"
      };
    case 1:
      return {
        text: "주의가 필요합니다 ⚠️",
        recommendation: "작은 조정이 필요합니다. 거리나 조명 상태를 확인해주세요."
      };
    case 2:
      return {
        text: "위험한 상태입니다! 🚨",
        recommendation: "즉시 조치가 필요합니다! 지금 바로 자세나 조명을 조정하세요."
      };
    default:
      return {
        text: "연결 대기 중",
        recommendation: "Arduino를 연결하여 눈 건강 모니터링을 시작하세요..."
      };
  }
}

function calculateServoAngle(distance, dangerLevel) {
  // Map distance to angle: closer = more right (positive/red), farther = more left (negative/green)
  // Optimal range (50-80cm) should be near 0 degrees (center-left)
  let angle = 0;
  
  if (distance < 30) {
    angle = 60; // Very close - far right (danger)
  } else if (distance < 40) {
    angle = 45; // Too close - right
  } else if (distance < 50) {
    angle = 20; // A bit close - slightly right
  } else if (distance >= 50 && distance <= 80) {
    // Optimal range - left side (green/safe)
    angle = -30 + ((distance - 50) / 30) * 20; // -30 to -10 degrees
  } else if (distance > 80 && distance <= 100) {
    angle = 0; // Getting far - center
  } else {
    angle = 20; // Too far - slightly right
  }
  
  // Adjust more for danger level 2
  if (dangerLevel === 2 && angle > 0) {
    angle = Math.min(60, angle + 15);
  }
  
  return angle;
}

function updateSessionTime() {
  const elapsed = Date.now() - sessionStart;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  document.getElementById("sessionTime").innerHTML = minutes;
}

// Comparison with historical data
function showComparison() {
  if (!cookiesAccepted || historicalData.length < 50) return;
  
  const section = document.getElementById('comparisonSection');
  section.classList.remove('hidden');
  
  // Calculate averages from last 3 sessions (every 500 data points)
  const sessionSize = 500;
  const recentSessions = [];
  
  for (let i = Math.max(0, historicalData.length - 1500); i < historicalData.length; i += sessionSize) {
    const sessionData = historicalData.slice(i, i + sessionSize);
    if (sessionData.length > 0) {
      const avgDistance = sessionData.reduce((sum, d) => sum + d.distance, 0) / sessionData.length;
      const avgLight = sessionData.reduce((sum, d) => sum + d.lightLevel, 0) / sessionData.length;
      const dangerCount = sessionData.filter(d => d.dangerLevel > 0).length;
      
      recentSessions.push({
        avgDistance: avgDistance.toFixed(1),
        avgLight: avgLight.toFixed(0),
        dangerCount: dangerCount,
        timestamp: sessionData[0].timestamp
      });
    }
  }
  
  const grid = document.getElementById('comparisonGrid');
  grid.innerHTML = '';
  
  recentSessions.forEach((session, idx) => {
    const card = document.createElement('div');
    card.className = 'comparison-card';
    card.innerHTML = `
      <h4>세션 ${idx + 1}</h4>
      <div class="comparison-stat">
        <span>평균 거리:</span>
        <span>${session.avgDistance}cm</span>
      </div>
      <div class="comparison-stat">
        <span>평균 조도:</span>
        <span>${session.avgLight}</span>
      </div>
      <div class="comparison-stat">
        <span>경고 횟수:</span>
        <span>${session.dangerCount}</span>
      </div>
      <div class="comparison-stat">
        <span>날짜:</span>
        <span>${new Date(session.timestamp).toLocaleDateString('ko-KR')}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Page navigation
function showPage(page) {
  if (page === 'settings') {
    showDetail('settings');
  }
}

// Window resize handler
window.addEventListener('resize', function() {
  setTimeout(initChart, 100);
});