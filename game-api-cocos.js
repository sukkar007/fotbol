/**
 * Game API for Soccer/Dice Game (Game 1)
 * واجهة برمجية لاتصال اللعبة بـ Parse
 */

class GameAPI {
  constructor(adapter) {
    this.adapter = adapter;
    this.gameState = {
      playerInfo: null,
      balance: 0,
      gameInfo: null,
      betHistory: [],
      leaderboard: [],
      currentGame: null
    };

    console.log('🎮 [Game1 API] تم إنشاء GameAPI');
  }

  /**
   * تهيئة اللعبة
   */
  async initialize() {
    try {
      console.log('🔄 [Game1 API] تهيئة اللعبة...');

      // جلب معلومات اللعبة
      const gameInfo = await this.adapter.getGameInfo();
      this.gameState.gameInfo = gameInfo;
      this.gameState.balance = gameInfo.data.balance || 0;
      this.gameState.currentGame = gameInfo.data;

      console.log('✅ [Game1 API] تم تهيئة اللعبة بنجاح');
      console.log('  💰 Balance:', this.gameState.balance);
      console.log('  🎮 Game Type:', gameInfo.data.gameType);

      return this.gameState;
    } catch (e) {
      console.error('❌ [Game1 API] خطأ في تهيئة اللعبة:', e);
      throw e;
    }
  }

  /**
   * وضع رهان
   */
  async placeBet(gameId, choice, amount) {
    try {
      console.log(`💰 [Game1 API] وضع رهان: gameId=${gameId}, choice=${choice}, amount=${amount}`);

      // التحقق من الرصيد
      if (this.gameState.balance < amount) {
        throw new Error('رصيد غير كافي');
      }

      // وضع الرهان
      const result = await this.adapter.placeBet(gameId, choice, amount);

      // تحديث الرصيد
      if (result.data && result.data.newBalance !== undefined) {
        this.gameState.balance = result.data.newBalance;
      }

      console.log('✅ [Game1 API] تم وضع الرهان بنجاح');
      console.log('  🎲 Result:', result.data.result);
      console.log('  💰 New Balance:', this.gameState.balance);

      return result;
    } catch (e) {
      console.error('❌ [Game1 API] خطأ في وضع الرهان:', e);
      throw e;
    }
  }

  /**
   * جلب سجل الرهانات
   */
  async getBetHistory() {
    try {
      console.log('📋 [Game1 API] جلب سجل الرهانات...');

      const result = await this.adapter.getBetHistory();
      this.gameState.betHistory = result.data.bets || [];

      console.log('✅ [Game1 API] تم جلب السجل بنجاح');
      console.log('  📊 Bets Count:', this.gameState.betHistory.length);

      return this.gameState.betHistory;
    } catch (e) {
      console.error('❌ [Game1 API] خطأ في جلب السجل:', e);
      throw e;
    }
  }

  /**
   * جلب ترتيب اللاعبين
   */
  async getLeaderboard() {
    try {
      console.log('🏆 [Game1 API] جلب ترتيب اللاعبين...');

      const result = await this.adapter.getLeaderboard();
      this.gameState.leaderboard = result.data.ranking || [];

      console.log('✅ [Game1 API] تم جلب الترتيب بنجاح');
      console.log('  👥 Players Count:', this.gameState.leaderboard.length);

      return this.gameState.leaderboard;
    } catch (e) {
      console.error('❌ [Game1 API] خطأ في جلب الترتيب:', e);
      throw e;
    }
  }

  /**
   * جلب ملف تعريف المستخدم
   */
  async getUserProfile() {
    try {
      console.log('👤 [Game1 API] جلب ملف تعريف المستخدم...');

      const result = await this.adapter.getUserProfile();
      this.gameState.playerInfo = result.data;

      console.log('✅ [Game1 API] تم جلب الملف الشخصي بنجاح');
      console.log('  👤 Username:', result.data.username);

      return this.gameState.playerInfo;
    } catch (e) {
      console.error('❌ [Game1 API] خطأ في جلب الملف الشخصي:', e);
      throw e;
    }
  }

  /**
   * تحديث الرصيد
   */
  async updateBalance(amount) {
    try {
      console.log(`💵 [Game1 API] تحديث الرصيد: ${amount}`);

      const result = await this.adapter.updateBalance(amount);

      if (result.data && result.data.newBalance !== undefined) {
        this.gameState.balance = result.data.newBalance;
      }

      console.log('✅ [Game1 API] تم تحديث الرصيد بنجاح');
      console.log('  💰 New Balance:', this.gameState.balance);

      return result;
    } catch (e) {
      console.error('❌ [Game1 API] خطأ في تحديث الرصيد:', e);
      throw e;
    }
  }

  /**
   * الحصول على حالة اللعبة
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * تحديث معلومات اللاعب
   */
  setPlayerInfo(playerInfo) {
    this.gameState.playerInfo = playerInfo;
    console.log('👤 [Game1 API] تم تحديث معلومات اللاعب');
  }

  /**
   * تحديث معلومات اللعبة الحالية
   */
  async refreshGameInfo() {
    try {
      console.log('🔄 [Game1 API] تحديث معلومات اللعبة...');
      const gameInfo = await this.adapter.getGameInfo();
      this.gameState.gameInfo = gameInfo;
      this.gameState.currentGame = gameInfo.data;
      console.log('✅ [Game1 API] تم تحديث معلومات اللعبة');
      return this.gameState.currentGame;
    } catch (e) {
      console.error('❌ [Game1 API] خطأ في تحديث معلومات اللعبة:', e);
      throw e;
    }
  }
}

// تصدير GameAPI
window.GameAPI = GameAPI;

// إنشاء instance عام
window.gameAPI = null;

/**
 * دالة مساعدة لتهيئة GameAPI
 */
window.initGameAPI = function(adapter) {
  console.log('🎮 [Game1] بدء تهيئة GameAPI...');
  window.gameAPI = new GameAPI(adapter);
  return window.gameAPI;
};

console.log('✅ [Game1] تم تحميل game-api-game1.js');
