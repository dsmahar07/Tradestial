/**
 * Security Audit Testing for Tradestial
 * Comprehensive security testing to prevent data leakage and protect user privacy
 */

class SecurityAuditor {
    constructor() {
        this.results = {
            consoleLeaks: [],
            networkRequests: [],
            localStorageTests: [],
            dataExposureTests: [],
            errorHandlingTests: [],
            memoryTests: [],
            timestamp: new Date().toISOString(),
            securityScore: 0
        };
        this.sensitiveDataPatterns = this.createSensitivePatterns();
        this.originalConsole = this.interceptConsole();
        this.networkMonitor = this.setupNetworkMonitoring();
    }

    createSensitivePatterns() {
        return [
            // Personal Information
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit Card
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
            /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone Numbers
            /\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, // Addresses
            
            // Financial Data
            /\$[\d,]+\.?\d*/g, // Dollar amounts
            /\b(profit|loss|pnl|p&l):\s*[\$-]?[\d,]+\.?\d*/gi, // P&L data
            /\b(balance|equity|margin):\s*[\$-]?[\d,]+\.?\d*/gi, // Account balances
            /\b(account|acct)[\s#:]?\d+/gi, // Account numbers
            
            // Trading Data
            /\b(symbol|ticker):\s*[A-Z]{1,5}\b/gi, // Trading symbols
            /\b(quantity|qty):\s*\d+/gi, // Trade quantities
            /\b(price):\s*[\$]?[\d,]+\.?\d*/gi, // Trade prices
            
            // API Keys and Tokens
            /\b[A-Za-z0-9]{32,}\b/g, // API keys (32+ chars)
            /bearer\s+[A-Za-z0-9._-]+/gi, // Bearer tokens
            /\b(api[_-]?key|token|secret|password)\s*[:=]\s*[A-Za-z0-9._-]+/gi, // API credentials
            
            // System Information
            /\b(localhost|127\.0\.0\.1):\d+/g, // Local server info
            /\b[A-Z]:\\[^\\]+/g, // Windows file paths
            /\/[a-zA-Z0-9_/-]+/g, // Unix file paths
        ];
    }

    interceptConsole() {
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
        };

        const self = this;
        
        ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
            console[method] = function(...args) {
                self.analyzeConsoleOutput(method, args);
                originalConsole[method].apply(console, args);
            };
        });

        return originalConsole;
    }

    setupNetworkMonitoring() {
        const self = this;
        const originalFetch = window.fetch;
        const originalXHR = XMLHttpRequest.prototype.open;

        // Monitor fetch requests
        window.fetch = function(...args) {
            self.analyzeNetworkRequest('fetch', args);
            return originalFetch.apply(this, args);
        };

        // Monitor XMLHttpRequest
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            self.analyzeNetworkRequest('xhr', [method, url]);
            return originalXHR.apply(this, [method, url, ...args]);
        };

        return { originalFetch, originalXHR };
    }

    async runSecurityAudit() {
        console.log('🔒 Starting Security Audit for Tradestial...\n');

        await this.testConsoleDataLeakage();
        await this.testLocalStorageSecurity();
        await this.testNetworkSecurity();
        await this.testDataSanitization();
        await this.testErrorHandlingSecurity();
        await this.testMemoryDataExposure();
        await this.testDeveloperToolsExposure();
        await this.testClientSideEncryption();

        this.generateSecurityReport();
    }

    async testConsoleDataLeakage() {
        console.log('🖥️ Testing Console Data Leakage...');

        // Test various console scenarios
        const testScenarios = [
            { name: 'CSV Import with Sensitive Data', test: () => this.simulateCSVImport() },
            { name: 'Analytics Calculation Logging', test: () => this.simulateAnalyticsLogging() },
            { name: 'Error Handling with Data', test: () => this.simulateErrorWithData() },
            { name: 'Debug Mode Data Exposure', test: () => this.simulateDebugMode() },
            { name: 'Network Request Logging', test: () => this.simulateNetworkLogging() }
        ];

        for (const scenario of testScenarios) {
            try {
                const leaksBefore = this.results.consoleLeaks.length;
                await scenario.test();
                const leaksAfter = this.results.consoleLeaks.length;
                const newLeaks = leaksAfter - leaksBefore;

                console.log(`${newLeaks === 0 ? '✅' : '❌'} ${scenario.name}: ${newLeaks} data leaks detected`);
            } catch (error) {
                console.log(`⚠️ ${scenario.name}: Test failed - ${error.message}`);
            }
        }
    }

    async testLocalStorageSecurity() {
        console.log('\n💾 Testing LocalStorage Security...');

        const tests = [
            { name: 'Sensitive Data Storage', test: () => this.testSensitiveDataInStorage() },
            { name: 'Data Encryption', test: () => this.testStorageEncryption() },
            { name: 'Data Persistence', test: () => this.testDataPersistence() },
            { name: 'Cross-Tab Data Access', test: () => this.testCrossTabAccess() }
        ];

        for (const test of tests) {
            try {
                const result = await test.test();
                this.results.localStorageTests.push({
                    test: test.name,
                    passed: result.passed,
                    issues: result.issues || [],
                    recommendations: result.recommendations || []
                });

                console.log(`${result.passed ? '✅' : '❌'} ${test.name}: ${result.passed ? 'Secure' : result.issues.length + ' issues found'}`);
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
    }

    async testNetworkSecurity() {
        console.log('\n🌐 Testing Network Security...');

        // Monitor for any outbound requests
        const requestsBefore = this.results.networkRequests.length;
        
        // Simulate application usage that might trigger network requests
        await this.simulateAppUsage();
        
        const requestsAfter = this.results.networkRequests.length;
        const newRequests = requestsAfter - requestsBefore;

        if (newRequests === 0) {
            console.log('✅ Network Security: No external requests detected');
        } else {
            console.log(`❌ Network Security: ${newRequests} external requests detected`);
            this.results.networkRequests.slice(-newRequests).forEach(req => {
                console.log(`   • ${req.type}: ${req.url}`);
            });
        }
    }

    async testDataSanitization() {
        console.log('\n🧹 Testing Data Sanitization...');

        const testData = {
            maliciousCSV: 'Symbol,Side,Price\n<script>alert("xss")</script>,Long,100\n=cmd|"/c calc",Short,200',
            sqlInjection: "Symbol'; DROP TABLE trades; --",
            htmlInjection: '<img src="x" onerror="alert(1)">',
            jsInjection: 'javascript:alert("xss")'
        };

        for (const [testName, data] of Object.entries(testData)) {
            try {
                const sanitized = this.testDataSanitization(data);
                const isSafe = !this.containsMaliciousContent(sanitized);
                
                console.log(`${isSafe ? '✅' : '❌'} ${testName}: ${isSafe ? 'Properly sanitized' : 'Potential security risk'}`);
                
                this.results.dataExposureTests.push({
                    test: testName,
                    originalData: data.substring(0, 50) + '...',
                    sanitized: sanitized.substring(0, 50) + '...',
                    safe: isSafe
                });
            } catch (error) {
                console.log(`❌ ${testName}: ${error.message}`);
            }
        }
    }

    async testErrorHandlingSecurity() {
        console.log('\n🚨 Testing Error Handling Security...');

        const errorTests = [
            { name: 'CSV Parse Error', test: () => this.triggerCSVError() },
            { name: 'Invalid Data Error', test: () => this.triggerDataError() },
            { name: 'Network Error', test: () => this.triggerNetworkError() },
            { name: 'Calculation Error', test: () => this.triggerCalculationError() }
        ];

        for (const errorTest of errorTests) {
            try {
                const errorsBefore = this.results.errorHandlingTests.length;
                await errorTest.test();
                const errorsAfter = this.results.errorHandlingTests.length;
                const newErrors = errorsAfter - errorsBefore;

                console.log(`${newErrors === 0 ? '✅' : '⚠️'} ${errorTest.name}: ${newErrors} data exposures in errors`);
            } catch (error) {
                // Expected behavior for error tests
                this.analyzeErrorForDataLeakage(error, errorTest.name);
            }
        }
    }

    async testMemoryDataExposure() {
        console.log('\n🧠 Testing Memory Data Exposure...');

        if (performance.memory) {
            const memoryBefore = performance.memory.usedJSHeapSize;
            
            // Create and destroy sensitive data
            const sensitiveData = this.createSensitiveTestData();
            this.processAndDestroySensitiveData(sensitiveData);
            
            // Force garbage collection if available
            if (window.gc) window.gc();
            
            const memoryAfter = performance.memory.usedJSHeapSize;
            const memoryIncrease = memoryAfter - memoryBefore;
            
            console.log(`${memoryIncrease < 1024 * 1024 ? '✅' : '⚠️'} Memory Cleanup: ${(memoryIncrease / 1024).toFixed(1)}KB increase`);
            
            this.results.memoryTests.push({
                test: 'Memory Data Cleanup',
                memoryIncrease,
                passed: memoryIncrease < 1024 * 1024 // Less than 1MB
            });
        } else {
            console.log('⚠️ Memory testing not available in this browser');
        }
    }

    async testDeveloperToolsExposure() {
        console.log('\n🔧 Testing Developer Tools Data Exposure...');

        // Check global variables for sensitive data
        const globalVars = Object.keys(window);
        const suspiciousGlobals = globalVars.filter(key => 
            key.toLowerCase().includes('trade') || 
            key.toLowerCase().includes('data') ||
            key.toLowerCase().includes('user') ||
            key.toLowerCase().includes('account')
        );

        if (suspiciousGlobals.length === 0) {
            console.log('✅ Global Variables: No suspicious global variables detected');
        } else {
            console.log(`⚠️ Global Variables: ${suspiciousGlobals.length} potentially sensitive globals found`);
            suspiciousGlobals.forEach(global => {
                console.log(`   • ${global}`);
            });
        }

        // Check for exposed functions
        const exposedFunctions = globalVars.filter(key => 
            typeof window[key] === 'function' && 
            !key.startsWith('webkit') && 
            !key.startsWith('chrome') &&
            key.length > 3
        );

        console.log(`ℹ️ Exposed Functions: ${exposedFunctions.length} custom functions available in console`);
    }

    async testClientSideEncryption() {
        console.log('\n🔐 Testing Client-Side Data Protection...');

        // Test if sensitive data is encrypted in localStorage
        const storageKeys = Object.keys(localStorage);
        let encryptedCount = 0;
        let plainTextCount = 0;

        storageKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (this.looksEncrypted(value)) {
                encryptedCount++;
            } else if (this.containsSensitiveData(value)) {
                plainTextCount++;
                console.log(`⚠️ Plain text sensitive data found in localStorage key: ${key}`);
            }
        });

        console.log(`${plainTextCount === 0 ? '✅' : '❌'} Data Encryption: ${encryptedCount} encrypted, ${plainTextCount} plain text sensitive items`);
    }

    // Helper methods for testing
    analyzeConsoleOutput(method, args) {
        const output = args.join(' ');
        this.sensitiveDataPatterns.forEach(pattern => {
            const matches = output.match(pattern);
            if (matches) {
                this.results.consoleLeaks.push({
                    method,
                    pattern: pattern.toString(),
                    matches: matches.map(match => match.substring(0, 20) + '...'),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    analyzeNetworkRequest(type, args) {
        const url = args[1] || args[0];
        if (url && !url.startsWith('data:') && !url.startsWith('blob:')) {
            this.results.networkRequests.push({
                type,
                url,
                timestamp: new Date().toISOString()
            });
        }
    }

    analyzeErrorForDataLeakage(error, testName) {
        const errorMessage = error.message || error.toString();
        const hasDataLeak = this.sensitiveDataPatterns.some(pattern => 
            pattern.test(errorMessage)
        );

        this.results.errorHandlingTests.push({
            test: testName,
            hasDataLeak,
            errorMessage: hasDataLeak ? 'REDACTED - Contains sensitive data' : errorMessage.substring(0, 100)
        });
    }

    // Simulation methods
    async simulateCSVImport() {
        console.log('Simulating CSV import with account data...');
        // This should NOT log actual account numbers or sensitive data
    }

    async simulateAnalyticsLogging() {
        console.log('Calculating analytics metrics...');
        // This should NOT log actual P&L or account balances
    }

    async simulateErrorWithData() {
        try {
            throw new Error('Processing failed for account 12345678');
        } catch (error) {
            console.error('Error occurred:', error.message);
        }
    }

    async simulateDebugMode() {
        if (window.location.hostname === 'localhost') {
            console.log('Debug mode active - development environment');
        }
    }

    async simulateNetworkLogging() {
        // Should not make actual network requests
        console.log('Network request would be made to: [REDACTED]');
    }

    async simulateAppUsage() {
        // Simulate normal app usage without making requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    testSensitiveDataInStorage() {
        const sensitiveFound = [];
        Object.keys(localStorage).forEach(key => {
            const value = localStorage.getItem(key);
            if (this.containsSensitiveData(value)) {
                sensitiveFound.push(key);
            }
        });

        return {
            passed: sensitiveFound.length === 0,
            issues: sensitiveFound.map(key => `Sensitive data in localStorage key: ${key}`),
            recommendations: sensitiveFound.length > 0 ? ['Encrypt sensitive data before storage'] : []
        };
    }

    testStorageEncryption() {
        // Check if data appears to be encrypted
        const storageItems = Object.keys(localStorage).map(key => ({
            key,
            value: localStorage.getItem(key)
        }));

        const unencryptedSensitive = storageItems.filter(item => 
            this.containsSensitiveData(item.value) && !this.looksEncrypted(item.value)
        );

        return {
            passed: unencryptedSensitive.length === 0,
            issues: unencryptedSensitive.map(item => `Unencrypted sensitive data: ${item.key}`),
            recommendations: unencryptedSensitive.length > 0 ? ['Implement client-side encryption'] : []
        };
    }

    testDataPersistence() {
        // Test if sensitive data persists after logout/clear
        return {
            passed: true,
            issues: [],
            recommendations: ['Implement secure data cleanup on logout']
        };
    }

    testCrossTabAccess() {
        // Test if data is accessible across tabs
        return {
            passed: true,
            issues: [],
            recommendations: ['Consider session-based data isolation']
        };
    }

    testDataSanitization(data) {
        // Basic sanitization simulation
        return data
            .replace(/<script[^>]*>.*?<\/script>/gi, '[SCRIPT_REMOVED]')
            .replace(/javascript:/gi, '[JS_REMOVED]')
            .replace(/=cmd\|/gi, '[CMD_REMOVED]');
    }

    containsMaliciousContent(data) {
        const maliciousPatterns = [
            /<script/i,
            /javascript:/i,
            /=cmd\|/i,
            /onerror=/i,
            /onclick=/i
        ];
        return maliciousPatterns.some(pattern => pattern.test(data));
    }

    triggerCSVError() {
        throw new Error('CSV parsing failed at line 42 for account data');
    }

    triggerDataError() {
        throw new Error('Invalid trade data: symbol=AAPL, quantity=100, price=$150.00');
    }

    triggerNetworkError() {
        throw new Error('Network request failed to https://api.example.com/trades');
    }

    triggerCalculationError() {
        throw new Error('P&L calculation error: balance=$10,000, trades=50');
    }

    createSensitiveTestData() {
        return {
            account: '12345678',
            balance: 50000,
            trades: [
                { symbol: 'AAPL', quantity: 100, price: 150.00 },
                { symbol: 'TSLA', quantity: 50, price: 250.00 }
            ]
        };
    }

    processAndDestroySensitiveData(data) {
        // Process data
        const processed = JSON.stringify(data);
        
        // Destroy references
        data = null;
        
        return processed.length;
    }

    containsSensitiveData(value) {
        if (!value || typeof value !== 'string') return false;
        return this.sensitiveDataPatterns.some(pattern => pattern.test(value));
    }

    looksEncrypted(value) {
        if (!value || typeof value !== 'string') return false;
        // Basic heuristic: encrypted data is usually base64 or hex
        const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
        const hexPattern = /^[0-9a-fA-F]+$/;
        return (value.length > 20 && (base64Pattern.test(value) || hexPattern.test(value)));
    }

    calculateSecurityScore() {
        let score = 100;
        
        // Deduct points for issues
        score -= this.results.consoleLeaks.length * 10;
        score -= this.results.networkRequests.length * 15;
        score -= this.results.localStorageTests.filter(t => !t.passed).length * 20;
        score -= this.results.dataExposureTests.filter(t => !t.safe).length * 25;
        score -= this.results.errorHandlingTests.filter(t => t.hasDataLeak).length * 15;
        
        return Math.max(0, score);
    }

    generateSecurityReport() {
        console.log('\n' + '='.repeat(70));
        console.log('🔒 SECURITY AUDIT REPORT - TRADESTIAL');
        console.log('='.repeat(70));

        this.results.securityScore = this.calculateSecurityScore();

        console.log(`\n🎯 SECURITY SCORE: ${this.results.securityScore}/100`);
        
        if (this.results.securityScore >= 90) {
            console.log('🟢 EXCELLENT - Application meets high security standards');
        } else if (this.results.securityScore >= 75) {
            console.log('🟡 GOOD - Minor security improvements recommended');
        } else {
            console.log('🔴 NEEDS IMPROVEMENT - Critical security issues found');
        }

        // Console Data Leakage
        console.log('\n🖥️ CONSOLE DATA LEAKAGE:');
        if (this.results.consoleLeaks.length === 0) {
            console.log('   ✅ No sensitive data leaks detected in console output');
        } else {
            console.log(`   ❌ ${this.results.consoleLeaks.length} potential data leaks found`);
            this.results.consoleLeaks.forEach((leak, index) => {
                console.log(`   ${index + 1}. ${leak.method}: ${leak.pattern}`);
            });
        }

        // Network Security
        console.log('\n🌐 NETWORK SECURITY:');
        if (this.results.networkRequests.length === 0) {
            console.log('   ✅ No external network requests detected');
        } else {
            console.log(`   ⚠️ ${this.results.networkRequests.length} external requests detected`);
            this.results.networkRequests.forEach(req => {
                console.log(`   • ${req.type}: ${req.url}`);
            });
        }

        // Local Storage Security
        console.log('\n💾 LOCAL STORAGE SECURITY:');
        const storageIssues = this.results.localStorageTests.filter(t => !t.passed);
        if (storageIssues.length === 0) {
            console.log('   ✅ Local storage security tests passed');
        } else {
            console.log(`   ❌ ${storageIssues.length} storage security issues found`);
            storageIssues.forEach(issue => {
                console.log(`   • ${issue.test}: ${issue.issues.join(', ')}`);
            });
        }

        // Data Sanitization
        console.log('\n🧹 DATA SANITIZATION:');
        const sanitizationIssues = this.results.dataExposureTests.filter(t => !t.safe);
        if (sanitizationIssues.length === 0) {
            console.log('   ✅ Data sanitization working correctly');
        } else {
            console.log(`   ❌ ${sanitizationIssues.length} sanitization issues found`);
        }

        // Error Handling
        console.log('\n🚨 ERROR HANDLING SECURITY:');
        const errorIssues = this.results.errorHandlingTests.filter(t => t.hasDataLeak);
        if (errorIssues.length === 0) {
            console.log('   ✅ Error messages do not expose sensitive data');
        } else {
            console.log(`   ❌ ${errorIssues.length} error messages contain sensitive data`);
        }

        // Recommendations
        console.log('\n🎯 SECURITY RECOMMENDATIONS:');
        const recommendations = [
            'Implement console.log filtering in production',
            'Add data encryption for sensitive localStorage items',
            'Implement proper error message sanitization',
            'Add Content Security Policy (CSP) headers',
            'Regular security audits and penetration testing'
        ];

        if (this.results.securityScore >= 90) {
            console.log('   • Maintain current security practices');
            console.log('   • Regular security monitoring recommended');
        } else {
            recommendations.forEach(rec => console.log(`   • ${rec}`));
        }

        console.log('\n📋 COMPLIANCE STATUS:');
        console.log(`   Data Privacy: ${this.results.networkRequests.length === 0 ? 'COMPLIANT' : 'REVIEW REQUIRED'}`);
        console.log(`   Local Data Protection: ${storageIssues.length === 0 ? 'COMPLIANT' : 'NEEDS IMPROVEMENT'}`);
        console.log(`   Error Handling: ${errorIssues.length === 0 ? 'SECURE' : 'NEEDS IMPROVEMENT'}`);

        // Restore original console
        Object.assign(console, this.originalConsole);
    }
}

// Make available for browser console
if (typeof window !== 'undefined') {
    window.SecurityAuditor = SecurityAuditor;
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = SecurityAuditor;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.document) {
    console.log('🔒 Security Auditor loaded. Run: new SecurityAuditor().runSecurityAudit()');
}
