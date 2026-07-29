const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const http = require('http');
const CONFIG = require('./config');
const { formatTime } = require('./lib/functions');

// ==================== CRASH-PROOF ====================
process.on('uncaughtException', (err) => console.error('Uncaught:', err.message));
process.on('unhandledRejection', (reason) => console.error('Rejection:', reason));

// ==================== LOAD PLUGINS ====================
const plugins = {};
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
  fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js')).forEach(file => {
    const plugin = require(path.join(pluginsDir, file));
    Object.assign(plugins, plugin);
  });
}
console.log(`Loaded ${Object.keys(plugins).length} command categories`);

// ==================== SERVER ====================
const server = http.createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/pair') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><title>${CONFIG.BOT_NAME} - Pair</title>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0a;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}.box{background:#1a1a1a;border-radius:15px;padding:30px;max-width:450px;width:100%;text-align:center;border:1px solid #333}h2{color:#00ff88;margin-bottom:5px}.sub{color:#aaa;font-size:14px;margin-bottom:20px}input{width:100%;padding:14px;border-radius:10px;border:1px solid #444;background:#222;color:#fff;font-size:16px;margin-bottom:15px;outline:0}button{width:100%;padding:14px;border-radius:10px;background:#00ff88;color:#000;font-weight:700;font-size:16px;border:0;cursor:pointer}button:hover{background:#00cc66}button:disabled{background:#555}#result{margin-top:20px;padding:15px;border-radius:10px;background:#222;display:none;word-break:break-all;font-size:18px;color:#00ff88}.info{color:#888;font-size:12px;margin-top:20px}</style></head>
<body><div class="box"><h2>🤖 ${CONFIG.BOT_NAME}</h2><p class="sub">Professional Pairing Code Generator</p>
<input id="number" placeholder="WhatsApp Number (923xxxxxxxxxx)" value="${CONFIG.OWNER_NUMBER}"/>
<button id="btn" onclick="getCode()">Get Pairing Code</button>
<div id="result"></div><p class="info">Owner: ${CONFIG.OWNER_NAME} | v${CONFIG.VERSION}</p></div>
<script>async function getCode(){const n=document.getElementById('number').value.trim(),r=document.getElementById('result'),b=document.getElementById('btn');if(!n){r.style.display='block';r.style.color='#ff4444';r.innerText='Enter valid number!';return}b.disabled=true;b.innerText='Generating...';r.style.display='block';r.style.color='#ffaa00';r.innerText='Please wait...';try{const d=await fetch('/code?number='+n),j=await d.json();if(j.code){r.style.color='#00ff88';r.innerHTML='<b>Your Pairing Code:</b><br><span style="font-size:36px;font-weight:bold;letter-spacing:3px">'+j.code+'</span>'}else{r.style.color='#ff4444';r.innerText='Error: '+ (j.error||'Try again')}}catch(e){r.style.color='#ff4444';r.innerText='Error. Try again.'}b.disabled=false;b.innerText='Get Pairing Code'}</script></body></html>`);
  } else if (req.url.startsWith('/code')) {
    const u = new URL(req.url, `http://localhost:${CONFIG.PORT}`).searchParams;
    const number = u.get('number');
    if (!number) { res.writeHead(400, {'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Number required'})); }
    const result = await getPairCode(number);
    res.writeHead(result.error?500:200, {'Content-Type':'application/json'});
    res.end(JSON.stringify(result));
  } else if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'ok',bot:CONFIG.BOT_NAME,uptime:process.uptime()}));
  } else {
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end(`${CONFIG.BOT_NAME} is running!`);
  }
});
server.listen(CONFIG.PORT, () => console.log(`Server: http://localhost:${CONFIG.PORT}`));

async function getPairCode(phoneNumber) {
  const dir = `pair_${Date.now()}`;
  try {
    const { state } = await useMultiFileAuthState(dir);
    const { version } = await fetchLatestBaileysVersion();
    const s = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: [CONFIG.BOT_NAME,'Chrome','1.0.0'] });
    const code = await Promise.race([s.requestPairingCode(phoneNumber), new Promise((_,r)=>setTimeout(()=>r(new Error('Timeout')),45000))]);
    try{fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
    return {code};
  } catch(e) {
    try{fs.rmSync(dir,{recursive:true,force:true})}catch(e2){}
    return {error:e.message};
  }
}

// ==================== BOT START ====================
const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version, auth: state, printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: [CONFIG.BOT_NAME, 'Safari', '7.0.0'],
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
    });
    store.bind(sock.ev);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'open') {
        console.log(`${CONFIG.BOT_NAME} Connected!`);
        if (CONFIG.AUTO_FOLLOW) {
          for (const ch of CONFIG.CHANNELS) {
            try { await sock.newsletterFollow(`${ch.split('/').pop()}@newsletter`); } catch {}
          }
        }
        await sock.sendMessage(`${CONFIG.OWNER_NUMBER}@s.whatsapp.net`, {
          text: `╭┈───〔 ${CONFIG.BOT_NAME} 〕┈───⊷\n├🤖 Status: ✅ Connected\n├👑 Owner: ${CONFIG.OWNER_NAME}\n├📦 Commands: 771\n├🔒 Mode: ${CONFIG.MODE}\n├🛡️ Crash-Proof: Active\n├🆚 Version: ${CONFIG.VERSION}\n╰───────────────────⊷\n\n> Type .menu for commands`
        });
      }
      if (connection === 'close') {
        const re = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (re) { setTimeout(startBot, 3000); }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const isOwner = sender.includes(CONFIG.OWNER_NUMBER);

        if (CONFIG.AUTOREAD) await sock.readMessages([msg.key]);

        let text = '';
        if (msg.message.conversation) text = msg.message.conversation;
        else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
        else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption;
        else if (msg.message.videoMessage?.caption) text = msg.message.videoMessage.caption;

        if (!text || !text.startsWith(CONFIG.PREFIX)) continue;
        const args = text.slice(CONFIG.PREFIX.length).trim().split(/ +/);
        const cmd = args.shift()?.toLowerCase();

        if (CONFIG.REACT_EMOJI) await sock.sendMessage(from, { react: { text: CONFIG.REACT_EMOJI, key: msg.key } });

        let handled = false;
        for (const [cat, cmds] of Object.entries(plugins)) {
          if (cmds[cmd]) {
            await cmds[cmd]({ sock, msg, from, sender, isGroup, isOwner, args, CONFIG, store, formatTime });
            handled = true; break;
          }
        }
        if (!handled) {
          await sock.sendMessage(from, { text: `❌ Unknown: *${CONFIG.PREFIX}${cmd}*\nType ${CONFIG.PREFIX}menu` }, { quoted: msg });
        }
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      const { id, participants, action } = update;
      if (action === 'add' && CONFIG.WELCOME) {
        for (const user of participants) {
          await sock.sendMessage(id, { text: CONFIG.WELCOME_MSG.replace('@user',`@${user.split('@')[0]}`).replace('@group','the group'), mentions: [user] });
        }
      }
      if (action === 'remove' && CONFIG.GOODBYE) {
        for (const user of participants) {
          await sock.sendMessage(id, { text: CONFIG.GOODBYE_MSG.replace('@user',`@${user.split('@')[0]}`), mentions: [user] });
        }
      }
    });

  } catch (err) {
    console.error('Bot Error:', err.message);
    setTimeout(startBot, 5000);
  }
}
startBot();
