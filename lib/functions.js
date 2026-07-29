const axios = require('axios');

module.exports = {
  formatTime: (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const d = Math.floor(h / 24);
    return d > 0 ? `${d}d ${h % 24}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`;
  },

  getBuffer: async (url) => {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    } catch { return null; }
  },

  fetchJson: async (url) => {
    try {
      const res = await axios.get(url);
      return res.data;
    } catch { return null; }
  },

  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  getRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],

  isUrl: (text) => {
    return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi));
  }
};
