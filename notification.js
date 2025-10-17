// Notifications System - v2.2.0
// 20-20-20 Rule and Smart Break Reminders

// Notification settings
let notificationSettings = {
  enabled: false,
  twentyTwentyTwenty: true,
  customBreaks: true,
  breakInterval: 60, // minutes
  breakDuration: 5, // minutes
  soundEnabled: true,
  soundType: 'gentle' // gentle, chime, alert
};

// Timers
let twentyTwentyTwentyTimer = null;
let customBreakTimer = null;
let lastBreakTime = Date.now();
let notificationHistory = [];

// Load settings
function loadNotificationSettings() {
  const saved = localStorage.getItem('visualAidNotifications');
  if (saved) {
    try {
      notificationSettings = JSON.parse(saved);
      if (notificationSettings.enabled) {
        startNotificationSystem();
      }
    } catch(e) {
      console.error('Failed to load notification settings:', e);
    }
  }
}

// Save settings
function saveNotificationSettings() {
  localStorage.setItem('visualAidNotifications', JSON.stringify(notificationSettings));
}

// Toggle notification setting
function toggleSetting(setting) {
  notificationSettings[setting] = !notificationSettings[setting];
  saveNotificationSettings();
  
  // Restart timers if needed
  if (notificationSettings.enabled) {
    stopNotificationSystem();
    startNotificationSystem();
  }
}

// Update notification setting
function updateSetting(setting, value) {
  if (setting === 'breakInterval' || setting === 'breakDuration') {
    notificationSettings[setting] = parseInt(value);
  } else {
    notificationSettings[setting] = value;
  }
  saveNotificationSettings();
  
  // Restart timers if needed
  if (notificationSettings.enabled) {
    stopNotificationSystem();
    startNotificationSystem();
  }
}

// Check notification permission
async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Enable notifications
async function enableNotifications() {
  const hasPermission = await checkNotificationPermission();
  
  if (!hasPermission) {
    alert('알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.');
    return;
  }
  
  notificationSettings.enabled = true;
  saveNotificationSettings();
  startNotificationSystem();
  showDetail('notificationSettings');
  
  alert('알림이 활성화되었습니다!');
}

// Disable notifications
function disableNotifications() {
  notificationSettings.enabled = false;
  saveNotificationSettings();
  stopNotificationSystem();
  showDetail('notificationSettings');
  alert('알림이 비활성화되었습니다.');
}

// Start notification system
function startNotificationSystem() {
  if (!notificationSettings.enabled) return;
  
  // Start 20-20-20 rule timer (every 20 minutes)
  if (notificationSettings.twentyTwentyTwenty) {
    if (twentyTwentyTwentyTimer) clearInterval(twentyTwentyTwentyTimer);
    twentyTwentyTwentyTimer = setInterval(() => {
      show202020Reminder();
    }, 20 * 60 * 1000); // 20 minutes
  }
  
  // Start custom break timer
  if (notificationSettings.customBreaks) {
    if (customBreakTimer) clearInterval(customBreakTimer);
    customBreakTimer = setInterval(() => {
      showCustomBreakReminder();
    }, notificationSettings.breakInterval * 60 * 1000);
  }
}

// Stop notification system
function stopNotificationSystem() {
  if (twentyTwentyTwentyTimer) {
    clearInterval(twentyTwentyTwentyTimer);
    twentyTwentyTwentyTimer = null;
  }
  if (customBreakTimer) {
    clearInterval(customBreakTimer);
    customBreakTimer = null;
  }
}

// Show notification
function showNotification(title, body, type = 'info') {
  if (!notificationSettings.enabled) return;
  
  // Browser notification
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: '👁️',
      badge: '👁️',
      tag: 'visual-aid-' + type,
      requireInteraction: false,
      silent: !notificationSettings.soundEnabled
    });
    
    notification.onclick = function() {
      window.focus();
      notification.close();
    };
    
    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  }
  
  // In-app notification banner
  showInAppBanner(title, body, type);
}

