module.exports = {
  menu: async ({ sock, msg, from, CONFIG, formatTime }) => {
    const menuText = `╭┈───〔 ${CONFIG.BOT_NAME} 〕┈───⊷
├${CONFIG.BOT_EMOJI} Owner: ${CONFIG.OWNER_NAME}
├📦 Commands: 771
├⏰ Runtime: ${formatTime(process.uptime())}
├🔧 Prefix: ${CONFIG.PREFIX}
├🔒 Mode: ${CONFIG.MODE}
├🆚 Version: ${CONFIG.VERSION}
╰───────────────────⊷

\`『 AI 』\`
╭───────────────────⊷
┋ ⬡ chatgpt, gpt4, gemini, deepseek, claude
┋ ⬡ copilot, mistral, llama, +70 more
╰───────────────────⊷
\`『 DOWNLOAD 』\`
╭───────────────────⊷
┋ ⬡ play, video, song, fb, igdl, tiktok
┋ ⬡ apk, mediafire, +40 more
╰───────────────────⊷
\`『 FUN 』\`
╭───────────────────⊷
┋ ⬡ ship, joke, quote, shayari, hug, kiss
┋ ⬡ slap, dance, cry, +140 more
╰───────────────────⊷
\`『 GROUP 』\`
╭───────────────────⊷
┋ ⬡ kick, add, promote, demote, tagall
┋ ⬡ mute, unmute, delete, link, +25 more
╰───────────────────⊷
\`『 OWNER 』\`
╭───────────────────⊷
┋ ⬡ block, unblock, leave, mode, +15 more
╰───────────────────⊷
\`『 TOOLS 』\`
╭───────────────────⊷
┋ ⬡ sticker, attp, font, removebg, remini
┋ ⬡ upscale, enhance, npm, +160 more
╰───────────────────⊷
\`『 UTILITY 』\`
╭───────────────────⊷
┋ ⬡ alive, ping, uptime, id, fetch, owner
┋ ⬡ channels, convert, praytime, +15 more
╰───────────────────⊷

> © Powered by ${CONFIG.OWNER_NAME}`;
    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  },

  help: async ({ sock, msg, from, CONFIG, formatTime }) => {
    await module.exports.menu({ sock, msg, from, CONFIG, formatTime });
  },

  ping: async ({ sock, msg, from }) => {
    const latency = Date.now() - (msg.messageTimestamp * 1000);
    await sock.sendMessage(from, { text: `🏓 *Pong!* ${latency}ms` }, { quoted: msg });
  },

  ping2: async ({ sock, msg, from }) => {
    const start = Date.now();
    await sock.sendMessage(from, { text: '📊 *Calculating...*' });
    await sock.sendMessage(from, { text: `🏓 *Pong!* ${Date.now() - start}ms (Round Trip)` }, { quoted: msg });
  },

  alive: async ({ sock, msg, from, CONFIG, formatTime }) => {
    await sock.sendMessage(from, { text: `╭┈───〔 ${CONFIG.BOT_NAME} 〕┈───⊷\n├🤖 Status: ✅ Online\n├👑 Owner: ${CONFIG.OWNER_NAME}\n├⏰ Uptime: ${formatTime(process.uptime())}\n├🔒 Mode: ${CONFIG.MODE}\n├🔧 Prefix: ${CONFIG.PREFIX}\n├💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n├🛡️ Crash-Proof: ✅ Active\n├🆚 Version: ${CONFIG.VERSION}\n╰───────────────────⊷\n\n> © ${CONFIG.OWNER_NAME}` }, { quoted: msg });
  },

  uptime: async ({ sock, msg, from, formatTime }) => {
    await sock.sendMessage(from, { text: `⏰ *Bot Uptime:* ${formatTime(process.uptime())}` }, { quoted: msg });
  },

  owner: async ({ sock, msg, from, CONFIG }) => {
    await sock.sendMessage(from, {
      text: `╭┈───〔 OWNER INFO 〕┈───⊷\n├👑 Name: ${CONFIG.OWNER_NAME}\n├📱 Number: +${CONFIG.OWNER_NUMBER}\n├🤖 Bot: ${CONFIG.BOT_NAME}\n├📢 Channels: ${CONFIG.CHANNELS.length}\n╰───────────────────⊷\n\n> © ${CONFIG.OWNER_NAME}`,
      contacts: { displayName: CONFIG.OWNER_NAME, contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${CONFIG.OWNER_NAME}\nTEL;type=CELL;type=VOICE;waid=${CONFIG.OWNER_NUMBER}:+${CONFIG.OWNER_NUMBER}\nEND:VCARD` }] }
    }, { quoted: msg });
  },

  fetch: async ({ sock, msg, from, CONFIG, formatTime }) => {
    await sock.sendMessage(from, { text: `╭┈───〔 ${CONFIG.BOT_NAME} 〕┈───⊷\n├🤖 Bot: ${CONFIG.BOT_NAME}\n├👑 Owner: ${CONFIG.OWNER_NAME}\n├🔧 Prefix: ${CONFIG.PREFIX}\n├🔒 Mode: ${CONFIG.MODE}\n├⏰ Uptime: ${formatTime(process.uptime())}\n├☁️ Platform: Render\n├🟢 Node.js: ${process.version}\n├🆚 Version: ${CONFIG.VERSION}\n╰───────────────────⊷` }, { quoted: msg });
  },

  channels: async ({ sock, msg, from, CONFIG }) => {
    let chText = `╭┈───〔 CHANNELS 〕┈───⊷\n`;
    CONFIG.CHANNELS.forEach((ch, i) => { chText += `├📢 Channel ${i + 1}: ${ch}\n`; });
    chText += `╰───────────────────⊷\n\n> © ${CONFIG.OWNER_NAME}`;
    await sock.sendMessage(from, { text: chText }, { quoted: msg });
  },

  chatgpt: async ({ sock, msg, from, args }) => {
    const q = args.join(' ');
    if (!q) return sock.sendMessage(from, { text: '❌ .chatgpt <question>' }, { quoted: msg });
    try {
      const axios = require('axios');
      const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(q)}`);
      await sock.sendMessage(from, { text: `🤖 *ChatGPT:*\n\n${data?.data || 'No response'}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: '❌ AI busy. Try again.' }, { quoted: msg }); }
  },

  gpt: async ({ sock, msg, from, args }) => { await module.exports.chatgpt({ sock, msg, from, args }); },
  gpt4: async ({ sock, msg, from, args }) => { await module.exports.chatgpt({ sock, msg, from, args }); },
  gemini: async ({ sock, msg, from, args }) => {
    const q = args.join(' ');
    if (!q) return sock.sendMessage(from, { text: '❌ .gemini <question>' }, { quoted: msg });
    try {
      const axios = require('axios');
      const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gemini?query=${encodeURIComponent(q)}`);
      await sock.sendMessage(from, { text: `🌟 *Gemini:*\n\n${data?.data || 'No response'}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: '❌ AI busy.' }, { quoted: msg }); }
  },
  deepseek: async ({ sock, msg, from, args }) => {
    const q = args.join(' ');
    if (!q) return sock.sendMessage(from, { text: '❌ .deepseek <question>' }, { quoted: msg });
    try {
      const axios = require('axios');
      const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek?query=${encodeURIComponent(q)}`);
      await sock.sendMessage(from, { text: `🔍 *DeepSeek:*\n\n${data?.data || 'No response'}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: '❌ AI busy.' }, { quoted: msg }); }
  },

  sticker: async ({ sock, msg, from }) => {
    if (msg.message?.imageMessage) {
      const media = await sock.downloadMediaMessage(msg);
      await sock.sendMessage(from, { sticker: media }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: '❌ Reply to an image with .sticker' }, { quoted: msg });
    }
  },
  s: async ({ sock, msg, from }) => { await module.exports.sticker({ sock, msg, from }); },

  joke: async ({ sock, msg, from }) => {
    const jokes = ['😂 Teacher: Why late?\nStudent: School ahead, go slow!', '🤣 Wife: Buy me something expensive.\nHusband: *buys mirror*', '😆 Doctor, I broke my arm.\nDoctor: Don\'t go there then!'];
    await sock.sendMessage(from, { text: jokes[Math.floor(Math.random()*jokes.length)] }, { quoted: msg });
  },
  quote: async ({ sock, msg, from }) => {
    const q = ['"The only way to do great work is to love what you do." - Steve Jobs', '"Life is what happens when you\'re busy making other plans." - John Lennon', '"Be yourself; everyone else is already taken." - Oscar Wilde'];
    await sock.sendMessage(from, { text: `💬 ${q[Math.floor(Math.random()*q.length)]}` }, { quoted: msg });
  },
  ship: async ({ sock, msg, from, sender, args, CONFIG }) => {
    const u1 = args[0] || sender.split('@')[0], u2 = args[1] || CONFIG.OWNER_NAME;
    const p = Math.floor(Math.random()*101); let e = '💔'; if(p>80) e='💖'; else if(p>50) e='💕'; else if(p>30) e='💗';
    await sock.sendMessage(from, { text: `🚢 Ship: ${u1} + ${u2}\n\n${e} ${p}% Compatible!` }, { quoted: msg });
  },
  hug: async ({ sock, msg, from, sender }) => { await sock.sendMessage(from, { text: `🤗 @${sender.split('@')[0]} hugs everyone! 🫂`, mentions: [sender] }, { quoted: msg }); },
  slap: async ({ sock, msg, from, sender }) => { await sock.sendMessage(from, { text: `👋 @${sender.split('@')[0]} slaps! Ouch! 😂`, mentions: [sender] }, { quoted: msg }); },
  kiss: async ({ sock, msg, from, sender }) => { await sock.sendMessage(from, { text: `😘 @${sender.split('@')[0]} sends a kiss! 💋`, mentions: [sender] }, { quoted: msg }); },
  dance: async ({ sock, msg, from, sender }) => { await sock.sendMessage(from, { text: `💃🕺 @${sender.split('@')[0]} is dancing! 🎶`, mentions: [sender] }, { quoted: msg }); },
  cry: async ({ sock, msg, from, sender }) => { await sock.sendMessage(from, { text: `😢 @${sender.split('@')[0]} is crying... T_T`, mentions: [sender] }, { quoted: msg }); },
  shayari: async ({ sock, msg, from }) => {
    const s = ['💔 Mohabbat woh nahi jo zindagi aasan banaye,\nMohabbat woh hai jo har mushkil mein saath nibhaye.', '✨ Zindagi ek kitaab hai,\nHar din ek naya safha.'];
    await sock.sendMessage(from, { text: s[Math.floor(Math.random()*s.length)] }, { quoted: msg });
  },
  8ball: async ({ sock, msg, from }) => {
    const a = ['Yes!','No.','Maybe...','Definitely!','Ask again.','Absolutely!'];
    await sock.sendMessage(from, { text: `🎱 ${a[Math.floor(Math.random()*a.length)]}` }, { quoted: msg });
  },
  tagall: async ({ sock, msg, from, isGroup }) => {
    if (!isGroup) return;
    const metadata = await sock.groupMetadata(from);
    let t = `📢 *Everyone!*\n\n`; metadata.participants.forEach(p => { t += `@${p.id.split('@')[0]}\n`; });
    await sock.sendMessage(from, { text: t, mentions: metadata.participants.map(p => p.id) });
  },
  delete: async ({ sock, msg, from }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (ctx?.stanzaId) {
      await sock.sendMessage(from, { delete: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant || msg.key.participant } });
    } else { await sock.sendMessage(from, { text: '❌ Reply to a message to delete.' }, { quoted: msg }); }
  },
  del: async ({ sock, msg, from }) => { await module.exports.delete({ sock, msg, from }); },
  mode: async ({ sock, msg, from, isOwner, args, CONFIG }) => {
    if (!isOwner) return;
    const m = args[0]?.toLowerCase();
    if (m === 'public' || m === 'private') { CONFIG.MODE = m; await sock.sendMessage(from, { text: `✅ Mode: ${m}` }, { quoted: msg }); }
    else { await sock.sendMessage(from, { text: '❌ .mode public/private' }, { quoted: msg }); }
  },
  leave: async ({ sock, msg, from, isOwner, isGroup }) => {
    if (!isOwner || !isGroup) return;
    await sock.sendMessage(from, { text: '👋 Bye!' }); await sock.groupLeave(from);
  }
};
