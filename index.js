const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const API_KEY = process.env.UPSTOX_API_KEY;
const API_SECRET = process.env.UPSTOX_API_SECRET;
const REDIRECT = 'https://nodejs-production-e2b2.up.railway.app/callback';

let token = '';

app.get('/', (req,res) => res.send('ELITE Signal Server Running!'));

app.get('/status', (req,res) => res.json({status:'ok', loggedIn:!!token}));

app.get('/login', (req,res) => {
  const url = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
  res.redirect(url);
});

app.get('/callback', async (req,res) => {
  try {
    const r = await axios.post('https://api.upstox.com/v2/login/authorization/token',
      new URLSearchParams({code:req.query.code, client_id:API_KEY, client_secret:API_SECRET, redirect_uri:REDIRECT, grant_type:'authorization_code'}),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    );
    token = r.data.access_token;
    res.send('<h2 style="color:green;font-family:monospace">✅ Login ho gaya! Ab sumitnetlify.netlify.app kholo!</h2>');
  } catch(e) {
    res.send('Error: ' + (e.response?.data?.message || e.message));
  }
});

app.get('/quotes', async (req,res) => {
  if(!token) return res.status(401).json({error:'Login karo pehle'});
  try {
    const r = await axios.get(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${req.query.keys}`,
      {headers:{Authorization:'Bearer '+token}});
    res.json(r.data);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/candles', async (req,res) => {
  if(!token) return res.status(401).json({error:'Login karo pehle'});
  try {
    const r = await axios.get(`https://api.upstox.com/v2/historical-candle/${req.query.key}/${req.query.interval}/${req.query.to}/${req.query.from}`,
      {headers:{Authorization:'Bearer '+token}});
    res.json(r.data);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.listen(process.env.PORT||3000, () => console.log('Server ready!'));
