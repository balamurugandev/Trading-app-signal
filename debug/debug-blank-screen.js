#!/usr/bin/env node

// Debug script to test the live data toggle without the full app
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data endpoints
app.get('/api/data/current/NIFTY', (req, res) => {
    res.json({
        data: {
            ltp: 24363.30,
            change: -232.85,
            changePercent: -0.95,
            timestamp: new Date().toISOString(),
            isMarketOpen: false
        },
        isLive: true,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/data/current/BANKNIFTY', (req, res) => {
    res.json({
        data: {
            ltp: 55004.90,
            change: -516.25,
            changePercent: -0.93,
            timestamp: new Date().toISOString(),
            isMarketOpen: false
        },
        isLive: true,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/data/status', (req, res) => {
    res.json({
        status: {
            isLiveMode: true,
            isDemoMode: false,
            providerStatus: 'Yahoo Finance',
            lastUpdate: new Date().toISOString()
        },
        marketStatus: {
            isOpen: false,
            isLiquidWindow: false,
            currentTime: new Date().toISOString(),
            session: 'CLOSED'
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/data/enable-live', (req, res) => {
    res.json({
        success: true,
        message: 'Live data mode enabled',
        status: {
            isLiveMode: true,
            isDemoMode: false,
            providerStatus: 'Yahoo Finance'
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/data/disable-live', (req, res) => {
    res.json({
        success: true,
        message: 'Demo mode enabled',
        status: {
            isLiveMode: false,
            isDemoMode: true,
            providerStatus: 'Demo'
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        marketOpen: false,
        liquidWindow: false,
        timestamp: new Date().toISOString()
    });
});

// Redirect root to help with debugging
app.get('/', (req, res) => {
    res.send(`
        <h1>Debug Server Running</h1>
        <p>Server is running on port 3001</p>
        <p>Test endpoints:</p>
        <ul>
            <li><a href="/api/health">/api/health</a></li>
            <li><a href="/api/data/status">/api/data/status</a></li>
            <li><a href="/api/data/current/NIFTY">/api/data/current/NIFTY</a></li>
            <li><a href="/api/data/current/BANKNIFTY">/api/data/current/BANKNIFTY</a></li>
        </ul>
        <p>Client should be at: <a href="http://localhost:5173">http://localhost:5173</a></p>
    `);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🔧 Debug server running on http://localhost:${PORT}`);
    console.log('📊 All API endpoints are mocked and working');
    console.log('🌐 Start your client and test the live data toggle');
    console.log('⏹️  Press Ctrl+C to stop');
});