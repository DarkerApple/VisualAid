// Reports System - v2.1.0
// Weekly and Monthly Health Reports

// Report goals
let userGoals = {
  dailySessionMinutes: 120,
  maxAlertsPerDay: 5,
  optimalDistancePercentage: 80,
  optimalLightPercentage: 80
};

// Load goals from localStorage
function loadUserGoals() {
  const saved = localStorage.getItem('visualAidGoals');
  if (saved) {
    try {
      userGoals = JSON.parse(saved);
    } catch(e) {
      console.error('Failed to load goals:', e);
    }
  }
}

// Save goals to localStorage
function saveUserGoals() {
  localStorage.setItem('visualAidGoals', JSON.stringify(userGoals));
}

// Generate weekly report
function generateWeeklyReport() {
  const now = Date.now();
  const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  const weekData = historicalData.filter(d => d.timestamp >= weekAgo);
  const weekAlerts = dangerEvents.filter(e => e.timestamp >= weekAgo);
  
  if (weekData.length === 0) {
    return {
      hasData: false,
      message: '지난 주 데이터가 충분하지 않습니다.'
    };
  }
  
  // Calculate daily averages
  const dailyStats = {};
  weekData.forEach(d => {
    const day = new Date(d.timestamp).toLocaleDateString('ko-KR');
    if (!dailyStats[day]) {
      dailyStats[day] = {
        distances: [],
        lights: [],
        alerts: 0,
        sessionTime: 0
      };
    }
    dailyStats[day].distances.push(d.distance);
    dailyStats[day].lights.push(d.lightLevel);
  });
  
  weekAlerts.forEach(a => {
    const day = new Date(a.timestamp).toLocaleDateString('ko-KR');
    if (dailyStats[day]) {
      dailyStats[day].alerts++;
    }
  });
  
  // Calculate averages
  const days = Object.keys(dailyStats);
  let totalAvgDistance = 0;
  let totalAvgLight = 0;
  let totalAlerts = 0;
  let optimalDistanceDays = 0;
  let optimalLightDays = 0;
  
  days.forEach(day => {
    const stats = dailyStats[day];
    const avgDistance = stats.distances.reduce((a, b) => a + b, 0) / stats.distances.length;
    const avgLight = stats.lights.reduce((a, b) => a + b, 0) / stats.lights.length;
    
    totalAvgDistance += avgDistance;
    totalAvgLight += avgLight;
    totalAlerts += stats.alerts;
    
    if (avgDistance >= 50 && avgDistance <= 80) optimalDistanceDays++;
    if (avgLight >= 500 && avgLight <= 1023) optimalLightDays++;
  });
  
  const weekAvgDistance = totalAvgDistance / days.length;
  const weekAvgLight = totalAvgLight / days.length;
  const avgAlertsPerDay = totalAlerts / days.length;
  
  // Calculate scores
  const distanceScore = (optimalDistanceDays / days.length) * 100;
  const lightScore = (optimalLightDays / days.length) * 100;
  const alertScore = Math.max(0, 100 - (avgAlertsPerDay * 10));
  const overallScore = Math.round((distanceScore + lightScore + alertScore) / 3);
  
  // Generate insights
  const insights = [];
  if (distanceScore < 50) {
    insights.push('⚠️ 화면 거리 개선이 필요합니다. 50-80cm를 유지하세요.');
  } else if (distanceScore >= 80) {
    insights.push('✅ 화면 거리 관리를 잘하고 계십니다!');
  }
  
  if (lightScore < 50) {
    insights.push('💡 조명 환경을 개선하세요. 적절한 밝기를 유지하세요.');
  } else if (lightScore >= 80) {
    insights.push('✅ 조명 관리가 우수합니다!');
  }
  
  if (avgAlertsPerDay > 10) {
    insights.push('🚨 경고 횟수가 많습니다. 더 자주 자세를 확인하세요.');
  } else if (avgAlertsPerDay < 3) {
    insights.push('✅ 경고 횟수가 적어 매우 좋습니다!');
  }
  
  // Trend analysis (compare with previous week if available)
  const twoWeeksAgo = weekAgo - (7 * 24 * 60 * 60 * 1000);
  const prevWeekData = historicalData.filter(d => d.timestamp >= twoWeeksAgo && d.timestamp < weekAgo);
  let trend = 'stable';
  let trendMessage = '이전 주와 비슷한 수준입니다.';
  
  if (prevWeekData.length > 0) {
    const prevAvgDistance = prevWeekData.reduce((sum, d) => sum + d.distance, 0) / prevWeekData.length;
    const improvement = ((weekAvgDistance - prevAvgDistance) / prevAvgDistance) * 100;
    
    if (Math.abs(improvement) < 5) {
      trend = 'stable';
      trendMessage = '이전 주와 비슷한 수준을 유지하고 있습니다.';
    } else if (improvement > 0 && weekAvgDistance >= 50 && weekAvgDistance <= 80) {
      trend = 'improving';
      trendMessage = `이전 주 대비 ${Math.abs(improvement).toFixed(1)}% 개선되었습니다! 🎉`;
    } else if (improvement < 0) {
      trend = 'declining';
      trendMessage = `이전 주 대비 ${Math.abs(improvement).toFixed(1)}% 악화되었습니다. 주의가 필요합니다.`;
    }
  }
  
  return {
    hasData: true,
    period: {
      start: new Date(weekAgo).toLocaleDateString('ko-KR'),
      end: new Date(now).toLocaleDateString('ko-KR'),
      days: days.length
    },
    averages: {
      distance: weekAvgDistance.toFixed(1),
      light: weekAvgLight.toFixed(0),
      alertsPerDay: avgAlertsPerDay.toFixed(1)
    },
    scores: {
      distance: Math.round(distanceScore),
      light: Math.round(lightScore),
      alert: Math.round(alertScore),
      overall: overallScore
    },
    dailyStats: dailyStats,
    insights: insights,
    trend: {
      direction: trend,
      message: trendMessage
    },
    totalAlerts: totalAlerts
  };
}

