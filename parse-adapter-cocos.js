/**
 * Parse Adapter for Soccer/Dice Game (Game 1)
 * تهيئة Parse SDK والاتصال بـ Parse Server
 * مع قراءة sessionToken من الـ URL
 */

class ParseGameAdapter {
  constructor(config = {}) {
    // قراءة المعاملات من الـ URL
    const urlParams = new URLSearchParams(window.location.search);

    this.config = {
      appId: config.appId || urlParams.get('appId') || 'spp111424242ssdsd',
      serverURL:
        config.serverURL ||
        urlParams.get('serverURL') ||
        'https://parse410.onrender.com/parse',
      sessionToken:
        config.sessionToken || urlParams.get('sessionToken') || null,
      ...config
    };

    this.initialized = false;
    this.user = null;

    this.status = {
      parseLoaded: false,
      initialized: false,
      authenticated: false,
      urlParams: {
        appId: this.config.appId,
        serverURL: this.config.serverURL,
        sessionToken: this.config.sessionToken ? 'present' : 'missing'
      },
      errors: []
    };

    console.log('🎮 [Game1 Adapter] Adapter created');
    this._init();
  }

  /* ===============================
     Adapter Initialization
     =============================== */
  async _init() {
    try {
      console.log('🔄 [Game1 Adapter] Initializing...');

      await this._waitForParse();
      this._initializeParse();

      if (!this.config.sessionToken) {
        console.warn('⚠️ sessionToken missing');
        this.status.errors.push('sessionToken missing');
        return;
      }

      await this._authenticate();

      this.initialized = true;
      this.status.initialized = true;

      console.log('✅ [Game1 Adapter] Initialization completed');
      this._logStatus();

      if (typeof window.onParseGameAdapterReady === 'function') {
        window.onParseGameAdapterReady(this);
      }
    } catch (e) {
      console.error('❌ [Game1 Adapter] Init error:', e);
      this.status.errors.push(e.message);
    }
  }

  /* ===============================
     Wait for Parse SDK
     =============================== */
  async _waitForParse() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;

      const check = () => {
        if (typeof Parse !== 'undefined') {
          console.log('✅ [Game1 Adapter] Parse SDK loaded');
          this.status.parseLoaded = true;
          resolve();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 100);
        } else {
          reject(new Error('Parse SDK failed to load'));
        }
      };

      check();
    });
  }

  /* ===============================
     Parse Initialization
     =============================== */
  _initializeParse() {
    console.log('🔧 [Game1 Adapter] Initializing Parse');
    console.log('  📱 App ID:', this.config.appId);
    console.log('  🔗 Server URL:', this.config.serverURL);

    Parse.initialize(this.config.appId);
    Parse.serverURL = this.config.serverURL;

    console.log('✅ [Game1 Adapter] Parse initialized');
  }

  /* ===============================
     Authentication (FIXED)
     =============================== */
  async _authenticate() {
    console.log('🔐 [Game1 Adapter] Authenticating with sessionToken');

    try {
      const user = await Parse.User.become(this.config.sessionToken);

      this.user = user;
      this.status.authenticated = true;

      console.log('✅ [Game1 Adapter] Authenticated successfully');
      console.log('  👤 User ID:', user.id);
      console.log('  📝 Username:', user.get('username'));
    } catch (e) {
      console.error('❌ Authentication failed:', e);
      this.status.errors.push('authentication failed');
      throw e;
    }
  }

  /* ===============================
     Cloud Function Wrapper
     =============================== */
  async callCloudFunction(functionName, params = {}) {
    try {
      if (!this.status.authenticated) {
        throw new Error('User not authenticated');
      }

      console.log(`📞 [Game1 Adapter] Calling ${functionName}`);
      const result = await Parse.Cloud.run(functionName, params);

      console.log(`✅ [Game1 Adapter] ${functionName} success`, result);
      return result;
    } catch (e) {
      console.error(`❌ [Game1 Adapter] ${functionName} failed`, e);
      throw e;
    }
  }

  /* ===============================
     Game APIs
     =============================== */
  async getGameInfo() {
    return this.callCloudFunction('game_sc_information');
  }

  async placeBet(gameId, choice, amount) {
    return this.callCloudFunction('game_bet', {
      gameId,
      choice,
      amount
    });
  }

  async getBetHistory() {
    return this.callCloudFunction('game_sc_history');
  }

  async getLeaderboard() {
    return this.callCloudFunction('game_sc_ranking');
  }

  async getUserProfile() {
    return this.callCloudFunction('game_sc_profile');
  }

  async updateBalance(amount) {
    return this.callCloudFunction('updateBalance', { amount });
  }

  /* ===============================
     Status Helpers
     =============================== */
  getStatus() {
    return {
      ...this.status,
      user: this.user
        ? {
            objectId: this.user.id,
            username: this.user.get('username')
          }
        : null
    };
  }

  _logStatus() {
    console.log('📊 [Game1 Adapter] Status');
    console.log('  Initialized:', this.status.initialized);
    console.log('  Parse Loaded:', this.status.parseLoaded);
    console.log('  Authenticated:', this.status.authenticated);
    console.log('  URL Params:', this.status.urlParams);
    console.log('  Errors:', this.status.errors);
  }
}

/* ===============================
   Global Exports
   =============================== */
window.ParseGameAdapter = ParseGameAdapter;
window.parseGameAdapter = null;

window.initParseGameAdapter = function (config) {
  console.log('🚀 [Game1] Initializing adapter');
  window.parseGameAdapter = new ParseGameAdapter(config);
  return window.parseGameAdapter;
};

console.log('✅ parse-adapter-cocos.js fully loaded');
