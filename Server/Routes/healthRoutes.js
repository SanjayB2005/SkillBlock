const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// HTML template for health status
const getHealthHTML = (data) => `
<!DOCTYPE html>
<html>
<head>
    <title>SkillBlock Server Status</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            margin: 0;
            padding: 2rem;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            border-bottom: 2px solid #334155;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        .title {
            font-size: 2rem;
            font-weight: bold;
            color: #60a5fa;
            margin: 0;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .status-item {
            background: #334155;
            padding: 1rem;
            border-radius: 8px;
        }
        .status-label {
            color: #94a3b8;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
        }
        .status-value {
            font-size: 1.25rem;
            font-weight: 600;
        }
        .status-value.success {
            color: #4ade80;
        }
        .status-value.warning {
            color: #fbbf24;
        }
        .status-value.error {
            color: #f87171;
        }
        .uptime {
            font-size: 0.875rem;
            color: #94a3b8;
            text-align: right;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">SkillBlock Server Status</h1>
        </div>
        <div class="status-grid">
            <div class="status-item">
                <div class="status-label">Server Status</div>
                <div class="status-value success">${data.status}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Database Status</div>
                <div class="status-value ${data.database === 'connected' ? 'success' : 'error'}">
                    ${data.database}
                </div>
            </div>
            <div class="status-item">
                <div class="status-label">Memory Usage</div>
                <div class="status-value warning">${data.memoryUsage}</div>
            </div>
            <div class="status-item">
                <div class="status-label">CPU Load</div>
                <div class="status-value">${data.cpuLoad}%</div>
            </div>
        </div>
        <div class="uptime">
            Last updated: ${new Date(data.timestamp).toLocaleString()}
            <br>
            Uptime: ${data.uptime}
        </div>
    </div>
</body>
</html>
`;

router.get('/', async (req, res) => {
    const startTime = process.uptime();
    const uptimeHours = Math.floor(startTime / 3600);
    const uptimeMinutes = Math.floor((startTime % 3600) / 60);
    const uptimeSeconds = Math.floor(startTime % 60);

    const healthData = {
        status: 'Running',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
        timestamp: new Date(),
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        cpuLoad: Math.round(process.cpuUsage().user / 1000000),
        node_version: process.version,
        platform: process.platform
    };

    // Check if the request wants JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json(healthData);
    }

    // Otherwise return HTML
    res.send(getHealthHTML(healthData));
});

module.exports = router;