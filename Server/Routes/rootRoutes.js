const express = require('express');
const router = express.Router();

const getRootHTML = () => `
<!DOCTYPE html>
<html>
<head>
    <title>SkillBlock API</title>
    <link rel="icon" type="image/x-icon" href="data:image/x-icon;,">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            margin: 0;
            padding: 2rem;
            line-height: 1.6;
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
            text-align: center;
            margin-bottom: 2rem;
        }
        .title {
            font-size: 2.5rem;
            font-weight: bold;
            color: #60a5fa;
            margin: 0;
        }
        .subtitle {
            color: #94a3b8;
            font-size: 1.2rem;
            margin-top: 1rem;
        }
        .links {
            margin-top: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            text-align: center;
        }
        .link {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .link:hover {
            background: #2563eb;
            transform: translateY(-2px);
        }
        .version {
            text-align: center;
            color: #64748b;
            margin-top: 2rem;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">SkillBlock API</h1>
            <p class="subtitle">Decentralized Freelancing Platform Backend</p>
        </div>
        <div class="links">
            <a href="/api/health" class="link">Server Status</a>
            <a href="/api/projects" class="link">Projects API</a>
            <a href="/api/proposals" class="link">Proposals API</a>
            <a href="/api/users" class="link">Users API</a>
        </div>
        <div class="version">
            Version: 1.0.0<br>
            Node.js ${process.version}<br>
            Environment: ${process.env.NODE_ENV || 'development'}
        </div>
    </div>
</body>
</html>
`;

router.get('/', (req, res) => {
    res.send(getRootHTML());
});

module.exports = router;