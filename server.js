const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path'); 
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '.')));

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await auth.getUserByEmail(email);
    res.json({ success: true, user: { email: userRecord.email } });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器運行在連接埠 ${PORT}`);
});