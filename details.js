let detailRefreshInterval = null;

function showDetail(type) {
  playClickSound(); // Add this line
  
  const detailPages = document.getElementById('detailPages');
  const mainPage = document.getElementById('mainPage');

  mainPage.classList.add('hidden');
  detailPages.classList.remove('hidden');

  if (detailRefreshInterval) {
    clearInterval(detailRefreshInterval);
  }

  function renderDetail(animated = false) {
    let html = '';
    switch(type) {
      case 'status': html = createStatusDetail(); break;
      case 'distance': html = createDistanceDetail(); break;
      case 'light': html = createLightDetail(); break;
      case 'alerts': html = createAlertsDetail(); break;
      case 'settings': html = createSettingsPage(); break;
      case 'changelog': html = createChangelogPage(); break;
      case 'weeklyReport': html = createWeeklyReportPage(); break;
      case 'monthlyReport': html = createMonthlyReportPage(); break;
      case 'goals': html = createGoalsPage(); break;
      case 'notificationSettings': html = createNotificationSettingsPage(); break;
      default: html = '<div class="detail-page"><p>ERROR 404: 페이지를 찾을 수 없습니다.</p></div>';
    }
    detailPages.innerHTML = html;

    const page = detailPages.querySelector('.detail-page');
    if (page && animated) {
      page.classList.add('animated');
      setTimeout(() => page.classList.remove('animated'), 600);
    }
  }

  renderDetail(true);

  if (type === 'status' || type === 'distance' || type === 'light' || type === 'alerts') {
    detailRefreshInterval = setInterval(() => renderDetail(false), 2000);
  }

  initDetailCharts(type);
}

function hideDetail() {
  playClickSound(); // Add this line
  
  if (detailRefreshInterval) {
    clearInterval(detailRefreshInterval);
    detailRefreshInterval = null;
  }

  const detailPages = document.getElementById('detailPages');
  const mainPage = document.getElementById('mainPage');

  detailPages.classList.add('hidden');
  mainPage.classList.remove('hidden');
}

