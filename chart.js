// Chart management
let chartContext;
let chartData = {
  distance: [],
  light: [],
  timestamps: []
};

function initChart() {
  const canvas = document.getElementById('chart');
  if (!canvas) return;
  
  chartContext = canvas.getContext('2d');
  
  // Handle high DPI displays
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  chartContext.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  drawChart();
}

function updateChart(distance, light) {
  if (!distance || !light) return;
  
  chartData.distance.push(distance);
  chartData.light.push(light);
  chartData.timestamps.push(Date.now());
  
  // Keep only last 30 points for performance
  const maxPoints = 30;
  if (chartData.distance.length > maxPoints) {
    chartData.distance = chartData.distance.slice(-maxPoints);
    chartData.light = chartData.light.slice(-maxPoints);
    chartData.timestamps = chartData.timestamps.slice(-maxPoints);
  }
  
  drawChart();
}

function drawChart() {
  if (!chartContext) return;
  
  const width = chartContext.canvas.width / window.devicePixelRatio;
  const height = chartContext.canvas.height / window.devicePixelRatio;
  const padding = 60;
  const rightPadding = 70; // Extra padding for right Y-axis
  
  // Clear canvas
  chartContext.clearRect(0, 0, width, height);
  
  if (chartData.distance.length < 2) {
    // Draw placeholder
    chartContext.fillStyle = 'rgba(255,255,255,0.5)';
    chartContext.font = '16px Gowun Dodum';
    chartContext.textAlign = 'center';
    chartContext.fillText('데이터를 수집하는 중...', width / 2, height / 2);
    return;
  }
  
  const chartWidth = width - padding - rightPadding;
  const chartHeight = height - 2 * padding;
  
  // Fixed scales for dual-axis
  const maxDistance = 200; // 0-200cm scale
  const maxLight = 1023;   // 0-1023 scale (Arduino analog read max)
  
  // Draw grid
  chartContext.strokeStyle = 'rgba(255,255,255,0.15)';
  chartContext.lineWidth = 1;
  chartContext.setLineDash([5, 5]);
  
  for (let i = 0; i <= 5; i++) {
    const y = padding + i * chartHeight / 5;
    chartContext.beginPath();
    chartContext.moveTo(padding, y);
    chartContext.lineTo(width - rightPadding, y);
    chartContext.stroke();
  }
  
  chartContext.setLineDash([]);
  
  // Draw axes
  chartContext.strokeStyle = 'rgba(255,255,255,0.3)';
  chartContext.lineWidth = 2;
  chartContext.beginPath();
  // Left Y-axis
  chartContext.moveTo(padding, padding);
  chartContext.lineTo(padding, height - padding);
  // X-axis
  chartContext.lineTo(width - rightPadding, height - padding);
  // Right Y-axis
  chartContext.moveTo(width - rightPadding, padding);
  chartContext.lineTo(width - rightPadding, height - padding);
  chartContext.stroke();
  
  // Draw Y-axis labels (LEFT - Distance)
  chartContext.fillStyle = '#00ff88';
  chartContext.font = 'bold 12px Gowun Dodum';
  chartContext.textAlign = 'right';
  
  for (let i = 0; i <= 5; i++) {
    const y = padding + i * chartHeight / 5;
    const distValue = Math.round(maxDistance - (i * maxDistance / 5));
    chartContext.fillText(`${distValue}`, padding - 10, y + 4);
  }
  
  // Draw Y-axis labels (RIGHT - Light)
  chartContext.fillStyle = '#ffa500';
  chartContext.textAlign = 'left';
  
  for (let i = 0; i <= 5; i++) {
    const y = padding + i * chartHeight / 5;
    const lightValue = Math.round(maxLight - (i * maxLight / 5));
    chartContext.fillText(`${lightValue}`, width - rightPadding + 10, y + 4);
  }
  
  // Axis titles
  chartContext.font = 'bold 14px Gowun Dodum';
  chartContext.fillStyle = '#00ff88';
  chartContext.textAlign = 'center';
  chartContext.save();
  chartContext.translate(20, height / 2);
  chartContext.rotate(-Math.PI / 2);
  chartContext.fillText('거리 (cm)', 0, 0);
  chartContext.restore();
  
  chartContext.fillStyle = '#ffa500';
  chartContext.save();
  chartContext.translate(width - 20, height / 2);
  chartContext.rotate(-Math.PI / 2);
  chartContext.fillText('조도 (0-1023)', 0, 0);
  chartContext.restore();
  
  // Draw reference zones (optimal distance 50-80cm)
  const optimalMin = 50;
  const optimalMax = 80;
  const optimalMinY = height - padding - (optimalMin / maxDistance) * chartHeight;
  const optimalMaxY = height - padding - (optimalMax / maxDistance) * chartHeight;
  
  chartContext.fillStyle = 'rgba(0,255,136,0.1)';
  chartContext.fillRect(padding, optimalMaxY, chartWidth, optimalMinY - optimalMaxY);
  
  // Draw optimal light zone (500-3000)
  const lightOptimalMin = 500;
  const lightOptimalMax = 1023; // Can't exceed sensor max
  const lightOptimalMinY = height - padding - (lightOptimalMin / maxLight) * chartHeight;
  const lightOptimalMaxY = height - padding - (lightOptimalMax / maxLight) * chartHeight;
  
  chartContext.fillStyle = 'rgba(255,165,0,0.08)';
  chartContext.fillRect(padding, lightOptimalMaxY, chartWidth, lightOptimalMinY - lightOptimalMaxY);
  
  // Draw distance line (green with gradient)
  const distanceGradient = chartContext.createLinearGradient(0, 0, 0, height);
  distanceGradient.addColorStop(0, '#00ff88');
  distanceGradient.addColorStop(1, '#00ccff');
  
  chartContext.strokeStyle = distanceGradient;
  chartContext.lineWidth = 3;
  chartContext.lineCap = 'round';
  chartContext.lineJoin = 'round';
  chartContext.beginPath();
  
  for (let i = 0; i < chartData.distance.length; i++) {
    const x = padding + (i * chartWidth) / (chartData.distance.length - 1);
    const normalizedValue = Math.min(1, chartData.distance[i] / maxDistance);
    const y = height - padding - normalizedValue * chartHeight;
    
    if (i === 0) {
      chartContext.moveTo(x, y);
    } else {
      chartContext.lineTo(x, y);
    }
  }
  chartContext.stroke();
  
  // Draw distance points
  chartContext.fillStyle = '#00ff88';
  for (let i = 0; i < chartData.distance.length; i++) {
    const x = padding + (i * chartWidth) / (chartData.distance.length - 1);
    const normalizedValue = Math.min(1, chartData.distance[i] / maxDistance);
    const y = height - padding - normalizedValue * chartHeight;
    
    chartContext.beginPath();
    chartContext.arc(x, y, 4, 0, Math.PI * 2);
    chartContext.fill();
  }
  
  // Draw light line (orange with gradient)
  const lightGradient = chartContext.createLinearGradient(0, 0, 0, height);
  lightGradient.addColorStop(0, '#ffa500');
  lightGradient.addColorStop(1, '#ff6b6b');
  
  chartContext.strokeStyle = lightGradient;
  chartContext.lineWidth = 3;
  chartContext.beginPath();
  
  for (let i = 0; i < chartData.light.length; i++) {
    const x = padding + (i * chartWidth) / (chartData.light.length - 1);
    const normalizedValue = Math.min(1, chartData.light[i] / maxLight);
    const y = height - padding - normalizedValue * chartHeight;
    
    if (i === 0) {
      chartContext.moveTo(x, y);
    } else {
      chartContext.lineTo(x, y);
    }
  }
  chartContext.stroke();
  
  // Draw light points
  chartContext.fillStyle = '#ffa500';
  for (let i = 0; i < chartData.light.length; i++) {
    const x = padding + (i * chartWidth) / (chartData.light.length - 1);
    const normalizedValue = Math.min(1, chartData.light[i] / maxLight);
    const y = height - padding - normalizedValue * chartHeight;
    
    chartContext.beginPath();
    chartContext.arc(x, y, 4, 0, Math.PI * 2);
    chartContext.fill();
  }
  
  // Draw legend
  chartContext.font = 'bold 14px Gowun Dodum';
  chartContext.textAlign = 'left';
  
  // Distance legend
  chartContext.fillStyle = '#00ff88';
  chartContext.fillRect(padding, 15, 15, 15);
  chartContext.fillStyle = '#ffffff';
  chartContext.fillText('거리 (cm)', padding + 25, 27);
  
  // Light legend
  chartContext.fillStyle = '#ffa500';
  chartContext.fillRect(padding + 120, 15, 15, 15);
  chartContext.fillStyle = '#ffffff';
  chartContext.fillText('조도 (0-1023)', padding + 145, 27);
  
  // Draw time labels on X-axis
  chartContext.fillStyle = 'rgba(255,255,255,0.7)';
  chartContext.font = '11px Gowun Dodum';
  chartContext.textAlign = 'center';
  
  const timeLabels = Math.min(5, chartData.timestamps.length);
  for (let i = 0; i < timeLabels; i++) {
    const idx = Math.floor(i * (chartData.timestamps.length - 1) / (timeLabels - 1));
    const x = padding + (idx * chartWidth) / (chartData.distance.length - 1);
    const time = new Date(chartData.timestamps[idx]);
    const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    chartContext.fillText(timeStr, x, height - padding + 20);
  }
  
  // Draw current values in top right
  if (chartData.distance.length > 0) {
    const lastDistance = chartData.distance[chartData.distance.length - 1];
    const lastLight = chartData.light[chartData.light.length - 1];
    
    chartContext.fillStyle = 'rgba(0, 0, 0, 0.34)';
    chartContext.fillRect(width - rightPadding - 180, padding, 170, 60);
    
    chartContext.font = 'bold 12px Gowun Dodum';
    chartContext.textAlign = 'left';
    chartContext.fillStyle = '#00ff88';
    chartContext.fillText(`거리: ${lastDistance}cm`, width - rightPadding - 170, padding + 20);
    
    chartContext.fillStyle = '#ffa500';
    chartContext.fillText(`조도: ${lastLight}`, width - rightPadding - 170, padding + 45);
  }
}

// Export chart as image
function exportChartImage() {
  if (!chartContext) return;
  
  const canvas = document.getElementById('chart');
  const link = document.createElement('a');
  link.download = `visual-aid-chart-${new Date().toISOString().split('T')[0]}.png`;
  link.href = canvas.toDataURL();
  link.click();
}