// Show in-app notification banner
// Show in-app notification banner (prevents stacking)
function showInAppBanner(title, body, type) {
  // Remove any existing banners of the same type
  const existingBanner = document.querySelector(`.notification-banner.${type}`);
  if (existingBanner) {
    existingBanner.remove();
  }
  
  const banner = document.createElement('div');
  banner.className = 'notification-banner ' + type;
  banner.style.position = 'fixed';
  banner.style.top = '100px';
  banner.style.right = '20px';
  banner.style.zIndex = '2000';
  
  banner.innerHTML = `
    <div class="notification-banner-content">
      <strong>${title}</strong>
      <p>${body}</p>
    </div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.5em; cursor: pointer; padding: 0 10px;">×</button>
  `;
  
  document.body.appendChild(banner);
  
  // Fade in
  setTimeout(() => banner.classList.add('show'), 10);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
  }, 5000);
}

// Play notification sound
// Play notification sound
// Play notification sound
function playNotificationSound() {
  if (!notificationSettings.soundEnabled) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    
    switch(notificationSettings.soundType) {
      case 'gentle':
        oscillator.frequency.value = 523.25;
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'chime':
        oscillator.frequency.value = 659.25;
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'alert':
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
    }
    
    // Resume audio context (required by some browsers)
    audioContext.resume();
    
  } catch(e) {
    console.error('Sound error:', e);
    alert('소리 재생 오류: ' + e.message);
  }
}
// Your existing createNotificationSettingsPage() function goes here...

