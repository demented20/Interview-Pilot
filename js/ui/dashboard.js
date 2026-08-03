/**
 * Report / Dashboard screen
 */
import { showScreen } from './router.js';

let radarChart = null;

export function initDashboard() {
  const exportBtn = document.getElementById('btn-export-report');
  const newBtn = document.getElementById('btn-new-interview');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('report:export'));
    });
  }

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      showScreen('setup');
    });
  }
}

export function renderReport(reportData) {
  if (!reportData) return;

  // Overall score
  const scoreEl = document.getElementById('report-overall-score');
  if (scoreEl) {
    scoreEl.textContent = reportData.totalScore;
    scoreEl.style.color = scoreColor(reportData.totalScore);
  }

  // Summary text
  const summaryEl = document.getElementById('report-summary-text');
  if (summaryEl) {
    summaryEl.textContent = getSummaryMessage(reportData.totalScore);
  }

  // Category list
  const catList = document.getElementById('report-category-scores');
  if (catList) {
    const labels = {
      technicalAccuracy: 'Technical Accuracy',
      communication: 'Communication',
      clarity: 'Clarity',
      confidence: 'Confidence',
      problemSolving: 'Problem Solving'
    };
    catList.innerHTML = Object.entries(reportData.categoryAverages || {})
      .map(([key, val]) => `
        <div class="cat-row">
          <span>${labels[key] || key}</span>
          <strong style="color:${scoreColor(val)}">${val}</strong>
        </div>
      `)
      .join('');
  }

  // Improvement plan
  const planEl = document.getElementById('improvement-plan');
  if (planEl) {
    planEl.innerHTML = '';
    (reportData.improvementPlan || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      planEl.appendChild(li);
    });
  }

  // Radar chart
  renderRadarChart(reportData.categoryAverages || {});
}

function renderRadarChart(categoryAverages) {
  const canvas = document.getElementById('radar-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = [
    'Technical',
    'Communication',
    'Clarity',
    'Confidence',
    'Problem Solving'
  ];
  const data = [
    categoryAverages.technicalAccuracy || 0,
    categoryAverages.communication || 0,
    categoryAverages.clarity || 0,
    categoryAverages.confidence || 0,
    categoryAverages.problemSolving || 0
  ];

  if (radarChart) {
    radarChart.destroy();
  }

  radarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Your Score',
        data,
        fill: true,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: '#4f46e5',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            display: false
          },
          pointLabels: {
            font: { size: 11 }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function scoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#4f46e5';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getSummaryMessage(score) {
  if (score >= 85) return 'Outstanding performance! You are interview-ready.';
  if (score >= 70) return 'Strong performance. A few refinements will make you even better.';
  if (score >= 55) return 'Solid foundation. Focus on the improvement plan below.';
  if (score >= 40) return 'You have potential. Consistent practice will raise your scores quickly.';
  return 'Keep practicing — every session builds confidence and clarity.';
}