// Generate monthly report
function generateMonthlyReport() {
  const now = Date.now();
  const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  const monthData = historicalData.filter(d => d.timestamp >= monthAgo);
  const monthAlerts = dangerEvents.filter(e => e.timestamp >= monthAgo);
  
  if (monthData.length === 0) {
    return {
      hasData: false,
      message: '지난 달 데이터가 충분하지 않습니다.'
    };
  }
  
  // Weekly breakdown
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const weekEnd = now - (i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = weekEnd - (7 * 24 * 60 * 60 * 1000);
    
    const weekData = monthData.filter(d => d.timestamp >= weekStart && d.timestamp < weekEnd);
    const weekAlerts = monthAlerts.filter(e => e.timestamp >= weekStart && e.timestamp < weekEnd);
    
    if (weekData.length > 0) {
      const avgDistance = weekData.reduce((sum, d) => sum + d.distance, 0) / weekData.length;
      const avgLight = weekData.reduce((sum, d) => sum + d.lightLevel, 0) / weekData.length;
      
      weeks.unshift({
        label: `${i + 1}주차`,
        avgDistance: avgDistance.toFixed(1),
        avgLight: avgLight.toFixed(0),
        alerts: weekAlerts.length
      });
    }
  }
  
  // Overall statistics
  const avgDistance = monthData.reduce((sum, d) => sum + d.distance, 0) / monthData.length;
  const avgLight = monthData.reduce((sum, d) => sum + d.lightLevel, 0) / monthData.length;
  
  const optimalDistanceCount = monthData.filter(d => d.distance >= 50 && d.distance <= 80).length;
  const optimalLightCount = monthData.filter(d => d.lightLevel >= 500 && d.lightLevel <= 1023).length;
  
  const distanceCompliance = (optimalDistanceCount / monthData.length) * 100;
  const lightCompliance = (optimalLightCount / monthData.length) * 100;
  
  // Best and worst days
  const dailyAverages = {};
  monthData.forEach(d => {
    const day = new Date(d.timestamp).toLocaleDateString('ko-KR');
    if (!dailyAverages[day]) {
      dailyAverages[day] = { distances: [], lights: [], alerts: 0 };
    }
    dailyAverages[day].distances.push(d.distance);
    dailyAverages[day].lights.push(d.lightLevel);
  });
  
  monthAlerts.forEach(a => {
    const day = new Date(a.timestamp).toLocaleDateString('ko-KR');
    if (dailyAverages[day]) {
      dailyAverages[day].alerts++;
    }
  });
  
  let bestDay = { date: '', score: -1 };
  let worstDay = { date: '', score: 999 };
  
  Object.entries(dailyAverages).forEach(([date, stats]) => {
    const avgDist = stats.distances.reduce((a, b) => a + b, 0) / stats.distances.length;
    const score = stats.alerts + Math.abs(avgDist - 65); // 65cm is ideal
    
    if (score < worstDay.score) worstDay = { date, score, alerts: stats.alerts };
    if (score > bestDay.score && stats.alerts < 5) bestDay = { date, score, alerts: stats.alerts };
  });
  
  // Calculate overall grade
  const overallScore = Math.round((distanceCompliance + lightCompliance) / 2);
  let grade = 'F';
  if (overallScore >= 90) grade = 'A+';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 50) grade = 'D';
  
  return {
    hasData: true,
    period: {
      start: new Date(monthAgo).toLocaleDateString('ko-KR'),
      end: new Date(now).toLocaleDateString('ko-KR')
    },
    averages: {
      distance: avgDistance.toFixed(1),
      light: avgLight.toFixed(0),
      totalAlerts: monthAlerts.length
    },
    compliance: {
      distance: Math.round(distanceCompliance),
      light: Math.round(lightCompliance)
    },
    weeks: weeks,
    grade: grade,
    overallScore: overallScore,
    bestDay: bestDay.date,
    worstDay: worstDay.date
  };
}