// Create notification settings page with integrated history
// Create notification settings page with integrated history
function createNotificationSettingsPage() {
  loadNotificationSettings();
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">🔔 스마트 알림 설정</h2>
      
      <div style="max-width: 900px; margin: 0 auto;">
        <div class="detail-card">
          <div style="background: ${notificationSettings.enabled ? 'rgba(0,255,136,0.2)' : 'rgba(255,71,87,0.2)'}; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; border-left: 4px solid ${notificationSettings.enabled ? '#00ff88' : '#ff4757'};">
            <h3 style="margin-bottom: 12px; font-size: 1.3em;">알림 상태: ${notificationSettings.enabled ? '✅ 활성화됨' : '❌ 비활성화됨'}</h3>
            <button onclick="${notificationSettings.enabled ? 'disableNotifications()' : 'enableNotifications()'}" 
                    style="background: linear-gradient(45deg, ${notificationSettings.enabled ? '#ff4757, #ff6b6b' : '#00ff88, #00ccff'}); color: white; border: none; padding: 10px 25px; border-radius: 10px; font-size: 1em; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
              ${notificationSettings.enabled ? '알림 끄기' : '알림 켜기'}
            </button>
          </div>
          
          <div style="display: grid; gap: 20px;">
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
              <label style="display: flex; align-items: center; cursor: pointer; font-size: 1.05em; font-weight: bold; margin-bottom: 8px;">
                <input type="checkbox" id="enable202020" ${notificationSettings.twentyTwentyTwenty ? 'checked' : ''} 
                       onchange="toggleSetting('twentyTwentyTwenty'); updateNotificationDisplay()"
                       style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
                <span>👁️ 20-20-20 규칙 알림</span>
              </label>
              <p style="opacity: 0.8; margin-left: 32px; font-size: 0.95em;">20분마다 20초 동안 6미터 떨어진 곳을 보라고 알림</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
              <label style="display: flex; align-items: center; cursor: pointer; font-size: 1.05em; font-weight: bold; margin-bottom: 8px;">
                <input type="checkbox" id="enableCustomBreaks" ${notificationSettings.customBreaks ? 'checked' : ''} 
                       onchange="toggleSetting('customBreaks'); updateNotificationDisplay()"
                       style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
                <span>⏰ 맞춤형 휴식 알림</span>
              <p style="opacity: 0.8; margin-left: 32px; margin-bottom: 15px; font-size: 0.95em;">사용자 지정 간격으로 휴식 시간 알림</p>
              
              <div style="margin-left: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="display: block; margin-bottom: 6px; opacity: 0.9; font-size: 0.9em;">휴식 알림 간격 (분)</label>
                  <input type="number" id="breakInterval" value="${notificationSettings.breakInterval}" 
                         min="15" max="180" step="5"
                         onchange="updateSetting('breakInterval', this.value); updateNotificationDisplay()"
                         style="width: 100%; padding: 8px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.3); color: white;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 6px; opacity: 0.9; font-size: 0.9em;">권장 휴식 시간 (분)</label>
                  <input type="number" id="breakDuration" value="${notificationSettings.breakDuration}" 
                         min="1" max="30" step="1"
                         onchange="updateSetting('breakDuration', this.value); updateNotificationDisplay()"
                         style="width: 100%; padding: 8px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.3); color: white;">
                </div>
              </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
              <label style="display: flex; align-items: center; cursor: pointer; font-size: 1.05em; font-weight: bold; margin-bottom: 8px;">
                <input type="checkbox" id="enableSound" ${notificationSettings.soundEnabled ? 'checked' : ''} 
                       onchange="toggleSetting('soundEnabled'); updateNotificationDisplay()"
                       style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
                <span>🔊 알림 소리</span>
              </label>
              <p style="opacity: 0.8; margin-left: 32px; margin-bottom: 15px; font-size: 0.95em;">알림 시 소리 재생</p>
              
              <div style="margin-left: 32px; display: flex; gap: 10px; align-items: center;">
                <select id="soundType" onchange="updateSetting('soundType', this.value); updateNotificationDisplay()" 
                        style="flex: 1; padding: 8px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.3); color: white; cursor: pointer;">
                  <option value="gentle" ${notificationSettings.soundType === 'gentle' ? 'selected' : ''}>부드러운 알림</option>
                  <option value="chime" ${notificationSettings.soundType === 'chime' ? 'selected' : ''}>차임벨</option>
                  <option value="alert" ${notificationSettings.soundType === 'alert' ? 'selected' : ''}>경고음</option>
                </select>
                <button onclick="testSound()" 
                        style="background: rgba(116,185,255,0.3); color: white; border: 2px solid #74b9ff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Gowun Dodum', sans-serif; white-space: nowrap;">
                  🎵 테스트
                </button>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 25px; padding: 20px; background: rgba(116,185,255,0.1); border-radius: 12px; border-left: 4px solid #74b9ff;">
            <h4 style="color: #74b9ff; margin-bottom: 12px; font-size: 1.1em;">💡 알림 사용 팁</h4>
            <ul style="list-style: none; padding: 0; opacity: 0.9; line-height: 1.7; font-size: 0.95em;">
              <li style="padding: 4px 0;">• 20-20-20 규칙은 눈의 피로를 줄이는 검증된 방법입니다</li>
              <li style="padding: 4px 0;">• 장시간 작업 시 1시간마다 5-10분 휴식을 권장합니다</li>
              <li style="padding: 4px 0;">• 알림을 무시하지 말고 실천하는 것이 중요합니다</li>
              <li style="padding: 4px 0;">• 브라우저 알림이 차단된 경우 브라우저 설정을 확인하세요</li>
            </ul>
          </div>
        </div>

        <!-- Notification History Section -->
        <div class="detail-card" style="margin-top: 25px;">
          <h3 style="margin-bottom: 20px; font-size: 1.5em; text-align: center;">📜 알림 히스토리</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">
            <div class="stat-box-detail" style="border-left: 4px solid #74b9ff; padding: 20px;">
              <div class="stat-number" style="font-size: 2.5em;">${notificationHistory.length}</div>
              <div class="stat-label">전체 알림</div>
            </div>
            <div class="stat-box-detail" style="border-left: 4px solid #00ff88; padding: 20px;">
              <div class="stat-number" style="font-size: 2.5em;">${notificationHistory.filter(n => n.type === '20-20-20').length}</div>
              <div class="stat-label">20-20-20</div>
            </div>
            <div class="stat-box-detail" style="border-left: 4px solid #ffa500; padding: 20px;">
              <div class="stat-number" style="font-size: 2.5em;">${notificationHistory.filter(n => n.type === 'break').length}</div>
              <div class="stat-label">휴식 알림</div>
            </div>
          </div>
          
          <div>
            <h4 style="margin-bottom: 15px;">최근 알림 (최대 20개)</h4>
            ${notificationHistory.length === 0 ? 
              '<p style="text-align: center; opacity: 0.7; padding: 20px;">아직 알림이 없습니다.</p>' :
              `<div style="max-height: 350px; overflow-y: auto;">
                ${notificationHistory.slice(-20).reverse().map(notif => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid ${notif.type === '20-20-20' ? '#74b9ff' : '#ffa500'}; gap: 10px;">
                    <div style="flex: 1; min-width: 0;">
                      <strong style="font-size: 0.95em;">${notif.title}</strong>
                      <p style="opacity: 0.8; margin-top: 4px; font-size: 0.9em;">${notif.body}</p>
                    </div>
                    <span style="opacity: 0.6; white-space: nowrap; font-size: 0.85em;">
                      ${new Date(notif.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                `).join('')}
              </div>`
            }
          </div>
          
          ${notificationHistory.length > 0 ? `
            <div style="text-align: center; margin-top: 20px;">
              <button onclick="clearNotificationHistory()" 
                      style="background: rgba(255,71,87,0.2); color: #ff4757; border: 2px solid #ff4757; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
                🗑️ 히스토리 삭제
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Helper function to update the display without reloading the page
function updateNotificationDisplay() {
  // This will be called after settings change to refresh the display
  if (document.querySelector('.detail-title')?.textContent.includes('알림 설정')) {
    showDetail('notificationSettings');
  }
}


