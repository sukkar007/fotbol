/**
 * Parse Adapter for Soccer/Dice Game

 * 
 * الميزات:
 * 1. استدعاء Parse Cloud Functions بشكل آمن
 * 2. معالجة الأخطاء الشاملة
 * 3. تتبع الطلبات المعلقة
 * 4. Timeout لكل طلب
 * 5. رسائل تصحيح واضحة بالعربية
 */

// =================== الإعدادات الأساسية ===================

var parseGameAdapter = {
    config: {
        appId: null,
        serverURL: null,
        sessionToken: null
    },
    
    // تخزين callbacks للطلبات المعلقة
    pendingRequests: {},
    requestIdCounter: 0,
    
    // حالة الاتصال
    status: {
        initialized: false,
        parseInitialized: false,
        authenticated: false,
        errors: []
    },
    
    // =================== التهيئة ===================
    
    /**
     * تهيئة Parse Adapter
     */
    init: function() {
        console.log("🔧 [Parse Adapter] جاري التهيئة...");
        
        try {
            // قراءة المعاملات من الـ URL
            var urlParams = new URLSearchParams(window.location.search);
            this.config.appId = urlParams.get('appId');
            this.config.serverURL = urlParams.get('serverURL');
            this.config.sessionToken = urlParams.get('sessionToken');
            
            console.log("📋 [Parse Adapter] المعاملات المقروءة:");
            console.log("  - appId:", this.config.appId ? "✅" : "❌");
            console.log("  - serverURL:", this.config.serverURL ? "✅" : "❌");
            console.log("  - sessionToken:", this.config.sessionToken ? "✅ (" + this.config.sessionToken.length + " حرف)" : "❌");
            
            // التحقق من المعاملات
            if (!this.config.appId || !this.config.serverURL || !this.config.sessionToken) {
                throw new Error("❌ معاملات Parse ناقصة!");
            }
            
            // تهيئة Parse
            this.initializeParse();
            
            // تعيين رسائل الاستجابة من Flutter
            this.setupFlutterHandlers();
            
            this.status.initialized = true;
            console.log("✅ [Parse Adapter] تم التهيئة بنجاح!");
            
        } catch (e) {
            this.status.errors.push(e.message);
            console.error("❌ [Parse Adapter] خطأ في التهيئة:", e.message);
        }
    },
    
    /**
     * تهيئة Parse SDK
     */
    initializeParse: function() {
        try {
            if (typeof Parse === 'undefined') {
                throw new Error("Parse SDK غير محمل!");
            }
            
            console.log("🔌 [Parse Adapter] جاري تهيئة Parse SDK...");
            
            // تهيئة Parse
            Parse.initialize(this.config.appId);
            Parse.serverURL = this.config.serverURL;
            
            console.log("✅ [Parse Adapter] Parse SDK تم تهيئته بنجاح!");
            console.log("  - App ID:", this.config.appId);
            console.log("  - Server URL:", this.config.serverURL);
            
            // تعيين sessionToken
            if (this.config.sessionToken) {
                console.log("🔐 [Parse Adapter] جاري تعيين sessionToken...");
                
                // طريقة 1: تعيين مباشر في الرؤوس
                Parse.Cloud.run('ping', {}, {
                    sessionToken: this.config.sessionToken
                }).then(() => {
                    console.log("✅ [Parse Adapter] sessionToken تم تعيينه بنجاح!");
                    this.status.authenticated = true;
                }).catch(e => {
                    console.warn("⚠️ [Parse Adapter] تحذير في التحقق من sessionToken:", e.message);
                });
            }
            
            this.status.parseInitialized = true;
            
        } catch (e) {
            this.status.errors.push(e.message);
            console.error("❌ [Parse Adapter] خطأ في تهيئة Parse:", e.message);
        }
    },
    
    /**
     * إعداد معالجات Flutter
     */
    setupFlutterHandlers: function() {
        console.log("🔗 [Parse Adapter] إعداد معالجات Flutter...");
        
        // معالج الاستجابة من Flutter
        window.onFlamingoResponse = (response) => {
            console.log("📨 [Parse Adapter] استجابة من Flutter:", response);
            
            var requestId = response.requestId;
            if (requestId && this.pendingRequests[requestId]) {
                var callback = this.pendingRequests[requestId];
                delete this.pendingRequests[requestId];
                
                if (response.success) {
                    callback.resolve(response.data);
                } else {
                    callback.reject(response.error || 'Unknown error');
                }
            }
        };
        
        console.log("✅ [Parse Adapter] معالجات Flutter جاهزة!");
    },
    
    // =================== استدعاء الدوال ===================
    
    /**
     * استدعاء دالة Cloud Function
     * ✅ نفس طريقة ttii.js
     */
    callCloudFunction: function(functionName, params = {}) {
        console.log(`📞 [Parse Adapter] استدعاء: ${functionName}`, params);
        
        return new Promise((resolve, reject) => {
            try {
                if (!this.config.sessionToken) {
                    reject("❌ sessionToken غير موجود!");
                    return;
                }
                
                // استدعاء Parse Cloud Function
                Parse.Cloud.run(functionName, params, {
                    sessionToken: this.config.sessionToken
                }).then(result => {
                    console.log(`✅ [Parse Adapter] نتيجة ${functionName}:`, result);
                    resolve(result);
                }).catch(error => {
                    console.error(`❌ [Parse Adapter] خطأ في ${functionName}:`, error);
                    reject(error);
                });
                
                // Timeout بعد 30 ثانية
                setTimeout(() => {
                    if (this.pendingRequests[functionName]) {
                        delete this.pendingRequests[functionName];
                        reject("⏱️ انتهت مهلة الانتظار!");
                    }
                }, 30000);
                
            } catch (e) {
                console.error(`❌ [Parse Adapter] استثناء في ${functionName}:`, e);
                reject(e.message);
            }
        });
    },
    
    /**
     * استدعاء دالة Flutter
     * ✅ نفس طريقة ttii.js
     */
    callFlutterApp: function(functionName, params = {}) {
        console.log(`📱 [Parse Adapter] استدعاء Flutter: ${functionName}`, params);
        
        return new Promise((resolve, reject) => {
            try {
                var requestId = ++this.requestIdCounter;
                this.pendingRequests[requestId] = {
                    resolve: resolve,
                    reject: reject
                };
                
                var message = {
                    requestId: requestId,
                    function: functionName,
                    params: params
                };
                
                // محاولة الاتصال بـ Flutter
                if (window.FlamingoApp && typeof window.FlamingoApp.postMessage === 'function') {
                    window.FlamingoApp.postMessage(JSON.stringify(message));
                } else if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
                    window.flutter_inappwebview.callHandler('FlamingoApp', JSON.stringify(message));
                } else if (window.flutterChannel && typeof window.flutterChannel.postMessage === 'function') {
                    window.flutterChannel.postMessage(JSON.stringify(message));
                } else {
                    reject("❌ لا يمكن الاتصال بـ Flutter!");
                }
                
                // Timeout بعد 30 ثانية
                setTimeout(() => {
                    if (this.pendingRequests[requestId]) {
                        delete this.pendingRequests[requestId];
                        reject("⏱️ انتهت مهلة الانتظار!");
                    }
                }, 30000);
                
            } catch (e) {
                console.error(`❌ [Parse Adapter] خطأ في استدعاء Flutter:`, e);
                reject(e.message);
            }
        });
    },
    
    // =================== دوال اللعبة ===================
    
    /**
     * جلب معلومات اللعبة
     */
    getGameInfo: function(round) {
        console.log("🎮 [Parse Adapter] جاري جلب معلومات اللعبة...");
        
        var params = {};
        if (round) {
            params.round = round;
        }
        
        return this.callCloudFunction('game_sc_information', params)
            .then(result => {
                console.log("✅ [Parse Adapter] معلومات اللعبة:", result);
                return result;
            })
            .catch(error => {
                console.error("❌ [Parse Adapter] خطأ في جلب معلومات اللعبة:", error);
                throw error;
            });
    },
    
    /**
     * وضع رهان
     */
    placeBet: function(teamId, amount) {
        console.log(`💰 [Parse Adapter] وضع رهان: فريق=${teamId}, مبلغ=${amount}`);
        
        return this.callCloudFunction('game_bet', {
            teamId: teamId,
            amount: amount
        })
            .then(result => {
                console.log("✅ [Parse Adapter] تم وضع الرهان:", result);
                return result;
            })
            .catch(error => {
                console.error("❌ [Parse Adapter] خطأ في وضع الرهان:", error);
                throw error;
            });
    },
    
    /**
     * جلب سجل الرهانات
     */
    getHistory: function() {
        console.log("📜 [Parse Adapter] جاري جلب السجل...");
        
        return this.callCloudFunction('game_sc_history', {})
            .then(result => {
                console.log("✅ [Parse Adapter] السجل:", result);
                return result;
            })
            .catch(error => {
                console.error("❌ [Parse Adapter] خطأ في جلب السجل:", error);
                throw error;
            });
    },
    
    /**
     * جلب ترتيب اللاعبين
     */
    getRanking: function() {
        console.log("🏆 [Parse Adapter] جاري جلب الترتيب...");
        
        return this.callCloudFunction('game_sc_ranking', {})
            .then(result => {
                console.log("✅ [Parse Adapter] الترتيب:", result);
                return result;
            })
            .catch(error => {
                console.error("❌ [Parse Adapter] خطأ في جلب الترتيب:", error);
                throw error;
            });
    },
    
    /**
     * جلب ملف تعريف المستخدم
     */
    getUserProfile: function() {
        console.log("👤 [Parse Adapter] جاري جلب الملف الشخصي...");
        
        return this.callCloudFunction('game_sc_profile', {})
            .then(result => {
                console.log("✅ [Parse Adapter] الملف الشخصي:", result);
                return result;
            })
            .catch(error => {
                console.error("❌ [Parse Adapter] خطأ في جلب الملف الشخصي:", error);
                throw error;
            });
    },
    
    /**
     * تحديث الرصيد
     */
    updateBalance: function(amount, type = 'set') {
        console.log(`💵 [Parse Adapter] تحديث الرصيد: مبلغ=${amount}, نوع=${type}`);
        
        return this.callCloudFunction('updateBalance', {
            amount: amount,
            type: type
        })
            .then(result => {
                console.log("✅ [Parse Adapter] تم تحديث الرصيد:", result);
                return result;
            })
            .catch(error => {
                console.error("❌ [Parse Adapter] خطأ في تحديث الرصيد:", error);
                throw error;
            });
    },
    
    // =================== دوال المساعدة ===================
    
    /**
     * الحصول على حالة الاتصال
     */
    getStatus: function() {
        console.log("📊 [Parse Adapter] حالة الاتصال:", this.status);
        return this.status;
    },
    
    /**
     * اختبار الاتصال
     */
    ping: function() {
        console.log("🔔 [Parse Adapter] اختبار الاتصال...");
        
        return this.callCloudFunction('ping', {})
            .then(result => {
                console.log("✅ [Parse Adapter] الاتصال يعمل بشكل صحيح!");
                return result;
            })
            .catch(error => {
                console.error("❌ [Parse Adapter] الاتصال معطل:", error);
                throw error;
            });
    }
};

// =================== التهيئة التلقائية ===================

console.log("🚀 [Parse Adapter] جاري تحميل Parse Adapter...");

// التهيئة عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("📄 [Parse Adapter] الصفحة تم تحميلها، جاري التهيئة...");
        parseGameAdapter.init();
    });
} else {
    console.log("📄 [Parse Adapter] الصفحة محملة بالفعل، جاري التهيئة...");
    parseGameAdapter.init();
}

// تصدير للاستخدام العام
window.parseGameAdapter = parseGameAdapter;

console.log("✅ [Parse Adapter] تم تحميل Parse Adapter بنجاح!");
