/**
 * Mock Data - بيانات وهمية للعبة
 * ================================================
 * هذا الملف يحتوي على بيانات وهمية لتشغيل اللعبة بدون سيرفر
 */

(function() {
    'use strict';

    console.log('🎮 تحميل بيانات وهمية للعبة...');

    // ==========================================
    // بيانات اللاعب
    // ==========================================

    const mockPlayerData = {
        userId: 'player_' + Math.random().toString(36).substr(2, 9),
        username: 'لاعب ' + Math.floor(Math.random() * 1000),
        balance: 10000,
        totalWins: 42,
        totalLosses: 18,
        level: 5,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random(),
        joinDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: new Date().toISOString(),
        vipLevel: 0,
        totalBets: 60,
        winRate: (42 / 60 * 100).toFixed(2) + '%'
    };

    // ==========================================
    // بيانات المباريات
    // ==========================================

    const mockMatches = [
        {
            id: 'match_1',
            homeTeam: 'فريق النسور',
            awayTeam: 'فريق الأسود',
            homeOdds: 1.85,
            awayOdds: 2.10,
            drawOdds: 3.50,
            status: 'live',
            homeScore: 2,
            awayScore: 1,
            time: '45+2',
            league: 'الدوري السعودي',
            date: new Date().toISOString()
        },
        {
            id: 'match_2',
            homeTeam: 'فريق الهلال',
            awayTeam: 'فريق الاتحاد',
            homeOdds: 1.65,
            awayOdds: 2.40,
            drawOdds: 3.80,
            status: 'scheduled',
            homeScore: 0,
            awayScore: 0,
            time: '00:00',
            league: 'الدوري السعودي',
            date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'match_3',
            homeTeam: 'فريق الشباب',
            awayTeam: 'فريق الرياض',
            homeOdds: 2.00,
            awayOdds: 1.95,
            drawOdds: 3.40,
            status: 'finished',
            homeScore: 3,
            awayScore: 2,
            time: '90+5',
            league: 'الدوري السعودي',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    // ==========================================
    // سجل الرهانات
    // ==========================================

    const mockBetHistory = [
        {
            id: 'bet_1',
            matchId: 'match_3',
            choice: 'home',
            amount: 500,
            odds: 2.00,
            result: 'win',
            winAmount: 1000,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            match: 'فريق الشباب vs فريق الرياض'
        },
        {
            id: 'bet_2',
            matchId: 'match_3',
            choice: 'away',
            amount: 300,
            odds: 1.95,
            result: 'loss',
            winAmount: 0,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            match: 'فريق الشباب vs فريق الرياض'
        },
        {
            id: 'bet_3',
            matchId: 'match_1',
            choice: 'home',
            amount: 200,
            odds: 1.85,
            result: 'pending',
            winAmount: 0,
            date: new Date().toISOString(),
            match: 'فريق النسور vs فريق الأسود'
        }
    ];

    // ==========================================
    // ترتيب اللاعبين
    // ==========================================

    const mockRanking = [
        { rank: 1, username: 'الأسطورة', balance: 50000, wins: 150, level: 10 },
        { rank: 2, username: 'الفارس', balance: 45000, wins: 145, level: 9 },
        { rank: 3, username: 'الملك', balance: 40000, wins: 140, level: 9 },
        { rank: 4, username: 'الحارس', balance: 35000, wins: 135, level: 8 },
        { rank: 5, username: 'المحارب', balance: 30000, wins: 130, level: 8 },
        { rank: 6, username: 'الصياد', balance: 25000, wins: 125, level: 7 },
        { rank: 7, username: 'الجندي', balance: 20000, wins: 120, level: 7 },
        { rank: 8, username: 'الفتى', balance: 15000, wins: 115, level: 6 },
        { rank: 9, username: 'الشاب', balance: 12000, wins: 110, level: 6 },
        { rank: 10, username: 'الصبي', balance: 10000, wins: 105, level: 5 }
    ];

    // ==========================================
    // دوال محاكاة الـ API
    // ==========================================

    /**
     * محاكاة جلب معلومات اللعبة
     */
    window.mockGetGameInfo = function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        player: mockPlayerData,
                        matches: mockMatches,
                        currentBalance: mockPlayerData.balance,
                        todayWins: 2,
                        todayLosses: 1,
                        todayProfit: 700
                    }
                });
            }, 500);
        });
    };

    /**
     * محاكاة وضع رهان
     */
    window.mockPlaceBet = function(choice, amount) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // محاكاة نتيجة عشوائية
                const isWin = Math.random() > 0.5;
                const odds = choice === 'home' ? 1.85 : 2.10;
                const winAmount = isWin ? amount * odds : 0;

                // تحديث الرصيد
                mockPlayerData.balance += winAmount - amount;
                if (isWin) {
                    mockPlayerData.totalWins++;
                } else {
                    mockPlayerData.totalLosses++;
                }
                mockPlayerData.totalBets++;

                resolve({
                    success: true,
                    data: {
                        betId: 'bet_' + Date.now(),
                        choice: choice,
                        amount: amount,
                        odds: odds,
                        result: isWin ? 'win' : 'loss',
                        winAmount: winAmount,
                        newBalance: mockPlayerData.balance,
                        message: isWin ? '🎉 رهان رابح!' : '😢 رهان خاسر'
                    }
                });
            }, 800);
        });
    };

    /**
     * محاكاة جلب سجل الرهانات
     */
    window.mockGetGameBill = function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        bets: mockBetHistory,
                        totalBets: mockBetHistory.length,
                        totalWins: mockBetHistory.filter(b => b.result === 'win').length,
                        totalLosses: mockBetHistory.filter(b => b.result === 'loss').length,
                        totalEarnings: mockBetHistory
                            .filter(b => b.result === 'win')
                            .reduce((sum, b) => sum + b.winAmount, 0)
                    }
                });
            }, 500);
        });
    };

    /**
     * محاكاة جلب ترتيب اللاعبين
     */
    window.mockGetGameRank = function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // إضافة اللاعب الحالي إلى الترتيب
                const playerRank = {
                    rank: Math.floor(Math.random() * 100) + 11,
                    username: mockPlayerData.username,
                    balance: mockPlayerData.balance,
                    wins: mockPlayerData.totalWins,
                    level: mockPlayerData.level
                };

                resolve({
                    success: true,
                    data: {
                        ranking: mockRanking,
                        playerRank: playerRank,
                        totalPlayers: 5000
                    }
                });
            }, 500);
        });
    };

    /**
     * محاكاة تحديث الرصيد
     */
    window.mockRefreshBalance = function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        balance: mockPlayerData.balance,
                        lastUpdate: new Date().toISOString()
                    }
                });
            }, 300);
        });
    };

    /**
     * محاكاة إغلاق اللعبة
     */
    window.mockCloseGame = function() {
        console.log('🎮 إغلاق اللعبة...');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'تم إغلاق اللعبة بنجاح'
                });
            }, 300);
        });
    };

    /**
     * محاكاة عرض رسالة
     */
    window.mockShowMessage = function(title, message, isError) {
        console.log((isError ? '❌' : '✅') + ' ' + title + ': ' + message);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 100);
        });
    };

    // ==========================================
    // تصدير البيانات الوهمية
    // ==========================================

    window.MockData = {
        playerData: mockPlayerData,
        matches: mockMatches,
        betHistory: mockBetHistory,
        ranking: mockRanking,
        
        // دوال الـ API
        getGameInfo: window.mockGetGameInfo,
        placeBet: window.mockPlaceBet,
        getGameBill: window.mockGetGameBill,
        getGameRank: window.mockGetGameRank,
        refreshBalance: window.mockRefreshBalance,
        closeGame: window.mockCloseGame,
        showMessage: window.mockShowMessage
    };

    console.log('✅ تم تحميل البيانات الوهمية بنجاح');
    console.log('📊 بيانات اللاعب:', mockPlayerData);
    console.log('🎮 دوال الـ API جاهزة');

})();