// Clear notification history (add if not exists)
function clearNotificationHistory() {
  if (confirm('알림 히스토리를 삭제하시겠습니까?')) {
    notificationHistory = [];
    localStorage.removeItem('visualAidNotificationHistory');
    showDetail('notificationSettings');
    alert('알림 히스토리가 삭제되었습니다.');
  }
}

// Save notification history to localStorage
function saveNotificationHistory() {
  localStorage.setItem('visualAidNotificationHistory', JSON.stringify(notificationHistory));
}

// Load notification history from localStorage
function loadNotificationHistory() {
  const saved = localStorage.getItem('visualAidNotificationHistory');
  if (saved) {
    try {
      notificationHistory = JSON.parse(saved);
    } catch(e) {
      console.error('Failed to load notification history:', e);
    }
  }
}

// Update the notification functions to save history
function show202020Reminder() {
  const title = '👁️ 20-20-20 규칙 알림';
  const body = '20초 동안 6미터 떨어진 곳을 바라보세요!';
  
  showNotification(title, body, 'info');
  playNotificationSound();
  
  // Add to history
  notificationHistory.push({
    type: '20-20-20',
    timestamp: Date.now(),
    title: title,
    body: body
  });
  
  // Keep last 100 notifications
  if (notificationHistory.length > 100) {
    notificationHistory = notificationHistory.slice(-100);
  }
  
  saveNotificationHistory();
}

// Test sound function (fixes AudioContext user interaction requirement)
function testSound() {
  playNotificationSound();
  showInAppBanner('🎵 소리 테스트', '알림 소리가 재생되었습니다!', 'success');
}

function showCustomBreakReminder() {
  const title = '⏰ 휴식 시간';
  const body = `${notificationSettings.breakDuration}분 동안 휴식을 취하세요!`;
  
  showNotification(title, body, 'break');
  playNotificationSound();
  lastBreakTime = Date.now();
  
  // Add to history
  notificationHistory.push({
    type: 'break',
    timestamp: Date.now(),
    title: title,
    body: body
  });
  
  if (notificationHistory.length > 100) {
    notificationHistory = notificationHistory.slice(-100);
  }
  
  saveNotificationHistory();
}

// Initialize on load - add to existing window load listener
window.addEventListener('load', function() {
  loadNotificationSettings();
  loadNotificationHistory();
  
  // Show notification modal after 30 seconds if not enabled and has data
  setTimeout(() => {
    if (!notificationSettings.enabled && historicalData && historicalData.length > 100) {
      showNotificationModal();
    }
  }, 30000);
});