function createStatusDetail() {
  const currentDistance = parseInt(document.getElementById('distance').textContent) || 0;
  const currentLight = parseInt(document.getElementById('lightLevel').textContent) || 0;
  const dangerLevel = parseInt(document.getElementById('statusCard').className.match(/danger-(\d)/)?.[1] || 0);
  const statusInfo = getStatusInfo(dangerLevel);
  
  const sessionMinutes = Math.floor((Date.now() - sessionStart) / 60000);
  const sessionSeconds = Math.floor((Date.now() - sessionStart) / 1000) % 60;
  const sessionHours = Math.floor(sessionMinutes / 60);
  const displayMinutes = sessionMinutes % 60;
  
  // Generate specific advice based on ACTUAL current values
  let adviceList = [];
  if (currentDistance > 0) {
    if (currentDistance < 40) adviceList.push('⚠️ 화면과의 거리를 최소 50cm 이상 유지하세요 (현재: ' + currentDistance + 'cm)');
    if (currentDistance > 80) adviceList.push('⚠️ 화면이 너무 멉니다. 50-70cm 범위로 조정하세요 (현재: ' + currentDistance + 'cm)');
  }
  
  if (currentLight > 0) {
    if (currentLight < 500) adviceList.push('💡 주변 조명이 너무 어둡습니다. 추가 조명을 켜주세요 (현재: ' + currentLight + ')');
    if (currentLight < 300) adviceList.push('🚨 조명이 매우 어둡습니다! 즉시 조명을 켜주세요');
  }
  
  if (adviceList.length === 0) {
    adviceList.push('✅ 현재 설정이 완벽합니다! 이 상태를 유지하세요');
    adviceList.push('💚 거리: ' + currentDistance + 'cm (최적 범위)');
    adviceList.push('💡 조도: ' + currentLight + ' (적절한 밝기)');
  }
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">현재 상황 상세 정보</h2>
      
      <div class="detail-card">
        <h3 style="color: ${statusInfo.text.includes('완벽') ? '#00ff88' : statusInfo.text.includes('주의') ? '#ffa500' : '#ff4757'}; margin-bottom: 20px; font-size: 2em;">
          ${statusInfo.text}
        </h3>
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">위험도 레벨</span>
            <span class="detail-value" style="color: ${dangerLevel === 0 ? '#00ff88' : dangerLevel === 1 ? '#ffa500' : '#ff4757'};">${dangerLevel}/2</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">세션 시간</span>
            <span class="detail-value" style="font-size: 1.5em;">${sessionHours > 0 ? sessionHours + '시간 ' : ''}${displayMinutes}분 ${sessionSeconds}초</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">현재 거리</span>
            <span class="detail-value" style="color: ${currentDistance >= 50 && currentDistance <= 80 ? '#00ff88' : '#ffa500'};">${currentDistance}cm</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">현재 조도</span>
            <span class="detail-value" style="color: ${currentLight >= 500 ? '#00ff88' : '#ffa500'};">${currentLight}</span>
          </div>
        </div>

        <div class="recommendation-box">
          <h4 style="margin-bottom: 15px; color: #74b9ff;">💡 권장사항</h4>
          <p style="line-height: 1.8; font-size: 1.1em;">${statusInfo.recommendation}</p>
        </div>

        <div class="detail-advice">
          <h4 style="margin-bottom: 15px;">🎯 실시간 조언</h4>
          <ul style="list-style: none; padding: 0;">
            ${adviceList.map(advice => `<li class="advice-item">${advice}</li>`).join('')}
          </ul>
        </div>
        
        <div class="health-tips">
          <h4 style="margin-bottom: 15px; color: #00ff88;">💚 건강 팁</h4>
          <ul style="list-style: none; padding: 0;">
            <li class="advice-item">• 1시간마다 5-10분씩 휴식을 취하세요</li>
            <li class="advice-item">• 화면을 볼 때 의식적으로 눈을 깜빡이세요</li>
            <li class="advice-item">• 건조함을 느끼면 인공눈물을 사용하세요</li>
            <li class="advice-item">• 정기적으로 안과 검진을 받으세요</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: rgba(116,185,255,0.1); border-radius: 15px;">
          <p style="opacity: 0.8; font-size: 0.95em;">
            ℹ️ 이 데이터는 실시간으로 업데이트됩니다.<br>
            총 경고 횟수: <strong>${dangerEvents.length}</strong>
          </p>
        </div>
      </div>
    </div>
  `;
}


function createDistanceDetail() {
  const currentDistance = document.getElementById('distance').textContent;
  const distValue = currentDistance !== '--' ? parseInt(currentDistance) : 60;
  
  // Calculate distance quality score
  let distanceScore = 0;
  let distanceGrade = '';
  let distanceColor = '';
  
  if (distValue >= 50 && distValue <= 80) {
    distanceScore = 100;
    distanceGrade = '최적';
    distanceColor = '#00ff88';
  } else if (distValue >= 40 && distValue < 50) {
    distanceScore = 70;
    distanceGrade = '양호';
    distanceColor = '#ffa500';
  } else if (distValue > 80 && distValue <= 100) {
    distanceScore = 60;
    distanceGrade = '주의';
    distanceColor = '#ffa500';
  } else {
    distanceScore = 30;
    distanceGrade = '위험';
    distanceColor = '#ff4757';
  }
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">📏 거리 상세 분석</h2>
      
      <div class="detail-card">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 35px; padding: 30px 20px; background: ${distanceColor}15; border-radius: 15px; border-top: 3px solid ${distanceColor};">
          <div style="font-size: 3.5em; font-weight: bold; color: ${distanceColor}; margin-bottom: 10px;">
            ${currentDistance} <small style="font-size: 0.4em; opacity: 0.8;">cm</small>
          </div>
          <div style="display: inline-block; padding: 8px 24px; background: ${distanceColor}20; border-radius: 20px;">
            <span style="font-size: 1.4em; color: ${distanceColor}; font-weight: bold;">${distanceGrade} (${distanceScore}점)</span>
          </div>
        </div>
        
        <!-- Visual Indicator -->
        <div style="margin: 30px 0; padding: 25px; background: rgba(255,255,255,0.05); border-radius: 15px;">
          <h4 style="text-align: center; margin-bottom: 20px;">📊 현재 위치</h4>
          <div style="position: relative; height: 50px; background: linear-gradient(90deg, #ff4757 0%, #ffa500 33%, #00ff88 42%, #00ff88 67%, #ffa500 75%); border-radius: 25px;">
            <div style="position: absolute; left: ${Math.min(95, (distValue / 120) * 100)}%; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border-radius: 50%; border: 3px solid ${distanceColor}; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"></div>
            <div style="position: absolute; bottom: -22px; left: 42%; transform: translateX(-50%); font-size: 0.75em; font-weight: bold; color: #00ff88;">50-80cm</div>
          </div>
        </div>
        
        <!-- Range Guide -->
        <div class="distance-ranges">
          <h4 style="margin-bottom: 20px;">거리 범위 기준</h4>
          
          <div class="range-item ${distValue < 40 ? 'active' : ''}" style="background: rgba(255,71,87,0.2); border-left: 4px solid #ff4757; padding: 16px; margin-bottom: 12px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #ff4757; font-size: 1.1em; display: block; margin-bottom: 6px;">40cm 미만: 위험</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">눈의 피로가 급격히 증가하고 근시가 진행될 수 있습니다.</p>
          </div>
          
          <div class="range-item ${distValue >= 40 && distValue < 50 ? 'active' : ''}" style="background: rgba(255,165,0,0.2); border-left: 4px solid #ffa500; padding: 16px; margin-bottom: 12px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #ffa500; font-size: 1.1em; display: block; margin-bottom: 6px;">40-50cm: 주의</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">장시간 사용 시 눈의 피로를 느낄 수 있습니다.</p>
          </div>
          
          <div class="range-item ${distValue >= 50 && distValue <= 80 ? 'active' : ''}" style="background: rgba(0,255,136,0.2); border-left: 4px solid #00ff88; padding: 16px; margin-bottom: 12px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #00ff88; font-size: 1.1em; display: block; margin-bottom: 6px;">50-80cm: 최적</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">눈 건강에 가장 이상적인 거리입니다.</p>
          </div>
          
          <div class="range-item ${distValue > 80 ? 'active' : ''}" style="background: rgba(255,165,0,0.2); border-left: 4px solid #ffa500; padding: 16px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #ffa500; font-size: 1.1em; display: block; margin-bottom: 6px;">80cm 초과: 주의</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">화면을 보기 위해 자세가 나빠질 수 있습니다.</p>
          </div>
        </div>
        
        <!-- Tips -->
        <div style="margin-top: 30px; background: rgba(116,185,255,0.2); padding: 20px; border-radius: 15px;">
          <h4 style="color: #74b9ff; margin-bottom: 15px;">💡 거리 조절 방법</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; line-height: 1.6;">• 팔을 쭉 뻗었을 때 손가락 끝이 화면에 닿는 정도가 적당합니다</li>
            <li style="padding: 8px 0; line-height: 1.6;">• 모니터 스탠드나 책을 활용해 높이와 거리를 조절하세요</li>
            <li style="padding: 8px 0; line-height: 1.6;">• 의자의 위치를 조절하여 적정 거리를 유지하세요</li>
            <li style="padding: 8px 0; line-height: 1.6;">• 노트북 사용 시 외장 키보드를 사용하면 거리 확보에 도움됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function createLightDetail() {
  const currentLight = document.getElementById('lightLevel').textContent;
  const lightValue = currentLight !== '--' ? parseInt(currentLight) : 500;
  
  let lightScore = 0;
  let lightGrade = '';
  let lightColor = '';
  
  if (lightValue >= 600 && lightValue <= 900) {
    lightScore = 100;
    lightGrade = '최적';
    lightColor = '#00ff88';
  } else if ((lightValue >= 400 && lightValue < 600) || (lightValue > 900 && lightValue <= 1023)) {
    lightScore = 60;
    lightGrade = '주의';
    lightColor = '#ffa500';
  } else {
    lightScore = 30;
    lightGrade = '위험';
    lightColor = '#ff4757';
  }
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">💡 조도 상세 분석</h2>
      
      <div class="detail-card">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 35px; padding: 30px 20px; background: ${lightColor}15; border-radius: 15px; border-top: 3px solid ${lightColor};">
          <div style="font-size: 3.5em; font-weight: bold; color: ${lightColor}; margin-bottom: 10px;">
            ${currentLight}
          </div>
          <div style="display: inline-block; padding: 8px 24px; background: ${lightColor}20; border-radius: 20px;">
            <span style="font-size: 1.4em; color: ${lightColor}; font-weight: bold;">${lightGrade} (${lightScore}점)</span>
          </div>
          <p style="opacity: 0.7; margin-top: 12px; font-size: 0.9em;">ADC 값 (0–1023)</p>
        </div>
        
        <!-- Visual Indicator -->
        <div style="margin: 30px 0; padding: 25px; background: rgba(255,255,255,0.05); border-radius: 15px;">
          <h4 style="text-align: center; margin-bottom: 20px;">📊 현재 밝기</h4>
          <div style="position: relative; height: 50px; background: linear-gradient(90deg, #ff4757 0%, #ffa500 39%, #00ff88 59%, #00ff88 88%, #ffa500 88%); border-radius: 25px;">
            <div style="position: absolute; left: ${Math.min(95, (lightValue / 1023) * 100)}%; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border-radius: 50%; border: 3px solid ${lightColor}; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"></div>
            <div style="position: absolute; bottom: -22px; left: 59%; transform: translateX(-50%); font-size: 0.75em; font-weight: bold; color: #00ff88;">600-900</div>
          </div>
        </div>
        
        <!-- Range Guide -->
        <div class="light-ranges">
          <h4 style="margin-bottom: 20px;">조도 범위 기준</h4>
          
          <div class="range-item ${lightValue < 400 ? 'active' : ''}" style="background: rgba(255,71,87,0.2); border-left: 4px solid #ff4757; padding: 16px; margin-bottom: 12px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #ff4757; font-size: 1.1em; display: block; margin-bottom: 6px;">400 미만: 너무 어두움</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">어두운 환경에서 화면을 보면 눈의 피로가 급격히 증가합니다.</p>
          </div>
          
          <div class="range-item ${lightValue >= 400 && lightValue < 600 ? 'active' : ''}" style="background: rgba(255,165,0,0.2); border-left: 4px solid #ffa500; padding: 16px; margin-bottom: 12px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #ffa500; font-size: 1.1em; display: block; margin-bottom: 6px;">400–600: 약간 어두움</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">사용 가능하지만 추가 조명을 켜는 것이 좋습니다.</p>
          </div>
          
          <div class="range-item ${lightValue >= 600 && lightValue <= 900 ? 'active' : ''}" style="background: rgba(0,255,136,0.2); border-left: 4px solid #00ff88; padding: 16px; margin-bottom: 12px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #00ff88; font-size: 1.1em; display: block; margin-bottom: 6px;">600–900: 최적</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">눈 건강에 가장 이상적인 조도입니다.</p>
          </div>
          
          <div class="range-item ${lightValue > 900 ? 'active' : ''}" style="background: rgba(255,165,0,0.2); border-left: 4px solid #ffa500; padding: 16px; border-radius: 12px; transition: all 0.3s ease;">
            <strong style="color: #ffa500; font-size: 1.1em; display: block; margin-bottom: 6px;">900–1023: 약간 밝음</strong>
            <p style="line-height: 1.5; opacity: 0.95; margin: 0;">눈부심을 느낄 수 있습니다. 조명을 조절하세요.</p>
          </div>
        </div>
        
        <!-- Tips -->
        <div style="margin-top: 30px; background: rgba(116,185,255,0.2); padding: 20px; border-radius: 15px;">
          <h4 style="color: #74b9ff; margin-bottom: 15px;">💡 조명 최적화 방법</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; line-height: 1.6;">• 화면 밝기를 주변 환경에 맞춰 조절하세요</li>
            <li style="padding: 8px 0; line-height: 1.6;">• 간접 조명을 활용하여 눈부심을 줄이세요</li>
            <li style="padding: 8px 0; line-height: 1.6;">• 창문이 화면에 반사되지 않도록 블라인드를 조절하세요</li>
            <li style="padding: 8px 0; line-height: 1.6;">• 야간에는 따뜻한 색온도(2700–3000K)의 조명을 사용하세요</li>
            <li style="padding: 8px 0; line-height: 1.6;">• 모니터 뒤에 백라이트를 설치하면 눈의 피로가 감소합니다</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function createAlertsDetail() {
  const now = Date.now();
  const lastSecond = dangerEvents.filter(e => now - e.timestamp < 1000);
  const lastMinute = dangerEvents.filter(e => now - e.timestamp < 60000);
  const lastHour = dangerEvents.filter(e => now - e.timestamp < 3600000);
  
  // Count by level
  const alertsByLevel = dangerEvents.reduce((acc, event) => {
    acc[event.level] = (acc[event.level] || 0) + 1;
    return acc;
  }, {});
  
  const level1Count = alertsByLevel[1] || 0;
  const level2Count = alertsByLevel[2] || 0;
  
  // Generate alert history HTML
  const recentAlerts = dangerEvents.slice(-30).reverse().map((event, idx) => `
    <div class="alert-record" style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; flex-wrap: wrap; gap: 10px;">
      <span style="color: ${event.level === 1 ? '#ffa500' : '#ff4757'}; font-weight: bold;">
        레벨 ${event.level}
      </span>
      <span>${new Date(event.timestamp).toLocaleTimeString('ko-KR')}</span>
      <span style="font-size: 0.9em; opacity: 0.8;">거리: ${event.distance}cm | 조도: ${event.light}</span>
    </div>
  `).join('') || '<p style="text-align: center; opacity: 0.7;">아직 경고가 발생하지 않았습니다.</p>';
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">📊 경고 상세 분석</h2>
      
      <div class="stats-grid-detail">
        <div class="stat-box-detail" style="border-left: 4px solid #ff4757;">
          <div class="stat-number">${lastSecond.length}</div>
          <div class="stat-label">최근 1초</div>
        </div>
        <div class="stat-box-detail" style="border-left: 4px solid #ffa500;">
          <div class="stat-number">${lastMinute.length}</div>
          <div class="stat-label">최근 1분</div>
        </div>
        <div class="stat-box-detail" style="border-left: 4px solid #00ff88;">
          <div class="stat-number">${lastHour.length}</div>
          <div class="stat-label">최근 1시간</div>
        </div>
        <div class="stat-box-detail" style="border-left: 4px solid #74b9ff;">
          <div class="stat-number">${dangerEvents.length}</div>
          <div class="stat-label">전체 경고</div>
        </div>
      </div>

      <div class="detail-card">
        <h3 style="margin-bottom: 20px;">경고 레벨별 분포</h3>
        <div style="display: flex; gap: 30px; justify-content: space-around; flex-wrap: wrap;">
          <div class="level-box" style="text-align: center;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background: #ffa500; display: flex; align-items: center; justify-content: center; font-size: 2.5em; font-weight: bold; margin: 0 auto 15px; box-shadow: 0 5px 20px rgba(255,165,0,0.5);">
              ${level1Count}
            </div>
            <div style="font-size: 1.2em; font-weight: bold;">레벨 1 (주의)</div>
            <div style="opacity: 0.8; margin-top: 5px;">경미한 위험</div>
          </div>
          <div class="level-box" style="text-align: center;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background: #ff4757; display: flex; align-items: center; justify-content: center; font-size: 2.5em; font-weight: bold; margin: 0 auto 15px; box-shadow: 0 5px 20px rgba(255,71,87,0.5);">
              ${level2Count}
            </div>
            <div style="font-size: 1.2em; font-weight: bold;">레벨 2 (위험)</div>
            <div style="opacity: 0.8; margin-top: 5px;">즉시 조치 필요</div>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: rgba(116,185,255,0.2); border-radius: 15px;">
          <h4 style="color: #74b9ff; margin-bottom: 10px;">📈 경고 발생률</h4>
          <p style="font-size: 1.1em;">
            세션 시간 대비 경고 발생률: <strong style="color: #00ff88;">
            ${dangerEvents.length > 0 ? ((dangerEvents.length / Math.max(1, Math.floor((Date.now() - sessionStart) / 60000))) * 100).toFixed(1) : 0}%
            </strong> (분당 경고 횟수)
          </p>
        </div>
      </div>

      <div class="detail-card">
        <h3 style="margin-bottom: 20px;">최근 경고 기록 (최대 30개)</h3>
        <div style="max-height: 400px; overflow-y: auto;">
          ${recentAlerts}
        </div>
      </div>
      
      <div class="detail-card">
        <h3 style="margin-bottom: 20px;">🎯 경고 발생 원인 분석</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          <div style="background: rgba(255,165,0,0.1); padding: 20px; border-radius: 15px; border-left: 4px solid #ffa500;">
            <h4 style="color: #ffa500; margin-bottom: 10px;">거리 관련</h4>
            <p style="font-size: 1.5em; font-weight: bold; margin: 10px 0;">
              ${dangerEvents.filter(e => e.distance < 40 || e.distance > 80).length}건
            </p>
            <p style="opacity: 0.9;">부적절한 거리로 인한 경고</p>
          </div>
          <div style="background: rgba(255,71,87,0.1); padding: 20px; border-radius: 15px; border-left: 4px solid #ff4757;">
            <h4 style="color: #ff4757; margin-bottom: 10px;">조도 관련</h4>
            <p style="font-size: 1.5em; font-weight: bold; margin: 10px 0;">
              ${dangerEvents.filter(e => e.light < 500 || e.light > 3000).length}건
            </p>
            <p style="opacity: 0.9;">부적절한 조명으로 인한 경고</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createSettingsPage() {
  const dataCount = historicalData.length;
  const dataSize = new Blob([JSON.stringify(historicalData)]).size;
  const dataSizeKB = (dataSize / 1024).toFixed(2);
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">⚙️ 설정</h2>
      
      <div style="max-width: 900px; margin: 0 auto;">
        
        <div class="detail-card">
          <h3 style="margin-bottom: 20px; font-size: 1.3em;">🔊 오디오 설정</h3>
          
          <div style="margin-bottom: 25px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold;">
              마스터 볼륨
              <span style="float: right; color: #00ff88;">${Math.round(audioSettings.masterVolume * 100)}%</span>
            </label>
            <input type="range" min="0" max="100" value="${audioSettings.masterVolume * 100}" 
                   oninput="updateAudioSetting('masterVolume', this.value / 100); this.previousElementSibling.querySelector('span').textContent = Math.round(this.value) + '%'"
                   style="width: 100%;">
          </div>
          
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 15px;">
              <input type="checkbox" ${audioSettings.clickSoundEnabled ? 'checked' : ''} 
                     onchange="toggleAudioSetting('clickSoundEnabled')"
                     style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
              <span style="font-weight: bold;">클릭 사운드 효과</span>
            </label>
            <label style="display: block; margin-bottom: 8px; opacity: 0.9;">
              클릭 사운드 볼륨
              <span style="float: right; color: #74b9ff;">${Math.round(audioSettings.clickSoundVolume * 100)}%</span>
            </label>
            <input type="range" min="0" max="100" value="${audioSettings.clickSoundVolume * 100}"
                   oninput="updateAudioSetting('clickSoundVolume', this.value / 100); this.previousElementSibling.querySelector('span').textContent = Math.round(this.value) + '%'"
                   style="width: 100%;">
            <button onclick="playClickSound()" style="margin-top: 10px; padding: 8px 16px; background: rgba(116,185,255,0.3); border: 2px solid #74b9ff; border-radius: 8px; color: white; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
              🎵 테스트
            </button>
          </div>
          
          <div style="background: rgba(255,165,0,0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #ffa500;">
            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 15px;">
              <input type="checkbox" ${audioSettings.warningLevel1Enabled ? 'checked' : ''} 
                     onchange="toggleAudioSetting('warningLevel1Enabled')"
                     style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
              <span style="font-weight: bold; color: #ffa500;">⚠️ 경고 레벨 1 사운드</span>
            </label>
            <label style="display: block; margin-bottom: 8px; opacity: 0.9;">
              경고 1 볼륨
              <span style="float: right; color: #ffa500;">${Math.round(audioSettings.warningLevel1Volume * 100)}%</span>
            </label>
            <input type="range" min="0" max="100" value="${audioSettings.warningLevel1Volume * 100}"
                   oninput="updateAudioSetting('warningLevel1Volume', this.value / 100); this.previousElementSibling.querySelector('span').textContent = Math.round(this.value) + '%'"
                   style="width: 100%;">
            <button onclick="playWarningSound(1)" style="margin-top: 10px; padding: 8px 16px; background: rgba(255,165,0,0.3); border: 2px solid #ffa500; border-radius: 8px; color: white; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
              🔔 테스트
            </button>
          </div>
          
          <div style="background: rgba(255,71,87,0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #ff4757;">
            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 15px;">
              <input type="checkbox" ${audioSettings.warningLevel2Enabled ? 'checked' : ''} 
                     onchange="toggleAudioSetting('warningLevel2Enabled')"
                     style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
              <span style="font-weight: bold; color: #ff4757;">🚨 경고 레벨 2 사운드</span>
            </label>
            <label style="display: block; margin-bottom: 8px; opacity: 0.9;">
              경고 2 볼륨
              <span style="float: right; color: #ff4757;">${Math.round(audioSettings.warningLevel2Volume * 100)}%</span>
            </label>
            <input type="range" min="0" max="100" value="${audioSettings.warningLevel2Volume * 100}"
                   oninput="updateAudioSetting('warningLevel2Volume', this.value / 100); this.previousElementSibling.querySelector('span').textContent = Math.round(this.value) + '%'"
                   style="width: 100%;">
            <button onclick="playWarningSound(2)" style="margin-top: 10px; padding: 8px 16px; background: rgba(255,71,87,0.3); border: 2px solid #ff4757; border-radius: 8px; color: white; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
              🚨 테스트
            </button>
          </div>
          
          <div style="background: rgba(0,255,136,0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #00ff88;">
            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 15px;">
              <input type="checkbox" ${audioSettings.backgroundMusicEnabled ? 'checked' : ''} 
                     onchange="toggleAudioSetting('backgroundMusicEnabled'); toggleBackgroundMusic()"
                     style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
              <span style="font-weight: bold; color: #00ff88;">🎵 배경 음악</span>
            </label>
            
            <label style="display: block; margin-bottom: 8px; opacity: 0.9;">
              배경음악 볼륨
              <span style="float: right; color: #00ff88;">${Math.round(audioSettings.backgroundMusicVolume * 100)}%</span>
            </label>
            <input type="range" min="0" max="100" value="${audioSettings.backgroundMusicVolume * 100}"
                   oninput="updateAudioSetting('backgroundMusicVolume', this.value / 100); updateBackgroundMusicVolume(); this.previousElementSibling.querySelector('span').textContent = Math.round(this.value) + '%'"
                   style="width: 100%; margin-bottom: 15px;">
            
            <div style="margin-top: 15px;">
              <label style="display: block; margin-bottom: 10px; font-weight: bold;">음악 파일 업로드</label>
              <input type="file" accept="audio/*" onchange="handleMusicFileUpload(event)" 
                     style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer;">
              <p style="opacity: 0.7; font-size: 0.85em; margin-top: 8px;">
                ${audioSettings.backgroundMusicFile ? '✅ 음악 파일이 설정되었습니다' : '⚠️ 음악 파일을 업로드하세요 (MP3, WAV 등)'}
              </p>
            </div>
          </div>
        </div>
        
        <div class="detail-card">
          <h3 style="margin-bottom: 15px; font-size: 1.3em;">🎨 테마 선택</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            <button onclick="changeTheme('gradient')" class="theme-button-large ${currentTheme === 'gradient' ? 'active' : ''}" style="background: var(--theme-gradient); min-height: 70px; padding: 15px;">
              기본
            </button>
            <button onclick="changeTheme('dark')" class="theme-button-large ${currentTheme === 'dark' ? 'active' : ''}" style="background: var(--theme-dark); min-height: 70px; padding: 15px;">
              다크
            </button>
            <button onclick="changeTheme('ocean')" class="theme-button-large ${currentTheme === 'ocean' ? 'active' : ''}" style="background: var(--theme-ocean); min-height: 70px; padding: 15px;">
              오션
            </button>
            <button onclick="changeTheme('sunset')" class="theme-button-large ${currentTheme === 'sunset' ? 'active' : ''}" style="background: var(--theme-sunset); min-height: 70px; padding: 15px;">
              석양
            </button>
            <button onclick="changeTheme('forest')" class="theme-button-large ${currentTheme === 'forest' ? 'active' : ''}" style="background: var(--theme-forest); min-height: 70px; padding: 15px;">
              숲
            </button>
          </div>
        </div>

        <div class="detail-card">
          <h3 style="margin-bottom: 15px; font-size: 1.3em;">📊 데이터 관리</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; text-align: center;">
              <div style="font-size: 0.85em; opacity: 0.8; margin-bottom: 5px;">저장된 기록</div>
              <div style="font-size: 1.8em; font-weight: bold; color: #00ff88;">${dataCount}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; text-align: center;">
              <div style="font-size: 0.85em; opacity: 0.8; margin-bottom: 5px;">데이터 크기</div>
              <div style="font-size: 1.8em; font-weight: bold; color: #74b9ff;">${dataSizeKB}KB</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; text-align: center;">
              <div style="font-size: 0.85em; opacity: 0.8; margin-bottom: 5px;">쿠키 상태</div>
              <div style="font-size: 1.8em; font-weight: bold; color: ${cookiesAccepted ? '#00ff88' : '#ff4757'};">
                ${cookiesAccepted ? '허용' : '거부'}
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
            <button onclick="exportData()" class="action-button" style="background: linear-gradient(45deg, #00ff88, #00ccff); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
              📥 내보내기
            </button>
            <button onclick="clearAllData()" class="danger-button" style="background: rgba(255,71,87,0.2); color: #ff4757; border: 2px solid #ff4757; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
              🗑️ 삭제
            </button>
          </div>
          
          <p style="margin-top: 12px; opacity: 0.7; font-size: 0.9em; text-align: center;">
            ℹ️ 데이터는 로컬에만 저장되며 외부로 전송되지 않습니다
          </p>
        </div>

        <div class="detail-card">
          <h3 style="margin-bottom: 15px; font-size: 1.3em;">ℹ️ 정보</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
              <div style="font-size: 0.9em; opacity: 0.7;">버전</div>
              <div style="font-size: 1.3em; font-weight: bold;">2.3.0</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
              <div style="font-size: 0.9em; opacity: 0.7;">업데이트</div>
              <div style="font-size: 1.3em; font-weight: bold;">2025.10</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
              <div style="font-size: 0.9em; opacity: 0.7;">개발</div>
              <div style="font-size: 1.3em; font-weight: bold;">Visual Aid</div>
            </div>
          </div>
          <button onclick="showDetail('changelog')" style="width: 100%; background: linear-gradient(45deg, #74b9ff, #a29bfe); color: white; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
            📜 버전 로그 보기
          </button>
        </div>

        <div class="detail-card">
          <h3 style="margin-bottom: 15px; font-size: 1.3em;">🔧 고급 설정</h3>
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 10px; font-weight: bold; font-size: 0.95em;">
                경고 민감도
              </label>
              <input type="range" min="1" max="3" value="2" style="width: 100%;" 
                     onchange="updateSensitivity(this.value)">
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.85em; opacity: 0.8;">
                <span>낮음</span>
                <span>보통</span>
                <span>높음</span>
              </div>
            </div>
            
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.95em;">
              <input type="checkbox" checked style="margin-right: 10px; width: 18px; height: 18px;">
              <span>실시간 알림 활성화</span>
            </label>
          </div>
        </div>

        <div class="detail-card">
          <h3 style="margin-bottom: 15px; font-size: 1.3em;">📝 문제 해결</h3>
          <details style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer;">
            <summary style="color: #ffa500; font-weight: bold; padding: 5px 0;">Arduino가 연결되지 않아요</summary>
            <ul style="list-style: none; padding: 10px 0 0 0; margin: 0; font-size: 0.95em; line-height: 1.8;">
              <li>1. USB 케이블 연결 확인</li>
              <li>2. Arduino IDE 시리얼 모니터 종료</li>
              <li>3. Chrome/Edge 브라우저 사용</li>
              <li>4. Arduino 드라이버 설치 확인</li>
              <li>5. 포트 사용 중인 프로그램 확인</li>
            </ul>
          </details>

          <details style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer;">
            <summary style="color: #ffa500; font-weight: bold; padding: 5px 0;">데이터가 표시되지 않아요</summary>
            <ul style="list-style: none; padding: 10px 0 0 0; margin: 0; font-size: 0.95em; line-height: 1.8;">
              <li>1. Arduino 코드 업로드 확인</li>
              <li>2. Baud Rate 115200 설정 확인</li>
              <li>3. 센서 핀 연결 확인</li>
              <li>4. 브라우저 콘솔(F12) 오류 확인</li>
            </ul>
          </details>

          <details style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; cursor: pointer;">
            <summary style="color: #ffa500; font-weight: bold; padding: 5px 0;">값이 이상해요</summary>
            <ul style="list-style: none; padding: 10px 0 0 0; margin: 0; font-size: 0.95em; line-height: 1.8;">
              <li>1. 초음파 센서 장애물 감지 확인</li>
              <li>2. 조도 센서 빛 노출 확인</li>
              <li>3. 센서-Arduino 배선 재확인</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  `;
}

