/**
 * Flamingo Bridge - نسخة محسّنة مع دعم البيانات الوهمية
 * ================================================
 * هذا الملف يحول طلبات اللعبة إلى استدعاءات Flutter أو بيانات وهمية
 */

(function() {
    'use strict';

    console.log('🔗 تحميل Flamingo Bridge (Mock Mode)...');

    // ==========================================
    // إعدادات الـ Bridge
    // ==========================================

    const FlamingoConfig = {
        debug: true,
        useMockData: true,  // استخدام البيانات الوهمية
        requestTimeout: 30000,
        maxRetries: 3,
    };

    // ==========================================
    // إدارة الطلبات المعلقة
    // ==========================================

    const pendingRequests = new Map();
    let requestId = 0;

    function generateRequestId() {
        return `req_${++requestId}_${Date.now()}`;
    }

    function sendToFlutter(action, params = {}) {
        return new Promise((resolve, reject) => {
            const reqId = generateRequestId();
            
            if (FlamingoConfig.debug) {
                console.log(`📤 إرسال إلى Flutter: ${action}`, params);
            }

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

            try {
                if (window.FlamingoApp) {
                    window.FlamingoApp.postMessage(JSON.stringify({
                        action: action,
                        requestId: reqId,
                        params: params
                    }));
                } else {
                    // استخدام البيانات الوهمية إذا لم يكن FlamingoApp متاحًا
                    if (FlamingoConfig.useMockData) {
                        handleMockRequest(action, params, request);
                    } else {
                        reject(new Error('FlamingoApp غير متاح'));
                    }
                }
            } catch (error) {
                pendingRequests.delete(reqId);
                clearTimeout(request.timeout);
                reject(error);
            }
        });
    }

    /**
     * معالجة الطلبات الوهمية
     */
    function handleMockRequest(action, params, request) {
        let mockFn = null;

        switch (action) {
            case 'game_info':
                mockFn = window.mockGetGameInfo;
                break;
            case 'game_choice':
                mockFn = () => window.mockPlaceBet(params.choice, params.gold);
                break;
            case 'game_bill':
                mockFn = window.mockGetGameBill;
                break;
            case 'game_rank':
                mockFn = window.mockGetGameRank;
                break;
            case 'refreshBalance':
                mockFn = window.mockRefreshBalance;
                break;
            case 'close':
                mockFn = window.mockCloseGame;
                break;
            case 'showMessage':
                mockFn = () => window.mockShowMessage(params.title, params.message, params.isError);
                break;
        }

        if (mockFn) {
            mockFn().then(result => {
                clearTimeout(request.timeout);
                pendingRequests.delete(request.id);
                request.resolve(result.data || result);
            }).catch(error => {
                clearTimeout(request.timeout);
                pendingRequests.delete(request.id);
                request.reject(error);
            });
        } else {
            clearTimeout(request.timeout);
            pendingRequests.delete(request.id);
            request.reject(new Error(`Unknown action: ${action}`));
        }
    }

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

        clearTimeout(request.timeout);
        pendingRequests.delete(reqId);

        if (response.success) {
            request.resolve(response.data);
        } else {
            request.reject(new Error(response.error || 'خطأ غير معروف'));
        }
    };

    // ==========================================
    // دوال الـ Bridge الرئيسية
    // ==========================================

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

    function refreshBalance() {
        try {
            sendToFlutter('refreshBalance', {});
        } catch (error) {
            console.error('❌ خطأ في تحديث الرصيد:', error);
        }
    }

    function closeGame() {
        try {
            sendToFlutter('close', {});
        } catch (error) {
            console.error('❌ خطأ في إغلاق اللعبة:', error);
        }
    }

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

        if (url && url.indexOf('/v1/football/') !== -1) {
            const mapping = mapGameEndpoint(url, method, body);
            
            if (mapping && mapping.fn) {
                if (FlamingoConfig.debug) {
                    console.log(`🔄 تحويل الطلب: ${url} → ${mapping.fn}`);
                }
                return executeGameFunction(mapping.fn, mapping.params);
            }
        }

        return originalFetch.apply(this, arguments);
    };

    // ==========================================
    // اعتراض XMLHttpRequest
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

        return originalSend.apply(this, arguments);
    };

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
                promise = Promise.reject(new Error(`Unknown function: ${functionName}`));
        }

        return promise.then(data => {
            const response = new Response(JSON.stringify(data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
            return response;
        }).catch(error => {
            const response = new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
            return response;
        });
    }

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
                promise = Promise.reject(new Error(`Unknown function: ${functionName}`));
        }

        promise.then(data => {
            xhr.responseText = JSON.stringify(data);
            xhr.status = 200;
            xhr.readyState = 4;
            xhr.onreadystatechange && xhr.onreadystatechange();
        }).catch(error => {
            xhr.responseText = JSON.stringify({ error: error.message });
            xhr.status = 400;
            xhr.readyState = 4;
            xhr.onreadystatechange && xhr.onreadystatechange();
        });
    }

    // ==========================================
    // تصدير الدوال
    // ==========================================

    window.FlamingoAPI = {
        getGameInfo: getGameInfo,
        placeBet: placeBet,
        getGameBill: getGameBill,
        getGameRank: getGameRank,
        refreshBalance: refreshBalance,
        closeGame: closeGame,
        showMessage: showMessage,
        config: FlamingoConfig
    };

    console.log('✅ تم تحميل Flamingo Bridge بنجاح');
    console.log('🎮 الوضع:', FlamingoConfig.useMockData ? 'Mock Mode (بيانات وهمية)' : 'Live Mode (سيرفر حقيقي)');

})();