// Create weekly report page
function createWeeklyReportPage() {
  const report = generateWeeklyReport();
  
  if (!report.hasData) {
    return `
      <div class="detail-page">
        <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
        <h2 class="detail-title">📊 주간 리포트</h2>
        <div class="detail-card">
          <p style="text-align: center; font-size: 1.2em; opacity: 0.8;">${report.message}</p>
          <p style="text-align: center; margin-top: 20px;">최소 일주일간 데이터를 수집한 후 다시 확인해주세요.</p>
        </div>
      </div>
    `;
  }
  
  const scoreColor = report.scores.overall >= 80 ? '#00ff88' : report.scores.overall >= 60 ? '#ffa500' : '#ff4757';
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">📊 주간 눈 건강 리포트</h2>
      
      <div class="detail-card">
        <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,204,255,0.1)); border-radius: 20px; margin-bottom: 30px;">
          <div style="font-size: 5em; font-weight: bold; color: ${scoreColor}; margin-bottom: 10px;">
            ${report.scores.overall}
          </div>
          <div style="font-size: 1.5em; opacity: 0.9;">종합 점수</div>
          <div style="margin-top: 20px; opacity: 0.8;">
            ${report.period.start} ~ ${report.period.end} (${report.period.days}일)
          </div>
        </div>
        
        <div class="stats-grid-detail">
          <div class="stat-box-detail" style="border-left: 4px solid #00ff88;">
            <div style="font-size: 2.5em; font-weight: bold; color: #00ff88;">${report.scores.distance}</div>
            <div style="margin-top: 10px; opacity: 0.9;">거리 점수</div>
            <small style="opacity: 0.7;">평균: ${report.averages.distance}cm</small>
          </div>
          <div class="stat-box-detail" style="border-left: 4px solid #ffa500;">
            <div style="font-size: 2.5em; font-weight: bold; color: #ffa500;">${report.scores.light}</div>
            <div style="margin-top: 10px; opacity: 0.9;">조도 점수</div>
            <small style="opacity: 0.7;">평균: ${report.averages.light}</small>
          </div>
          <div class="stat-box-detail" style="border-left: 4px solid #74b9ff;">
            <div style="font-size: 2.5em; font-weight: bold; color: #74b9ff;">${report.scores.alert}</div>
            <div style="margin-top: 10px; opacity: 0.9;">경고 점수</div>
            <small style="opacity: 0.7;">일평균: ${report.averages.alertsPerDay}회</small>
          </div>
        </div>
        
        <div style="background: rgba(116,185,255,0.2); padding: 25px; border-radius: 15px; margin-top: 30px; border-left: 4px solid #74b9ff;">
          <h4 style="color: #74b9ff; margin-bottom: 15px;">📈 트렌드 분석</h4>
          <p style="font-size: 1.1em; line-height: 1.8;">${report.trend.message}</p>
        </div>
        
        <div style="margin-top: 30px;">
          <h4 style="margin-bottom: 20px;">💡 주요 인사이트</h4>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            ${report.insights.map(insight => `
              <div style="background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 12px; border-left: 4px solid #00ff88;">
                ${insight}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="margin-top: 30px;">
          <h4 style="margin-bottom: 20px;">📅 일별 통계</h4>
          <div style="max-height: 300px; overflow-y: auto;">
            ${Object.entries(report.dailyStats).map(([day, stats]) => {
              const avgDist = (stats.distances.reduce((a,b) => a+b, 0) / stats.distances.length).toFixed(1);
              const avgLight = (stats.lights.reduce((a,b) => a+b, 0) / stats.lights.length).toFixed(0);
              return `
                <div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;">
                  <span style="font-weight: bold;">${day}</span>
                  <span>거리: ${avgDist}cm | 조도: ${avgLight} | 경고: ${stats.alerts}회</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
          <button onclick="downloadWeeklyReport()" style="background: linear-gradient(45deg, #00ff88, #00ccff); color: white; border: none; padding: 15px 30px; border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
            📥 리포트 다운로드 (JSON)
          </button>
        </div>
      </div>
    </div>
  `;
}

// Create monthly report page
function createMonthlyReportPage() {
  const report = generateMonthlyReport();
  
  if (!report.hasData) {
    return `
      <div class="detail-page">
        <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
        <h2 class="detail-title">📅 월간 리포트</h2>
        <div class="detail-card">
          <p style="text-align: center; font-size: 1.2em; opacity: 0.8;">${report.message}</p>
          <p style="text-align: center; margin-top: 20px;">최소 한 달간 데이터를 수집한 후 다시 확인해주세요.</p>
        </div>
      </div>
    `;
  }
  
  const gradeColor = report.grade.includes('A') ? '#00ff88' : report.grade === 'B' ? '#74b9ff' : report.grade === 'C' ? '#ffa500' : '#ff4757';
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">📅 월간 리포트</h2>
      
      <div class="detail-card">
        <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, rgba(116,185,255,0.2), rgba(255,107,181,0.2)); border-radius: 20px; margin-bottom: 30px;">
          <div style="font-size: 6em; font-weight: bold; color: ${gradeColor}; margin-bottom: 10px;">
            ${report.grade}
          </div>
          <div style="font-size: 1.8em; opacity: 0.9;">종합 등급</div>
          <div style="font-size: 2em; margin-top: 15px; color: ${gradeColor};">${report.overallScore}점</div>
          <div style="margin-top: 20px; opacity: 0.8;">
            ${report.period.start} ~ ${report.period.end}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: rgba(0,255,136,0.1); padding: 25px; border-radius: 15px; text-align: center; border-left: 4px solid #00ff88;">
            <div style="font-size: 2.5em; font-weight: bold; color: #00ff88;">${report.compliance.distance}%</div>
            <div style="margin-top: 10px;">최적 거리 준수율</div>
            <small style="opacity: 0.7;">평균: ${report.averages.distance}cm</small>
          </div>
          <div style="background: rgba(255,165,0,0.1); padding: 25px; border-radius: 15px; text-align: center; border-left: 4px solid #ffa500;">
            <div style="font-size: 2.5em; font-weight: bold; color: #ffa500;">${report.compliance.light}%</div>
            <div style="margin-top: 10px;">최적 조도 준수율</div>
            <small style="opacity: 0.7;">평균: ${report.averages.light}</small>
          </div>
          <div style="background: rgba(255,71,87,0.1); padding: 25px; border-radius: 15px; text-align: center; border-left: 4px solid #ff4757;">
            <div style="font-size: 2.5em; font-weight: bold; color: #ff4757;">${report.averages.totalAlerts}</div>
            <div style="margin-top: 10px;">총 경고 횟수</div>
            <small style="opacity: 0.7;">한 달 누적</small>
          </div>
        </div>
        
        <div style="margin-top: 30px;">
          <h4 style="margin-bottom: 20px;">📊 주차별 추이</h4>
          <div style="display: grid; gap: 15px;">
            ${report.weeks.map(week => `
              <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                  <strong style="font-size: 1.2em;">${week.label}</strong>
                  <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <span>거리: ${week.avgDistance}cm</span>
                    <span>조도: ${week.avgLight}</span>
                    <span style="color: ${week.alerts > 20 ? '#ff4757' : '#00ff88'};">경고: ${week.alerts}회</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px;">
          <div style="background: rgba(0,255,136,0.1); padding: 25px; border-radius: 15px; border-left: 4px solid #00ff88;">
            <h4 style="color: #00ff88; margin-bottom: 15px;">🏆 최고의 날</h4>
            <p style="font-size: 1.3em; font-weight: bold;">${report.bestDay}</p>
            <p style="opacity: 0.8; margin-top: 10px;">이 날처럼 계속 유지하세요!</p>
          </div>
          <div style="background: rgba(255,165,0,0.1); padding: 25px; border-radius: 15px; border-left: 4px solid #ffa500;">
            <h4 style="color: #ffa500; margin-bottom: 15px;">⚠️ 개선 필요</h4>
            <p style="font-size: 1.3em; font-weight: bold;">${report.worstDay}</p>
            <p style="opacity: 0.8; margin-top: 10px;">이런 날을 줄여나가세요.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button onclick="downloadMonthlyReport()" style="background: linear-gradient(45deg, #74b9ff, #a29bfe); color: white; border: none; padding: 15px 30px; border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
            📥 리포트 다운로드 (JSON)
          </button>
          <button onclick="showDetail('goals')" style="background: linear-gradient(45deg, #00ff88, #00ccff); color: white; border: none; padding: 15px 30px; border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif;">
            🎯 목표 설정
          </button>
        </div>
      </div>
    </div>
  `;
}

// Create goals page
function createGoalsPage() {
  loadUserGoals();
  
  return `
    <div class="detail-page">
      <button onclick="hideDetail()" class="back-button">← 돌아가기</button>
      <h2 class="detail-title">🎯 건강 목표 설정</h2>
      
      <div style="max-width: 800px; margin: 0 auto;">
        <div class="detail-card">
          <p style="text-align: center; font-size: 1.05em; opacity: 0.9; margin-bottom: 25px;">
            나만의 눈 건강 목표를 설정하고 달성률을 추적하세요!
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
              <label style="display: block; font-weight: bold; margin-bottom: 10px; font-size: 1em;">
                📅 일일 목표 사용 시간
              </label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" id="goalSessionMinutes" value="${userGoals.dailySessionMinutes}" min="30" max="480" step="15"
                       style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.3); color: white; font-size: 1em;">
                <span style="font-weight: bold; white-space: nowrap;">분</span>
              </div>
              <small style="opacity: 0.7; display: block; margin-top: 6px; font-size: 0.9em;">건강한 사용 시간 (30-480분)</small>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
              <label style="display: block; font-weight: bold; margin-bottom: 10px; font-size: 1em;">
                ⚠️ 일일 최대 경고 횟수
              </label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" id="goalMaxAlerts" value="${userGoals.maxAlertsPerDay}" min="0" max="50" step="1"
                       style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.3); color: white; font-size: 1em;">
                <span style="font-weight: bold; white-space: nowrap;">회</span>
              </div>
              <small style="opacity: 0.7; display: block; margin-top: 6px; font-size: 0.9em;">하루 최대 경고 (0-50회)</small>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
              <label style="display: block; font-weight: bold; margin-bottom: 10px; font-size: 1em;">
                📏 최적 거리 유지율
              </label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" id="goalDistancePercent" value="${userGoals.optimalDistancePercentage}" min="50" max="100" step="5"
                       style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.3); color: white; font-size: 1em;">
                <span style="font-weight: bold; white-space: nowrap;">%</span>
              </div>
              <small style="opacity: 0.7; display: block; margin-top: 6px; font-size: 0.9em;">거리 50-80cm 유지 목표</small>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
              <label style="display: block; font-weight: bold; margin-bottom: 10px; font-size: 1em;">
                💡 최적 조도 유지율
              </label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" id="goalLightPercent" value="${userGoals.optimalLightPercentage}" min="50" max="100" step="5"
                       style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.3); color: white; font-size: 1em;">
                <span style="font-weight: bold; white-space: nowrap;">%</span>
              </div>
              <small style="opacity: 0.7; display: block; margin-top: 6px; font-size: 0.9em;">조도 500-1023 유지 목표</small>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="saveGoals()" style="background: linear-gradient(45deg, #00ff88, #00ccff); color: white; border: none; padding: 12px 35px; border-radius: 10px; font-size: 1.1em; font-weight: bold; cursor: pointer; font-family: 'Gowun Dodum', sans-serif; transition: all 0.3s ease;">
              💾 목표 저장
            </button>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: rgba(116,185,255,0.1); border-radius: 12px; border-left: 4px solid #74b9ff;">
            <h4 style="color: #74b9ff; margin-bottom: 15px; font-size: 1.1em;">📊 현재 달성률</h4>
            <div id="goalProgress" style="display: grid; gap: 12px;">
              <p style="text-align: center; opacity: 0.8; font-size: 0.95em;">데이터를 수집 중입니다...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Save goals
