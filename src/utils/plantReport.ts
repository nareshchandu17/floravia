import { DashboardPlant } from '../types/botanical';

/**
 * Generates a clean, standalone, printable HTML document containing the plant's current health status,
 * biophysical bio-signature, and recent care history.
 */
export function generatePrintablePlantReportHtml(plant: DashboardPlant): string {
  const bio = plant.bioSignature || {
    stomatalConductance: '0.42 mol/m²·s (Optimal)',
    chlorophyllFluorescence: 'Fv/Fm = 0.83 (Pristine)',
    turgorPressure: '0.85 MPa (Full Hydration)',
    photoperiodicPhase: 'Diurnal Peak Synthesis',
    cellularHydrationIndex: 96,
    metabolicEfficiency: 94
  };

  const generatedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const generatedTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const timelineRows = (plant.timeline || []).map(item => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; font-weight: 500;">${item.date}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${item.action}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; background: #ecfdf5; color: #065f46; font-weight: 600; text-transform: uppercase; font-size: 10px;">
          ${item.type}
        </span>
      </td>
    </tr>
  `).join('');

  const trendRows = (plant.healthOverview?.trend || []).map(t => `
    <div style="display: flex; flex-direction: column; align-items: center; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; min-width: 75px;">
      <span style="font-size: 11px; color: #64748b; margin-bottom: 2px;">${t.date}</span>
      <span style="font-size: 15px; font-weight: 700; color: #059669;">${t.score}%</span>
      <span style="font-size: 10px; color: #94a3b8;">${t.mood || 'Healthy'}</span>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Botanical Health Report - ${plant.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #059669;
      margin-bottom: 4px;
    }
    .plant-heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: #064e3b;
      line-height: 1.2;
    }
    .scientific-name {
      font-style: italic;
      font-size: 14px;
      color: #475569;
      margin-top: 2px;
    }
    .meta-details {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .score-badge-card {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 12px 18px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .score-number {
      font-size: 32px;
      font-weight: 800;
      color: #047857;
      line-height: 1;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .card-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
    .metric-row:last-child {
      border-bottom: none;
    }
    .metric-label {
      color: #64748b;
    }
    .metric-val {
      font-weight: 600;
      color: #0f172a;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      border-left: 4px solid #10b981;
      padding-left: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
    }
    .print-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 18px;
    }
    .btn-print {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print:hover {
      background: #059669;
    }
    .footer-notice {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .report-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .print-actions {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="report-container">
    <div class="print-actions">
      <button class="btn-print" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
    </div>

    <!-- Header Section -->
    <div class="header-bar">
      <div>
        <div class="brand-title">Floravia Botanical Intelligence</div>
        <h1 class="plant-heading">${plant.name}${plant.nickname ? ` <span style="font-size: 18px; color: #059669; font-family: 'Plus Jakarta Sans'; font-weight: 500;">("${plant.nickname}")</span>` : ''}</h1>
        <div class="scientific-name">${plant.scientificName}</div>
      </div>
      <div class="meta-details">
        <div><strong>Date:</strong> ${generatedDate}</div>
        <div><strong>Generated:</strong> ${generatedTime}</div>
        <div><strong>Identification Score:</strong> ${plant.matchScore}% (${plant.confidence})</div>
      </div>
    </div>

    <!-- Health Overview & Key Status -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;">
      <div class="score-badge-card" style="margin-bottom: 0;">
        <div class="score-number">${plant.healthScore}%</div>
        <div>
          <div style="font-size: 14px; font-weight: 700; color: #065f46;">${plant.vigorIndexLabel}</div>
          <div style="font-size: 12px; color: #047857;">Overall Botanical Health Status</div>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <div style="padding: 8px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 12px;">
          <span style="color: #065f46; font-weight: 500;">Hydration:</span> <strong style="color: #047857;">${plant.hydrationStatus}</strong>
        </div>
        <div style="padding: 8px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 12px;">
          <span style="color: #065f46; font-weight: 500;">Pathology Risk:</span> <strong style="color: #047857;">${plant.pathologyRisk}</strong>
        </div>
        <div style="padding: 8px 14px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; font-size: 12px;">
          <span style="color: #5b21b6; font-weight: 500;">Neural Stress:</span> <strong style="color: #6d28d9;">${plant.neuralStress}</strong>
        </div>
      </div>
    </div>

    <!-- Two-column: Bio-Signature & Recent Care Metrics -->
    <div class="grid-2">
      <!-- Neural Bio-Signature -->
      <div class="card-box">
        <div class="card-title">🔬 Neural Bio-Signature Analysis</div>
        <div class="metric-row">
          <span class="metric-label">Cellular Hydration Index:</span>
          <span class="metric-val" style="color: #0284c7;">${bio.cellularHydrationIndex}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Metabolic Efficiency:</span>
          <span class="metric-val" style="color: #059669;">${bio.metabolicEfficiency}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Stomatal Conductance:</span>
          <span class="metric-val">${bio.stomatalConductance}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Chlorophyll Fluorescence:</span>
          <span class="metric-val">${bio.chlorophyllFluorescence}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Cellular Turgor Pressure:</span>
          <span class="metric-val">${bio.turgorPressure}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Photoperiodic Phase:</span>
          <span class="metric-val">${bio.photoperiodicPhase}</span>
        </div>
      </div>

      <!-- Care History & Milestones -->
      <div class="card-box">
        <div class="card-title">📅 Care Schedule & Milestones</div>
        <div class="metric-row">
          <span class="metric-label">Last Watered:</span>
          <span class="metric-val">${plant.healthOverview?.lastWatered || 'Recently'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Last Fertilized:</span>
          <span class="metric-val">${plant.healthOverview?.lastFertilized || '4 days ago'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Next Scheduled Watering:</span>
          <span class="metric-val" style="color: #0284c7;">${plant.healthOverview?.nextWatering || 'In 2 days'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Next Scheduled Pruning:</span>
          <span class="metric-val">${plant.healthOverview?.nextPruning || 'In 12 days'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Local Environment:</span>
          <span class="metric-val">${plant.weatherInsight?.city || 'Local Area'} (${plant.weatherInsight?.temp || 27}°C, ${plant.weatherInsight?.humidity || 50}% RH)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">AI Mood Assessment:</span>
          <span class="metric-val" style="color: #059669;">${plant.aiAssessment?.mood || plant.mood || 'Thriving'}</span>
        </div>
      </div>
    </div>

    <!-- Care Essentials & Environment Standards -->
    <div style="margin-bottom: 24px;">
      <div class="section-title">Care Essentials & Environment Standards</div>
      <div class="grid-4">
        <div class="card-box" style="padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Watering</div>
          <div style="font-size: 13px; font-weight: 700; color: #0284c7; margin-top: 4px;">${plant.careEssentials?.water || 'Every 2-3 days'}</div>
        </div>
        <div class="card-box" style="padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Light Exposure</div>
          <div style="font-size: 13px; font-weight: 700; color: #d97706; margin-top: 4px;">${plant.careEssentials?.light || 'Bright Indirect'}</div>
        </div>
        <div class="card-box" style="padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Temperature</div>
          <div style="font-size: 13px; font-weight: 700; color: #e11d48; margin-top: 4px;">${plant.careEssentials?.temp || '18–26°C'}</div>
        </div>
        <div class="card-box" style="padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Air & Humidity</div>
          <div style="font-size: 13px; font-weight: 700; color: #059669; margin-top: 4px;">${plant.careEssentials?.air || '50–70% RH'}</div>
        </div>
      </div>
      <div class="card-box" style="font-size: 12px; color: #334155; line-height: 1.6;">
        <strong>Diagnostic Summary: </strong>${plant.careEssentials?.summary || plant.careInstructions?.detailedText || 'Plant is exhibiting healthy cellular vigor with balanced transpiration.'}
      </div>
    </div>

    <!-- Health Score Trend History (if present) -->
    ${trendRows ? `
    <div style="margin-bottom: 24px;">
      <div class="section-title">Health Score History Trend</div>
      <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px;">
        ${trendRows}
      </div>
    </div>
    ` : ''}

    <!-- Recent Care Activity Log -->
    ${timelineRows ? `
    <div style="margin-bottom: 24px;">
      <div class="section-title">Recent Care Activity History</div>
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Action Performed</th>
              <th>Event Type</th>
            </tr>
          </thead>
          <tbody>
            ${timelineRows}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer-notice">
      <div>Floravia Botanical Intelligence Platform • Automated Plant Telemetry Report</div>
      <div>Confidential Botanical Diagnostic • Page 1 of 1</div>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Triggers a browser download of the formatted plant report.
 */
export function downloadPlantReport(plant: DashboardPlant): void {
  const htmlContent = generatePrintablePlantReportHtml(plant);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const sanitizedName = (plant.nickname || plant.name)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `Floravia_Report_${sanitizedName}_${dateStamp}.html`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
