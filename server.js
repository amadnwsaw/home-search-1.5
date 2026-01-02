// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const fetch = require('node-fetch'); // 如果 Node 18+ 可改用 global fetch

// === Firebase 初始化 ===
const serviceAccount = require('./firebase-service-account.json'); // 下載的 JSON
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const SEARCH_COLLECTION = 'searchRecords';

// === Express 初始化 ===
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// === 搜尋紀錄 API ===
app.post('/api/search', async (req, res) => {
  try {
    const { query, user } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const record = {
      query,
      user: user || 'anonymous',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(SEARCH_COLLECTION).add(record);

    res.json({ success: true, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === AI 關鍵字建議 API ===
app.post('/api/ai-suggest', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    // === Gemini API 範例呼叫 ===
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Gemini API key not set' });

    const prompt = `給我10個關於「${query}」的搜尋建議`;

    const response = await fetch('https://api.gemini.example.com/v1/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    // 假設 data.suggestions 是陣列
    res.json({ suggestions: data.suggestions || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === 搜尋統計 API ===
app.get('/api/stats', async (req, res) => {
  try {
    const snapshot = await db.collection(SEARCH_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const records = snapshot.docs.map(doc => doc.data());
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === 啟動 Server ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