function saveGoals() {
  userGoals.dailySessionMinutes = parseInt(document.getElementById('goalSessionMinutes').value);
  userGoals.maxAlertsPerDay = parseInt(document.getElementById('goalMaxAlerts').value);
  userGoals.optimalDistancePercentage = parseInt(document.getElementById('goalDistancePercent').value);
  userGoals.optimalLightPercentage = parseInt(document.getElementById('goalLightPercent').value);
  
  saveUserGoals();
  alert('목표가 저장되었습니다! 🎯');
  updateGoalProgress();
}

// Update goal progress display
function updateGoalProgress() {
  const progressDiv = document.getElementById('goalProgress');
  if (!progressDiv || historicalData.length === 0) return;
  
  const now = Date.now();
  const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const weekData = historicalData.filter(d => d.timestamp >= weekAgo);
  const weekAlerts = dangerEvents.filter(e => e.timestamp >= weekAgo);
  
  if (weekData.length === 0) {
    progressDiv.innerHTML = '<p style="text-align: center; opacity: 0.8;">일주일 이상 데이터를 수집해주세요.</p>';
    return;
  }
  
  const optimalDistanceCount = weekData.filter(d => d.distance >= 50 && d.distance <= 80).length;
  const optimalLightCount = weekData.filter(d => d.lightLevel >= 500 && d.lightLevel <= 1023).length;
  
  const distancePercent = (optimalDistanceCount / weekData.length) * 100;
  const lightPercent = (optimalLightCount / weekData.length) * 100;
  const avgAlertsPerDay = weekAlerts.length / 7;
  
  const distanceAchieved = distancePercent >= userGoals.optimalDistancePercentage;
  const lightAchieved = lightPercent >= userGoals.optimalLightPercentage;
  const alertsAchieved = avgAlertsPerDay <= userGoals.maxAlertsPerDay;
  
  progressDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
      <span>거리 유지율</span>
      <span style="font-weight: bold; color: ${distanceAchieved ? '#00ff88' : '#ffa500'};">
        ${distancePercent.toFixed(1)}% / ${userGoals.optimalDistancePercentage}% ${distanceAchieved ? '✅' : '⚠️'}
      </span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
      <span>조도 유지율</span>
      <span style="font-weight: bold; color: ${lightAchieved ? '#00ff88' : '#ffa500'};">
        ${lightPercent.toFixed(1)}% / ${userGoals.optimalLightPercentage}% ${lightAchieved ? '✅' : '⚠️'}
      </span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
      <span>일평균 경고</span>
      <span style="font-weight: bold; color: ${alertsAchieved ? '#00ff88' : '#ffa500'};">
        ${avgAlertsPerDay.toFixed(1)}회 / ${userGoals.maxAlertsPerDay}회 ${alertsAchieved ? '✅' : '⚠️'}
      </span>
    </div>
  `;
}

// Download reports
function downloadWeeklyReport() {
  const report = generateWeeklyReport();
  if (!report.hasData) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weekly-report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadMonthlyReport() {
  const report = generateMonthlyReport();
  if (!report.hasData) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `monthly-report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize on load
window.addEventListener('load', function() {
  loadUserGoals();
});