function exportData() {
  if (historicalData.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }
  
  const data = {
    exportDate: new Date().toISOString(),
    sessionCount: Math.ceil(historicalData.length / 500),
    totalRecords: historicalData.length,
    dangerEventsCount: dangerEvents.length,
    history: historicalData,
    dangerEvents: dangerEvents
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visual-aid-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert('데이터를 성공적으로 내보냈습니다!');
}

function clearAllData() {
  if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    if (confirm('한 번 더 확인합니다. 모든 기록이 영구적으로 삭제됩니다.')) {
      historicalData = [];
      dangerEvents = [];
      localStorage.removeItem('visualAidHistory');
      localStorage.removeItem('cookieConsent');
      document.getElementById('dangerCount').textContent = '0';
      alert('모든 데이터가 삭제되었습니다.');
      hideDetail();
    }
  }
}

function updateSensitivity(value) {
  localStorage.setItem('visualAidSensitivity', value);
  const levels = ['낮음', '보통', '높음'];
  alert(`경고 민감도가 "${levels[value-1]}"으로 설정되었습니다.`);
}

function initDetailCharts(type) {
  // Can add specific chart initialization for detail pages if needed
  if (type === 'alerts' && dangerEvents.length > 0) {
    // Could draw a pie chart or timeline here
  }
}

