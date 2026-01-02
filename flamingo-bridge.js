/**
 * Flamingo Bridge - ربط اللعبة مع Flutter WebView
 * ================================================
 * هذا الملف يحول طلبات اللعبة إلى استدعاءات Flutter
 * ويستقبل الاستجابات من Parse Cloud Functions
 */

(function() {
    'use strict';

    console.log('🔗 تحميل Flamingo Bridge...');

    // ==========================================
    // إعدادات الـ Bridge
    // ==========================================

    const FlamingoConfig = {
        debug: true,
        requestTimeout: 30000, // 30 ثانية
        maxRetries: 3,
    };

    // ==========================================
    // إدارة الطلبات المعلقة
    // ==========================================

    const pendingRequests = new Map();
    let requestId = 0;

    /**
     * إنشاء معرف فريد للطلب
     */
    function generateRequestId() {
        return `req_${++requestId}_${Date.now()}`;
    }

    /**
     * إرسال طلب إلى Flutter
     */
    function sendToFlutter(action, params = {}) {
        return new Promise((resolve, reject) => {
            const reqId = generateRequestId();
            
            if (FlamingoConfig.debug) {
                console.log(`📤 إرسال إلى Flutter: ${action}`, params);
            }

            // حفظ معلومات الطلب
            const request = {
                id: reqId,
                action: action,
                params: params,
                resolve: resolve,
                reject: reject,
                timestamp: Date.now(),
                timeout: setTimeout(() => {
                    pendingRequests.delete(reqId);
                    reject(new Error(`Timeout: ${action} تجاوز الوقت المسموح`));
                }, FlamingoConfig.requestTimeout)
            };

            pendingRequests.set(reqId, request);

            // إرسال الطلب إلى Flutter
            try {
                if (window.FlamingoApp) {
                    window.FlamingoApp.postMessage(JSON.stringify({
                        action: action,
                        requestId: reqId,
                        params: params
                    }));
                } else {
                    reject(new Error('FlamingoApp غير متاح'));
                }
            } catch (error) {
                pendingRequests.delete(reqId);
                clearTimeout(request.timeout);
                reject(error);
            }
        });
    }

    /**
     * استقبال الاستجابة من Flutter
     */
    window.onFlamingoResponse = function(response) {
        if (FlamingoConfig.debug) {
            console.log('📥 استقبال من Flutter:', response);
        }

        const reqId = response.requestId;
        const request = pendingRequests.get(reqId);

        if (!request) {
            console.warn(`⚠️ لم يتم العثور على طلب: ${reqId}`);
            return;
        }

        // إزالة timeout
        clearTimeout(request.timeout);
        pendingRequests.delete(reqId);

        // معالجة الاستجابة
        if (response.success) {
            request.resolve(response.data);
        } else {
            request.reject(new Error(response.error || 'خطأ غير معروف'));
        }
    };

    // ==========================================
    // دوال الـ Bridge الرئيسية
    // ==========================================

    /**
     * جلب معلومات اللعبة الحالية
     */
    async function getGameInfo() {
        try {
            const result = await sendToFlutter('game_info', {});
            if (FlamingoConfig.debug) {
                console.log('✅ تم جلب معلومات اللعبة:', result);
            }
            return result;
        } catch (error) {
            console.error('❌ خطأ في جلب معلومات اللعبة:', error);
            throw error;
        }
    }

    /**
     * وضع رهان
     */
    async function placeBet(choice, gold) {
        try {
            if (!choice || !gold) {
                throw new Error('choice و gold مطلوبان');
            }

            const result = await sendToFlutter('game_choice', {
                choice: choice,
                gold: gold
            });

            if (FlamingoConfig.debug) {
                console.log('✅ تم وضع الرهان:', result);
            }
            return result;
        } catch (error) {
            console.error('❌ خطأ في وضع الرهان:', error);
            throw error;
        }
    }

    /**
     * جلب سجل الرهانات
     */
    async function getGameBill() {
        try {
            const result = await sendToFlutter('game_bill', {});
            if (FlamingoConfig.debug) {
                console.log('✅ تم جلب سجل الرهانات:', result);
            }
            return result;
        } catch (error) {
            console.error('❌ خطأ في جلب سجل الرهانات:', error);
            throw error;
        }
    }

    /**
     * جلب ترتيب اللاعبين
     */
    async function getGameRank() {
        try {
            const result = await sendToFlutter('game_rank', {});
            if (FlamingoConfig.debug) {
                console.log('✅ تم جلب الترتيب:', result);
            }
            return result;
        } catch (error) {
            console.error('❌ خطأ في جلب الترتيب:', error);
            throw error;
        }
    }

    /**
     * تحديث رصيد اللاعب
     */
    function refreshBalance() {
        try {
            sendToFlutter('refreshBalance', {});
        } catch (error) {
            console.error('❌ خطأ في تحديث الرصيد:', error);
        }
    }

    /**
     * إغلاق اللعبة
     */
    function closeGame() {
        try {
            sendToFlutter('close', {});
        } catch (error) {
            console.error('❌ خطأ في إغلاق اللعبة:', error);
        }
    }

    /**
     * عرض رسالة
     */
    function showMessage(title, message, isError = false) {
        try {
            sendToFlutter('showMessage', {
                title: title,
                message: message,
                isError: isError
            });
        } catch (error) {
            console.error('❌ خطأ في عرض الرسالة:', error);
        }
    }

    // ==========================================
    // اعتراض طلبات Fetch API
    // ==========================================

    const originalFetch = window.fetch;

    window.fetch = function(resource, config) {
        const url = typeof resource === 'string' ? resource : resource.url;
        const method = (config && config.method) || 'GET';
        const body = config && config.body;

        // التحقق من أن الطلب موجه إلى /v1/football/
        if (url && url.indexOf('/v1/football/') !== -1) {
            const mapping = mapGameEndpoint(url, method, body);
            
            if (mapping && mapping.fn) {
                if (FlamingoConfig.debug) {
                    console.log(`🔄 تحويل الطلب: ${url} → ${mapping.fn}`);
                }
                return executeGameFunction(mapping.fn, mapping.params);
            }
        }

        // إذا لم يكن الطلب موجهاً إلى /v1/football/، استخدم الطريقة الأصلية
        return originalFetch.apply(this, arguments);
    };

    // ==========================================
    // اعتراض XMLHttpRequest (للتوافقية مع الطرق القديمة)
    // ==========================================

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this.__method = method;
        this.__url = url;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        try {
            // التحقق من أن الطلب موجه إلى /v1/football/
            if (this.__url && this.__url.indexOf('/v1/football/') !== -1) {
                const mapping = mapGameEndpoint(this.__url, this.__method, body);
                
                if (mapping && mapping.fn) {
                    if (FlamingoConfig.debug) {
                        console.log(`🔄 تحويل الطلب XHR: ${this.__url} → ${mapping.fn}`);
                    }
                    return executeGameFunctionXHR(this, mapping.fn, mapping.params);
                }
            }
        } catch (error) {
            console.error('❌ خطأ في اعتراض الطلب:', error);
        }

        // إذا لم يكن الطلب موجهاً إلى /v1/football/، استخدم الطريقة الأصلية
        return originalSend.apply(this, arguments);
    };

    /**
     * تعيين عناوين API إلى دوال اللعبة
     */
    function mapGameEndpoint(url, method, body) {
        try {
            const params = body ? JSON.parse(body) : {};

            if (url.indexOf('/v1/football/home') !== -1) {
                return { fn: 'getGameInfo', params: {} };
            }
            if (url.indexOf('/v1/football/bet') !== -1 && method === 'POST') {
                return { fn: 'placeBet', params };
            }
            if (url.indexOf('/v1/football/bet/record') !== -1 || url.indexOf('/v1/football/reward/record') !== -1) {
                return { fn: 'getGameBill', params: {} };
            }
            if (url.indexOf('/v1/football/rank') !== -1) {
                return { fn: 'getGameRank', params: {} };
            }
            if (url.indexOf('/v1/football/end_page_record') !== -1) {
                return { fn: 'getGameBill', params: {} };
            }

            return null;
        } catch (error) {
            console.error('❌ خطأ في mapGameEndpoint:', error);
            return null;
        }
    }

    /**
     * تنفيذ دالة اللعبة (Fetch API)
     */
    function executeGameFunction(functionName, params) {
        let promise;

        switch (functionName) {
            case 'getGameInfo':
                promise = getGameInfo();
                break;
            case 'placeBet':
                promise = placeBet(params.choice || params.teamId, params.gold || params.amount);
                break;
            case 'getGameBill':
                promise = getGameBill();
                break;
            case 'getGameRank':
                promise = getGameRank();
                break;
            default:
                promise = Promise.reject(new Error(`دالة غير معروفة: ${functionName}`));
        }

        return promise
            .then(result => {
                return new Response(JSON.stringify(result), {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            })
            .catch(error => {
                const errorObj = {
                    code: 500,
                    message: error.message || String(error),
                    error: 'FLAMINGO_ERROR'
                };
                return new Response(JSON.stringify(errorObj), {
                    status: 500,
                    statusText: 'Internal Server Error',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            });
    }

    /**
     * تنفيذ دالة اللعبة (XMLHttpRequest)
     */
    function executeGameFunctionXHR(xhr, functionName, params) {
        let promise;

        switch (functionName) {
            case 'getGameInfo':
                promise = getGameInfo();
                break;
            case 'placeBet':
                promise = placeBet(params.choice || params.teamId, params.gold || params.amount);
                break;
            case 'getGameBill':
                promise = getGameBill();
                break;
            case 'getGameRank':
                promise = getGameRank();
                break;
            default:
                promise = Promise.reject(new Error(`دالة غير معروفة: ${functionName}`));
        }

        promise
            .then(result => {
                simulateXHRSuccess(xhr, result);
            })
            .catch(error => {
                simulateXHRError(xhr, error);
            });
    }

    /**
     * محاكاة استجابة XHR ناجحة
     * نستخدم Object.defineProperty لتجنب خطأ "Cannot set property"
     */
    function simulateXHRSuccess(xhr, data) {
        try {
            const responseText = JSON.stringify(data);
            
            // استخدام Object.defineProperty لتعيين الخصائص المحمية
            Object.defineProperty(xhr, 'status', {
                value: 200,
                writable: false,
                configurable: true
            });

            Object.defineProperty(xhr, 'readyState', {
                value: 4,
                writable: false,
                configurable: true
            });

            Object.defineProperty(xhr, 'responseText', {
                value: responseText,
                writable: false,
                configurable: true
            });

            Object.defineProperty(xhr, 'response', {
                value: responseText,
                writable: false,
                configurable: true
            });

            setTimeout(() => {
                if (typeof xhr.onreadystatechange === 'function') {
                    xhr.onreadystatechange();
                }
                if (typeof xhr.onload === 'function') {
                    xhr.onload();
                }
            }, 0);
        } catch (error) {
            console.error('❌ خطأ في simulateXHRSuccess:', error);
        }
    }

    /**
     * محاكاة استجابة XHR خاطئة
     */
    function simulateXHRError(xhr, error) {
        try {
            const errorObj = {
                code: 500,
                message: error.message || String(error),
                error: 'FLAMINGO_ERROR'
            };
            const responseText = JSON.stringify(errorObj);

            Object.defineProperty(xhr, 'status', {
                value: 500,
                writable: false,
                configurable: true
            });

            Object.defineProperty(xhr, 'readyState', {
                value: 4,
                writable: false,
                configurable: true
            });

            Object.defineProperty(xhr, 'responseText', {
                value: responseText,
                writable: false,
                configurable: true
            });

            Object.defineProperty(xhr, 'response', {
                value: responseText,
                writable: false,
                configurable: true
            });

            setTimeout(() => {
                if (typeof xhr.onreadystatechange === 'function') {
                    xhr.onreadystatechange();
                }
                if (typeof xhr.onerror === 'function') {
                    xhr.onerror();
                }
            }, 0);
        } catch (error) {
            console.error('❌ خطأ في simulateXHRError:', error);
        }
    }

    // ==========================================
    // تصدير الـ API العام
    // ==========================================

    window.FlamingoGame = {
        getGameInfo: getGameInfo,
        placeBet: placeBet,
        getGameBill: getGameBill,
        getGameRank: getGameRank,
        refreshBalance: refreshBalance,
        closeGame: closeGame,
        showMessage: showMessage,
        config: FlamingoConfig,
        debug: {
            getPendingRequests: () => pendingRequests,
            getRequestCount: () => pendingRequests.size,
        }
    };

    // ==========================================
    // التهيئة
    // ==========================================

    console.log('✅ Flamingo Bridge محمل بنجاح');
    console.log('📌 استخدم window.FlamingoGame للوصول إلى الدوال');

    // إرسال إشارة جاهزية إلى Flutter
    if (window.FlamingoApp) {
        try {
            window.FlamingoApp.postMessage(JSON.stringify({
                action: 'bridgeReady',
                message: 'Flamingo Bridge جاهز'
            }));
        } catch (error) {
            console.warn('⚠️ لم يتمكن من إرسال إشارة جاهزية:', error);
        }
    }

})();
