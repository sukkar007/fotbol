/**
 * Game API for Soccer/Dice Game
 * ✅ محسّن ليستخدم نفس طريقة ttii.js في جلب البيانات
 * 
 * الميزات:
 * 1. واجهة برمجية سهلة الاستخدام
 * 2. إدارة حالة اللعبة
 * 3. معالجة البيانات والصور
 * 4. رسائل تصحيح واضحة
 */

var gameAPI = {
    // حالة اللعبة
    gameState: {
        round: 0,
        countdown: 0,
        balance: 0,
        currentBets: {},
        lastResult: null,
        winners: [],
        isPlaying: false
    },
    
    // =================== التهيئة ===================
    
    /**
     * تهيئة اللعبة
     */
    init: function() {
        console.log("🎮 [Game API] جاري تهيئة اللعبة...");
        
        try {
            // التحقق من Parse Adapter
            if (typeof parseGameAdapter === 'undefined') {
                throw new Error("Parse Adapter غير محمل!");
            }
            
            // جلب معلومات اللعبة الأولية
            this.refreshGameInfo();
            
            // بدء حلقة التحديث
            this.startGameLoop();
            
            console.log("✅ [Game API] تم تهيئة اللعبة بنجاح!");
            
        } catch (e) {
            console.error("❌ [Game API] خطأ في تهيئة اللعبة:", e.message);
        }
    },
    
    // =================== دوال جلب البيانات ===================
    
    /**
     * تحديث معلومات اللعبة
     * ✅ نفس طريقة ttii.js
     */
    refreshGameInfo: function(round) {
        console.log("🔄 [Game API] جاري تحديث معلومات اللعبة...");
        
        return parseGameAdapter.getGameInfo(round)
            .then(response => {
                if (response.code === 200 && response.data) {
                    console.log("✅ [Game API] معلومات اللعبة:", response.data);
                    
                    // تحديث حالة اللعبة
                    this.gameState.round = response.data.round || 0;
                    this.gameState.countdown = response.data.countdown || 0;
                    this.gameState.balance = response.data.balance || response.data.credits || 0;
                    this.gameState.currentBets = response.data.select || {};
                    this.gameState.lastResult = response.data.result || null;
                    this.gameState.winners = response.data.top || [];
                    
                    // تحديث الواجهة
                    this.updateUI();
                    
                    return response.data;
                } else {
                    throw new Error(response.message || "خطأ في جلب معلومات اللعبة");
                }
            })
            .catch(error => {
                console.error("❌ [Game API] خطأ في تحديث معلومات اللعبة:", error);
                throw error;
            });
    },
    
    /**
     * جلب سجل الرهانات
     */
    getHistory: function() {
        console.log("📜 [Game API] جاري جلب السجل...");
        
        return parseGameAdapter.getHistory()
            .then(response => {
                if (response.code === 200 && response.data) {
                    console.log("✅ [Game API] السجل:", response.data);
                    return response.data;
                } else {
                    throw new Error(response.message || "خطأ في جلب السجل");
                }
            })
            .catch(error => {
                console.error("❌ [Game API] خطأ في جلب السجل:", error);
                throw error;
            });
    },
    
    /**
     * جلب ترتيب اللاعبين
     */
    getRanking: function() {
        console.log("🏆 [Game API] جاري جلب الترتيب...");
        
        return parseGameAdapter.getRanking()
            .then(response => {
                if (response.code === 200 && response.data) {
                    console.log("✅ [Game API] الترتيب:", response.data);
                    return response.data;
                } else {
                    throw new Error(response.message || "خطأ في جلب الترتيب");
                }
            })
            .catch(error => {
                console.error("❌ [Game API] خطأ في جلب الترتيب:", error);
                throw error;
            });
    },
    
    /**
     * جلب ملف تعريف المستخدم
     */
    getUserProfile: function() {
        console.log("👤 [Game API] جاري جلب الملف الشخصي...");
        
        return parseGameAdapter.getUserProfile()
            .then(response => {
                if (response.code === 200 && response.data) {
                    console.log("✅ [Game API] الملف الشخصي:", response.data);
                    return response.data;
                } else {
                    throw new Error(response.message || "خطأ في جلب الملف الشخصي");
                }
            })
            .catch(error => {
                console.error("❌ [Game API] خطأ في جلب الملف الشخصي:", error);
                throw error;
            });
    },
    
    // =================== دوال اللعب ===================
    
    /**
     * وضع رهان
     */
    placeBet: function(teamId, amount) {
        console.log(`💰 [Game API] وضع رهان: فريق=${teamId}, مبلغ=${amount}`);
        
        // التحقق من الرصيد
        if (this.gameState.balance < amount) {
            console.error("❌ [Game API] رصيد غير كافٍ!");
            return Promise.reject("رصيد غير كافٍ!");
        }
        
        // خصم المبلغ محلياً
        this.gameState.balance -= amount;
        this.updateUI();
        
        return parseGameAdapter.placeBet(teamId, amount)
            .then(response => {
                if (response.code === 200) {
                    console.log("✅ [Game API] تم وضع الرهان:", response);
                    
                    // تحديث الرصيد من الخادم
                    if (response.data && response.data.newBalance !== undefined) {
                        this.gameState.balance = response.data.newBalance;
                    }
                    
                    // تحديث الرهانات الحالية
                    if (!this.gameState.currentBets[teamId]) {
                        this.gameState.currentBets[teamId] = 0;
                    }
                    this.gameState.currentBets[teamId] += amount;
                    
                    this.updateUI();
                    return response.data;
                } else {
                    throw new Error(response.message || "خطأ في وضع الرهان");
                }
            })
            .catch(error => {
                console.error("❌ [Game API] خطأ في وضع الرهان:", error);
                // استرجاع المبلغ في حالة الفشل
                this.gameState.balance += amount;
                this.updateUI();
                throw error;
            });
    },
    
    // =================== تحديث الواجهة ===================
    
    /**
     * تحديث الواجهة
     */
    updateUI: function() {
        console.log("🖥️ [Game API] جاري تحديث الواجهة...");
        
        try {
            // تحديث الرصيد
            var balanceElement = document.querySelector('.balanceCount');
            if (balanceElement) {
                balanceElement.textContent = this.formatNumber(this.gameState.balance);
            }
            
            // تحديث الجولة
            var roundElement = document.querySelector('.round');
            if (roundElement) {
                roundElement.textContent = "جولة " + this.gameState.round;
            }
            
            // تحديث العد العكسي
            var countdownElement = document.querySelector('.countdown');
            if (countdownElement) {
                countdownElement.textContent = this.gameState.countdown + "s";
            }
            
            console.log("✅ [Game API] تم تحديث الواجهة!");
            
        } catch (e) {
            console.error("❌ [Game API] خطأ في تحديث الواجهة:", e.message);
        }
    },
    
    // =================== حلقة اللعبة ===================
    
    /**
     * بدء حلقة اللعبة
     */
    startGameLoop: function() {
        console.log("🔄 [Game API] بدء حلقة اللعبة...");
        
        // تحديث معلومات اللعبة كل 5 ثواني
        setInterval(() => {
            this.refreshGameInfo();
        }, 5000);
        
        // تحديث العد العكسي كل ثانية
        setInterval(() => {
            if (this.gameState.countdown > 0) {
                this.gameState.countdown--;
                this.updateUI();
            }
        }, 1000);
    },
    
    // =================== دوال المساعدة ===================
    
    /**
     * تنسيق الأرقام
     */
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    /**
     * استخراج صورة المستخدم
     */
    extractImageUrl: function(avatarData) {
        if (!avatarData) {
            return 'images/default_avatar.png';
        }
        
        // URL مباشر
        if (typeof avatarData === 'string' && avatarData.startsWith('http')) {
            return avatarData;
        }
        
        // JSON object
        if (typeof avatarData === 'object' && avatarData.url) {
            return avatarData.url;
        }
        
        // اسم ملف
        if (typeof avatarData === 'string') {
            return 'images/' + avatarData;
        }
        
        return 'images/default_avatar.png';
    },
    
    /**
     * الحصول على حالة اللعبة
     */
    getGameState: function() {
        console.log("📊 [Game API] حالة اللعبة:", this.gameState);
        return this.gameState;
    },
    
    /**
     * اختبار الاتصال
     */
    testConnection: function() {
        console.log("🔔 [Game API] اختبار الاتصال...");
        
        return parseGameAdapter.ping()
            .then(result => {
                console.log("✅ [Game API] الاتصال يعمل بشكل صحيح!");
                return result;
            })
            .catch(error => {
                console.error("❌ [Game API] الاتصال معطل:", error);
                throw error;
            });
    }
};

// =================== التهيئة التلقائية ===================

console.log("🚀 [Game API] جاري تحميل Game API...");

// التهيئة عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("📄 [Game API] الصفحة تم تحميلها، جاري التهيئة...");
        gameAPI.init();
    });
} else {
    console.log("📄 [Game API] الصفحة محملة بالفعل، جاري التهيئة...");
    gameAPI.init();
}

// تصدير للاستخدام العام
window.gameAPI = gameAPI;

console.log("✅ [Game API] تم تحميل Game API بنجاح!");
