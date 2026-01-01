/**
 * Parse Adapter for Soccer/Dice Game (Game 1)
 * تهيئة Parse SDK والاتصال بـ Parse Server
 * بنفس طريقة اللعبة الثانية
 */

class ParseGameAdapter {
  constructor(config = {}) {
    this.config = {
      appId: config.appId || 'spp111424242ssdsd',
      serverURL: config.serverURL || 'https://parse410.onrender.com/parse',
      sessionToken: config.sessionToken || null,
      ...config
    };

    this.initialized = false;
    this.user = null;
    this.status = {
      parseLoaded: false,
      initialized: false,
      authenticated: false,
      errors: [],
    };

    console.log('🎮 [Game1 Adapter] تم إنشاء الـ Adapter');
    this._init();
  }

  /**
   * تهيئة الـ Adapter
   */
  async _init() {
    try {
      console.log('🔄 [Game1 Adapter] بدء التهيئة...');

      // الانتظار حتى يكون Parse متاحاً
      await this._waitForParse();

      // تهيئة Parse
      this._initializeParse();

      // المصادقة إذا كان sessionToken موجوداً
      if (this.config.sessionToken) {
        await this._authenticate();
      }

      this.initialized = true;
      this.status.initialized = true;

      console.log('✅ [Game1 Adapter] تم التهيئة بنجاح');
      this._logStatus();

      // تنفيذ callback
      if (typeof window.onParseGameAdapterReady === 'function') {
        window.onParseGameAdapterReady(this);
      }
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في التهيئة:', e);
      this.status.errors.push(e.message);
    }
  }

  /**
   * الانتظار حتى يكون Parse متاحاً
   */
  async _waitForParse() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 ثوانٍ (50 × 100ms)

      const check = () => {
        if (typeof Parse !== 'undefined') {
          console.log('✅ [Game1 Adapter] Parse متاح');
          this.status.parseLoaded = true;
          resolve();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 100);
        } else {
          reject(new Error('Parse failed to load'));
        }
      };

      check();
    });
  }

  /**
   * تهيئة Parse
   */
  _initializeParse() {
    try {
      const { appId, serverURL } = this.config;

      console.log('🔧 [Game1 Adapter] تهيئة Parse...');
      console.log('  📱 App ID:', appId);
      console.log('  🔗 Server URL:', serverURL);

      // تهيئة Parse
      Parse.initialize(appId);
      Parse.serverURL = serverURL;

      console.log('✅ [Game1 Adapter] تم تهيئة Parse بنجاح');
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في تهيئة Parse:', e);
      throw e;
    }
  }

  /**
   * المصادقة باستخدام sessionToken
   */
  async _authenticate() {
    try {
      const { sessionToken } = this.config;

      if (!sessionToken) {
        console.warn('⚠️ [Game1 Adapter] sessionToken غير موجود');
        return;
      }

      console.log('🔐 [Game1 Adapter] محاولة المصادقة...');

      // محاولة الحصول على المستخدم الحالي
      const user = await Parse.Cloud.run('game_sc_profile', {
        sessionToken: sessionToken
      });

      if (user) {
        this.user = user;
        this.status.authenticated = true;
        console.log('✅ [Game1 Adapter] تم المصادقة بنجاح');
        console.log('  👤 User ID:', user.objectId);
        console.log('  📝 Username:', user.username);
      }
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في المصادقة:', e);
      this.status.errors.push(e.message);
    }
  }

  /**
   * استدعاء دالة Cloud
   */
  async callCloudFunction(functionName, params = {}) {
    try {
      console.log(`📞 [Game1 Adapter] استدعاء ${functionName}...`);

      // إضافة sessionToken إلى المعاملات
      if (this.config.sessionToken) {
        params.sessionToken = this.config.sessionToken;
      }

      const result = await Parse.Cloud.run(functionName, params);

      console.log(`✅ [Game1 Adapter] ${functionName} نجح:`, result);
      return result;
    } catch (e) {
      console.error(`❌ [Game1 Adapter] خطأ في ${functionName}:`, e);
      throw e;
    }
  }

  /**
   * جلب معلومات اللعبة
   */
  async getGameInfo() {
    try {
      console.log('🎮 [Game1 Adapter] جلب معلومات اللعبة...');
      const result = await this.callCloudFunction('game_sc_information');
      return result;
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في جلب معلومات اللعبة:', e);
      throw e;
    }
  }

  /**
   * وضع رهان
   */
  async placeBet(gameId, choice, amount) {
    try {
      console.log(`💰 [Game1 Adapter] وضع رهان: gameId=${gameId}, choice=${choice}, amount=${amount}`);
      const result = await this.callCloudFunction('game_bet', {
        gameId: gameId,
        choice: choice,
        amount: amount
      });
      return result;
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في وضع الرهان:', e);
      throw e;
    }
  }

  /**
   * جلب سجل الرهانات
   */
  async getBetHistory() {
    try {
      console.log('📋 [Game1 Adapter] جلب سجل الرهانات...');
      const result = await this.callCloudFunction('game_sc_history');
      return result;
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في جلب سجل الرهانات:', e);
      throw e;
    }
  }

  /**
   * جلب ترتيب اللاعبين
   */
  async getLeaderboard() {
    try {
      console.log('🏆 [Game1 Adapter] جلب ترتيب اللاعبين...');
      const result = await this.callCloudFunction('game_sc_ranking');
      return result;
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في جلب الترتيب:', e);
      throw e;
    }
  }

  /**
   * جلب ملف تعريف المستخدم
   */
  async getUserProfile() {
    try {
      console.log('👤 [Game1 Adapter] جلب ملف تعريف المستخدم...');
      const result = await this.callCloudFunction('game_sc_profile');
      return result;
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في جلب الملف الشخصي:', e);
      throw e;
    }
  }

  /**
   * تحديث الرصيد
   */
  async updateBalance(amount) {
    try {
      console.log(`💵 [Game1 Adapter] تحديث الرصيد: ${amount}`);
      const result = await this.callCloudFunction('updateBalance', {
        amount: amount
      });
      return result;
    } catch (e) {
      console.error('❌ [Game1 Adapter] خطأ في تحديث الرصيد:', e);
      throw e;
    }
  }

  /**
   * الحصول على حالة الـ Adapter
   */
  getStatus() {
    return {
      ...this.status,
      initialized: this.initialized,
      authenticated: this.status.authenticated,
      user: this.user ? {
        objectId: this.user.objectId,
        username: this.user.username,
        email: this.user.email
      } : null
    };
  }

  /**
   * طباعة الحالة
   */
  _logStatus() {
    console.log('📊 [Game1 Adapter] الحالة:');
    console.log('  ✅ Initialized:', this.status.initialized);
    console.log('  ✅ Parse Loaded:', this.status.parseLoaded);
    console.log('  ✅ Authenticated:', this.status.authenticated);
    console.log('  ⚠️ Errors:', this.status.errors.length);
  }
}

// تصدير الـ Adapter
window.ParseGameAdapter = ParseGameAdapter;

// إنشاء instance عام
window.parseGameAdapter = null;

/**
 * دالة مساعدة لتهيئة الـ Adapter
 */
window.initParseGameAdapter = function(config) {
  console.log('🚀 [Game1] بدء تهيئة الـ Adapter...');
  window.parseGameAdapter = new ParseGameAdapter(config);
  return window.parseGameAdapter;
};

console.log('✅ [Game1] تم تحميل parse-adapter-game1.js');
