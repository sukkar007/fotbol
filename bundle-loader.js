/**
 * Bundle Loader - تحميل الـ bundles من Cocos Creator بشكل صحيح
 * يحل مشكلة Link Error: 701
 */

(function() {
    'use strict';

    const BundleLoader = {
        bundles: {},
        loaded: {},
        loading: {},
        
        /**
         * تسجيل bundle
         */
        registerBundle: function(name, path) {
            this.bundles[name] = path;
            console.log('📦 تم تسجيل bundle: ' + name + ' -> ' + path);
        },
        
        /**
         * تحميل bundle
         */
        loadBundle: function(name, callback) {
            if (this.loaded[name]) {
                console.log('✅ Bundle مُحمّل بالفعل: ' + name);
                callback && callback(null);
                return;
            }
            
            if (this.loading[name]) {
                console.log('⏳ Bundle قيد التحميل: ' + name);
                return;
            }
            
            this.loading[name] = true;
            const path = this.bundles[name];
            
            if (!path) {
                console.error('❌ Bundle غير مسجل: ' + name);
                callback && callback(new Error('Bundle not registered: ' + name));
                return;
            }
            
            console.log('📥 جاري تحميل bundle: ' + name + ' من ' + path);
            
            // محاولة تحميل الملف
            this._loadFile(path, function(err, data) {
                delete this.loading[name];
                
                if (err) {
                    console.error('❌ فشل تحميل bundle: ' + name, err);
                    callback && callback(err);
                    return;
                }
                
                this.loaded[name] = true;
                console.log('✅ تم تحميل bundle: ' + name);
                callback && callback(null);
            }.bind(this));
        },
        
        /**
         * تحميل ملف
         */
        _loadFile: function(path, callback) {
            const xhr = new XMLHttpRequest();
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    callback(null, xhr.responseText);
                } else {
                    callback(new Error('HTTP ' + xhr.status + ': ' + path));
                }
            };
            
            xhr.onerror = function() {
                callback(new Error('Failed to load: ' + path));
            };
            
            xhr.ontimeout = function() {
                callback(new Error('Timeout loading: ' + path));
            };
            
            xhr.timeout = 30000; // 30 ثانية
            
            try {
                xhr.open('GET', path, true);
                xhr.send();
            } catch(e) {
                callback(e);
            }
        },
        
        /**
         * تحميل جميع الـ bundles
         */
        loadAll: function(callback) {
            const names = Object.keys(this.bundles);
            let loaded = 0;
            let errors = [];
            
            if (names.length === 0) {
                callback && callback(null);
                return;
            }
            
            names.forEach(function(name) {
                this.loadBundle(name, function(err) {
                    if (err) {
                        errors.push(err);
                    }
                    loaded++;
                    
                    if (loaded === names.length) {
                        callback && callback(errors.length > 0 ? errors : null);
                    }
                });
            }.bind(this));
        }
    };
    
    // تسجيل الـ bundles الافتراضية
    BundleLoader.registerBundle('internal', 'assets/internal/index.d0832.js');
    BundleLoader.registerBundle('resources', 'assets/resources/index.b68d6.js');
    BundleLoader.registerBundle('main', 'assets/main/index.017db.js');
    
    // تصدير الـ BundleLoader
    window.BundleLoader = BundleLoader;
    
    console.log('✅ Bundle Loader تم تحميله بنجاح');
})();
