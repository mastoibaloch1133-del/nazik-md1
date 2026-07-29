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

process.on('uncaughtException', (err) => console.error('Uncaught:', err.message));
process.on('unhandledRejection', (reason) => console.error('Rejection:', reason));

const plugins = {};
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
  fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js')).forEach(file => {
    const plugin = require(path.join(pluginsDir, file));
    Object.assign(plugins, plugin);
  });
}
console.log('Plugins loaded:', Object.keys(plugins).length);

const server = http.createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/pair') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getPairHTML());
  } else if (req.url.startsWith('/code')) {
    const u = new URL(req.url, 'http://localhost:' + CONFIG.PORT).searchParams;
    const number = u.get('number');
    if (!number) { res.writeHead(400); return res.end(JSON.stringify({error:'Number required'})); }
    const result = await getPairCode(number);
    res.writeHead(result.error ? 500 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({status:'ok',bot:CONFIG.BOT_NAME,uptime:process.uptime()}));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(CONFIG.BOT_NAME + ' is running!');
  }
});

function getPairHTML() {
  return '<!DOCTYPE html><html><head><title>' + CONFIG.BOT_NAME + ' - Pair</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0a;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}.box{background:#1a1a1a;border-radius:15px;padding:30px;max-width:450px;width:100%;text-align:center;border:1px solid #333}h2{color:#00ff88}input{width:100%;padding:14px;border-radius:10px;border:1px solid #444;background:#222;color:#fff;font-size:16px;margin:15px 0;outline:0}button{width:100%;padding:14px;border-radius:10px;background:#00ff88;color:#000;font-weight:700;font-size:16px;border:0;cursor:pointer}button:hover{background:#00cc66}button:disabled{background:#555}#result{margin-top:20px;padding:15px;border-radius:10px;background:#222;display:none;word-break:break-all;font-size:18px;color:#00ff88}.info{color:#888;font-size:12px;margin-top:20px}</style></head><body><div class="box"><h2>' + CONFIG.BOT_EMOJI + ' ' + CONFIG.BOT_NAME + '</h2><p class="sub">Pairing Code Generator</p><input id="number" placeholder="923xxxxxxxxxx" value="' + CONFIG.OWNER_NUMBER + '"/><button id="btn" onclick="getCode()">Get Pairing Code</button><div id="result"></div><p class="info">Owner: ' + CONFIG.OWNER_NAME + '</p></div><script>async function getCode(){var n=document.getElementById("number").value.trim(),r=document.getElementById("result"),b=document.getElementById("btn");if(!n){r.style.display="block";r.style.color="#ff4444";r.innerText="Enter number!";return}b.disabled=true;b.innerText="Generating...";r.style.display="block";r.style.color="#ffaa00";r.innerText="Please wait...";try{var d=await fetch("/code?number="+n),j=await d.json();if(j.code){r.style.color="#00ff88";r.innerHTML="<b>Your Code:</b><br><span style=font-size:36px;font-weight:bold;letter-spacing:3px>"+j.code+"</span>"}else{r.style.color="#ff4444";r.innerText="Error: "+(j.error||"Try again")}}catch(e){r.style.color="#ff4444";r.innerText="Error"}b.disabled=false;b.innerText="Get Pairing Code"}</script></body></html>';
}

server.listen(CONFIG.PORT, () => console.log('Server on port ' + CONFIG.PORT));

async function getPairCode(phoneNumber) {
  const dir = 'pair_' + Date.now();
  try {
    const { state } = await useMultiFileAuthState(dir);
    const { version } = await fetchLatestBaileysVersion();
    const s = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: [CONFIG.BOT_NAME,'Chrome','1.0.0'] });
    const code = await Promise.race([s.requestPairingCode(phoneNumber), new Promise(function(_,r){setTimeout(function(){r(new Error('Timeout'))},45000)})]);
    try{fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
    return {code:code};
  } catch(e) {
    try{fs.rmSync(dir,{recursive:true,force:true})}catch(e2){}
    return {error:e.message};
  }
}

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
      connectTimeoutMs: 60000
    });
    store.bind(sock.ev);

    sock.ev.on('connection.update', async function(update) {
      var connection = update.connection, lastDisconnect = update.lastDisconnect;
      if (connection === 'open') {
        console.log(CONFIG.BOT_NAME + ' Connected!');
        if (CONFIG.AUTO_FOLLOW) {
          for (var i = 0; i < CONFIG.CHANNELS.length; i++) {
            try { await sock.newsletterFollow(CONFIG.CHANNELS[i].split('/').pop() + '@newsletter'); } catch(e) {}
          }
        }
        await sock.sendMessage(CONFIG.OWNER_NUMBER + '@s.whatsapp.net', {
          text: '\u256d\u2508\u2508\u2508\u2500\u2500\u2500\u3010 ' + CONFIG.BOT_NAME + ' \u3011\u2500\u2500\u2500\u2508\u2508\u2508\u22b7\n\u251c' + CONFIG.BOT_EMOJI + ' Status: \u2705 Connected\n\u251c\ud83d\udc51 Owner: ' + CONFIG.OWNER_NAME + '\n\u251c\ud83d\udce6 Commands: 771\n\u251c\ud83d\udd12 Mode: ' + CONFIG.MODE + '\n\u251c\ud83d\udee1\ufe0f Crash-Proof: Active\n\u251c\ud83c\udd9a Version: ' + CONFIG.VERSION + '\n\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u22b7\n\n> Type .menu for commands'
        });
      }
      if (connection === 'close') {
        var re = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
        if (re) { setTimeout(startBot, 3000); }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async function(messages) {
      for (var i = 0; i < messages.messages.length; i++) {
        var msg = messages.messages[i];
        if (!msg.message || msg.key.fromMe) continue;
        var from = msg.key.remoteJid;
        var sender = msg.key.participant || msg.key.remoteJid;
        var isGroup = from.endsWith('@g.us');
        var isOwner = sender.includes(CONFIG.OWNER_NUMBER);

        if (CONFIG.AUTOREAD) await sock.readMessages([msg.key]);

        var text = '';
        if (msg.message.conversation) text = msg.message.conversation;
        else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) text = msg.message.extendedTextMessage.text;
        else if (msg.message.imageMessage && msg.message.imageMessage.caption) text = msg.message.imageMessage.caption;

        if (!text || !text.startsWith(CONFIG.PREFIX)) continue;
        var args = text.slice(CONFIG.PREFIX.length).trim().split(/ +/);
        var cmd = args.shift().toLowerCase();

        if (CONFIG.REACT_EMOJI) await sock.sendMessage(from, { react: { text: CONFIG.REACT_EMOJI, key: msg.key } });

        var handled = false;
        var categories = Object.entries(plugins);
        for (var c = 0; c < categories.length; c++) {
          var cmds = categories[c][1];
          if (cmds[cmd]) {
            await cmds[cmd]({ sock: sock, msg: msg, from: from, sender: sender, isGroup: isGroup, isOwner: isOwner, args: args, CONFIG: CONFIG, store: store, formatTime: formatTime });
            handled = true;
            break;
          }
        }
        if (!handled) {
          await sock.sendMessage(from, { text: 'Unknown: ' + CONFIG.PREFIX + cmd + '\nType ' + CONFIG.PREFIX + 'menu' }, { quoted: msg });
        }
      }
    });

  } catch(err) {
    console.error('Bot Error:', err.message);
    setTimeout(startBot, 5000);
  }
}
startBot();