function createChangelogPage() {
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">📜 버전 로그</h2>
      
      <div class="detail-card">
        <div class="version-header" style="background: linear-gradient(45deg, #00ff88, #37877bff); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
          <h3 style="font-size: 2em; margin-bottom: 10px;">현재 버전: 2.2.0</h3>
          <p style="opacity: 0.9;">2025년 10월 3일 출시</p>
        </div>

        <div class="version-entry" style="border-left: 5px solid #6f91cfff; padding-left: 25px; margin-bottom: 40px;">
          <h3 style="color: #6f91cfff; font-size: 1.5em; margin-bottom: 15px;">
            🔔 버전 2.2.0 - 스마트 알림 시스템
          </h3>
          <p style="opacity: 0.8; margin-bottom: 20px;">2025년 8월</p>
          
          <h4 style="color: #5c6bcaff; margin: 20px 0 15px 0;">핵심 기능</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 20-20-20 규칙 자동 알림
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 맞춤형 휴식 시간 알림
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 브라우저 알림 권한 통합
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 소리 알림 사용자 지정
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 알림 히스토리 및 통계
            </li>
          </ul>
        </div>

        <div class="version-entry" style="border-left: 5px solid #00ff88; padding-left: 25px; margin-bottom: 40px;">
          <h3 style="color: #00ff88; font-size: 1.8em; margin-bottom: 15px;">
            🎉 버전 2.0.0 - 메이저 업데이트
          </h3>
          <p style="opacity: 0.8; margin-bottom: 20px;">2025년 10월 2일</p>
          
          <h4 style="color: #74b9ff; margin: 20px 0 15px 0;">✨ 새로운 기능</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <strong style="color: #00ff88;">🖱️ 상세 정보 페이지</strong><br>
              모든 카드를 클릭하여 심층 분석 확인 가능 (현재 상황, 거리, 조도, 경고)
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <strong style="color: #00ff88;">🍪 쿠키 동의 시스템</strong><br>
              사용자 동의 후 로컬 스토리지에 데이터 저장 및 이전 세션 비교
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <strong style="color: #00ff88;">🎨 5가지 테마</strong><br>
              기본 그라데이션, 다크 모드, 오션 블루, 석양, 숲 테마 추가
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <strong style="color: #00ff88;">📊 강화된 경고 분석</strong><br>
              초/분/시간 단위 통계, 레벨별 분포, 최근 30개 기록, 원인별 분석
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <strong style="color: #00ff88;">📥 데이터 내보내기</strong><br>
              JSON 형식으로 모든 데이터 다운로드 가능
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <strong style="color: #00ff88;">🇰🇷 완벽한 한국어화</strong><br>
              모든 UI 텍스트를 자연스러운 한국어로 번역
            </li>
            <li style="padding: 10px 0;">
              <strong style="color: #00ff88;">📜 버전 로그</strong><br>
              업데이트 내역을 확인할 수 있는 전용 페이지
            </li>
          </ul>

          <h4 style="color: #74b9ff; margin: 20px 0 15px 0;">🔧 개선사항</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 실시간 차트 성능 최적화 (30개 포인트 유지)
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 반응형 디자인 개선 (모바일, 태블릿 최적화)
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 애니메이션 효과 추가 (페이드인, 슬라이드)
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 사용자 경험 개선 (호버 효과, 클릭 힌트)
            </li>
            <li style="padding: 10px 0;">
              • 접근성 향상 (키보드 네비게이션, 시맨틱 HTML)
            </li>
          </ul>

          <h4 style="color: #74b9ff; margin: 20px 0 15px 0;">🐛 버그 수정</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 차트 렌더링 오류 수정
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 서보 게이지 각도 계산 개선
            </li>
            <li style="padding: 10px 0;">
              • 세션 타이머 정확도 향상
            </li>
          </ul>
        </div>

        <div class="version-entry" style="border-left: 5px solid #74b9ff; padding-left: 25px; margin-bottom: 40px;">
          <h3 style="color: #74b9ff; font-size: 1.5em; margin-bottom: 15px;">
            📦 버전 1.5.0 - 안정화 업데이트
          </h3>
          <p style="opacity: 0.8; margin-bottom: 20px;">2025년 9월</p>
          
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 데이터 수집 안정성 개선
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • Arduino 연결 오류 처리 강화
            </li>
            <li style="padding: 10px 0;">
              • UI 미세 조정
            </li>
          </ul>
        </div>

        <div class="version-entry" style="border-left: 5px solid #ffa500; padding-left: 25px; margin-bottom: 40px;">
          <h3 style="color: #ffa500; font-size: 1.5em; margin-bottom: 15px;">
            🚀 버전 1.0.0 - 초기 출시
          </h3>
          <p style="opacity: 0.8; margin-bottom: 20px;">2025년 8월</p>
          
          <h4 style="color: #74b9ff; margin: 20px 0 15px 0;">핵심 기능</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • Arduino와 Web Serial API 연결
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 실시간 거리 및 조도 모니터링
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 위험도 레벨 시스템 (0-2)
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 서보 게이지 시각화
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 실시간 라인 차트
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              • 기본 경고 시스템
            </li>
            <li style="padding: 10px 0;">
              • 눈 건강 팁 제공
            </li>
          </ul>
        </div>

        <div style="background: rgba(116,185,255,0.2); padding: 25px; border-radius: 15px; margin-top: 40px;">
          <h4 style="color: #74b9ff; margin-bottom: 15px;">🔮 향후 계획</h4>
          
          <div style="padding: 20px; background: rgba(255,107,53,0.1); border-radius: 12px; border-left: 4px solid #ff6b35;">
            <strong style="color: #ff6b35; font-size: 1.2em;">v3.0.0 - AI 건강 어시스턴트</strong>
            <p style="margin-top: 10px; opacity: 0.9;">예상 출시: 2026년 초</p>
            <ul style="list-style: none; padding: 0; margin-top: 15px;">
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                • AI 기반 맞춤 건강 조언
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                • 사용 패턴 학습 및 예측
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                • 다중 프로필 지원 (가족 계정)
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                • 블루투스 센서 연결 지원
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                • 음성 명령 인터페이스
              </li>
              <li style="padding: 8px 0;">
                • 건강 데이터 클라우드 동기화 (선택적)
              </li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; padding: 30px; background: rgba(0,255,136,0.1); border-radius: 15px;">
          <p style="font-size: 1.2em; margin-bottom: 15px;">
            💚 Visual Aid를 사용해주셔서 감사합니다!
          </p>
          <p style="opacity: 0.8;">
            여러분의 눈 건강이 우리의 최우선 과제입니다.
          </p>
        </div>
      </div>
    </div>
  `;
}


