/**
 * Data Privacy Validator for Tradestial
 * Validates that no personal or sensitive trading data is exposed
 */

class DataPrivacyValidator {
    constructor() {
        this.violations = [];
        this.checks = [];
        this.sensitivePatterns = {
            // Financial patterns
            accountNumbers: /\b(account|acct)[\s#:]?\d{6,}/gi,
            creditCards: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            
            // Personal information
            emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phones: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            addresses: /\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd)\b/gi,
            
            // Trading sensitive data
            realPnL: /\$[\d,]{4,}\.?\d*/g, // Large dollar amounts
            realBalances: /\b(balance|equity):\s*\$[\d,]{4,}/gi,
            realPositions: /\b(position|qty):\s*[\d,]{3,}/gi,
            
            // API and system data
            apiKeys: /\b[A-Za-z0-9]{32,}\b/g,
            tokens: /bearer\s+[A-Za-z0-9._-]{20,}/gi,
            passwords: /\b(password|pwd|pass)\s*[:=]\s*\S+/gi,
            
            // Internal system paths
            systemPaths: /[C-Z]:\\[^\\s]+\\[^\\s]+/g,
            internalIPs: /\b192\.168\.\d{1,3}\.\d{1,3}\b/g,
            
            // Database or internal IDs
            internalIds: /\b(id|uuid):\s*[a-f0-9-]{20,}/gi
        };
    }

    async validateDataPrivacy() {
        console.log('🔐 Starting Data Privacy Validation...\n');

        await this.checkConsoleOutput();
        await this.checkLocalStorage();
        await this.checkGlobalVariables();
        await this.checkNetworkRequests();
        await this.checkErrorMessages();
        await this.checkDOMContent();
        await this.checkSourceCode();

        this.generatePrivacyReport();
    }

    async checkConsoleOutput() {
        console.log('📝 Checking Console Output for Sensitive Data...');
        
        // Intercept console methods
        const originalMethods = {};
        const self = this;
        
        ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
            originalMethods[method] = console[method];
            console[method] = function(...args) {
                self.scanForSensitiveData('console.' + method, args.join(' '));
                originalMethods[method].apply(console, args);
            };
        });

        // Simulate various app operations that might log data
        await this.simulateAppOperations();

        // Restore original console methods
        Object.assign(console, originalMethods);

        const consoleViolations = this.violations.filter(v => v.source.startsWith('console.'));
        this.logCheck('Console Output', consoleViolations.length === 0, 
            `${consoleViolations.length} sensitive data exposures in console`);
    }

    async checkLocalStorage() {
        console.log('💾 Checking LocalStorage for Sensitive Data...');
        
        let storageViolations = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            // Check both key and value for sensitive data
            this.scanForSensitiveData(`localStorage.key[${key}]`, key);
            this.scanForSensitiveData(`localStorage.value[${key}]`, value);
        }

        const localStorageViolations = this.violations.filter(v => v.source.includes('localStorage'));
        storageViolations = localStorageViolations.length;

        // Check sessionStorage too
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            this.scanForSensitiveData(`sessionStorage.key[${key}]`, key);
            this.scanForSensitiveData(`sessionStorage.value[${key}]`, value);
        }

        const sessionStorageViolations = this.violations.filter(v => v.source.includes('sessionStorage'));
        storageViolations += sessionStorageViolations.length;

        this.logCheck('Browser Storage', storageViolations === 0, 
            `${storageViolations} sensitive data items in storage`);
    }

    async checkGlobalVariables() {
        console.log('🌐 Checking Global Variables for Data Exposure...');
        
        let globalViolations = 0;
        const suspiciousGlobals = [];

        // Check window object for exposed data
        for (const key in window) {
            try {
                const value = window[key];
                
                // Skip functions and built-in objects
                if (typeof value === 'function' || 
                    key.startsWith('webkit') || 
                    key.startsWith('chrome') ||
                    key.startsWith('moz') ||
                    ['document', 'navigator', 'location', 'history'].includes(key)) {
                    continue;
                }

                // Check if global variable contains sensitive data
                if (typeof value === 'object' && value !== null) {
                    const serialized = JSON.stringify(value);
                    this.scanForSensitiveData(`window.${key}`, serialized);
                } else if (typeof value === 'string') {
                    this.scanForSensitiveData(`window.${key}`, value);
                }

                // Check for suspicious variable names
                if (this.isSuspiciousVariableName(key)) {
                    suspiciousGlobals.push(key);
                }
            } catch (error) {
                // Skip variables that can't be accessed
                continue;
            }
        }

        globalViolations = this.violations.filter(v => v.source.startsWith('window.')).length;

        this.logCheck('Global Variables', globalViolations === 0 && suspiciousGlobals.length === 0, 
            `${globalViolations} data exposures, ${suspiciousGlobals.length} suspicious globals`);

        if (suspiciousGlobals.length > 0) {
            console.log(`   Suspicious globals: ${suspiciousGlobals.join(', ')}`);
        }
    }

    async checkNetworkRequests() {
        console.log('🌍 Checking Network Requests for Data Leakage...');
        
        const networkViolations = [];
        
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // Check URL for sensitive data
            if (typeof url === 'string') {
                const urlViolations = this.scanForSensitiveData('fetch.url', url);
                networkViolations.push(...urlViolations);
            }
            
            // Check request body for sensitive data
            if (options.body) {
                const bodyViolations = this.scanForSensitiveData('fetch.body', options.body);
                networkViolations.push(...bodyViolations);
            }
            
            return originalFetch.apply(this, arguments);
        }.bind(this);

        // Monitor XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            const urlViolations = this.scanForSensitiveData('xhr.url', url);
            networkViolations.push(...urlViolations);
            return originalXHROpen.apply(this, arguments);
        }.bind(this);

        // Simulate network operations
        await this.simulateNetworkOperations();

        // Restore original methods
        window.fetch = originalFetch;
        XMLHttpRequest.prototype.open = originalXHROpen;

        this.logCheck('Network Requests', networkViolations.length === 0, 
            `${networkViolations.length} potential data leaks in network requests`);
    }

    async checkErrorMessages() {
        console.log('🚨 Checking Error Messages for Data Exposure...');
        
        const errorViolations = [];
        
        // Override error handling
        const originalErrorHandler = window.onerror;
        window.onerror = function(message, source, lineno, colno, error) {
            const violations = this.scanForSensitiveData('error.message', message);
            errorViolations.push(...violations);
            
            if (originalErrorHandler) {
                return originalErrorHandler.apply(this, arguments);
            }
        }.bind(this);

        // Test error scenarios
        await this.simulateErrorScenarios();

        // Restore original handler
        window.onerror = originalErrorHandler;

        this.logCheck('Error Messages', errorViolations.length === 0, 
            `${errorViolations.length} sensitive data exposures in error messages`);
    }

    async checkDOMContent() {
        console.log('📄 Checking DOM Content for Exposed Data...');
        
        let domViolations = 0;
        
        // Check all text content in DOM
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            if (text.length > 5) { // Skip very short text
                this.scanForSensitiveData('dom.textContent', text);
            }
        }

        // Check data attributes
        const elementsWithData = document.querySelectorAll('[data-*]');
        elementsWithData.forEach(element => {
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    this.scanForSensitiveData(`dom.${attr.name}`, attr.value);
                }
            });
        });

        domViolations = this.violations.filter(v => v.source.startsWith('dom.')).length;

        this.logCheck('DOM Content', domViolations === 0, 
            `${domViolations} sensitive data exposures in DOM`);
    }

    async checkSourceCode() {
        console.log('📋 Checking for Hardcoded Sensitive Data...');
        
        // This is a basic check - in a real scenario, you'd analyze the actual source files
        const scriptTags = document.querySelectorAll('script');
        let sourceViolations = 0;

        scriptTags.forEach((script, index) => {
            if (script.textContent) {
                // Check for hardcoded sensitive patterns
                const violations = this.scanForSensitiveData(`script[${index}]`, script.textContent);
                sourceViolations += violations.length;
            }
        });

        this.logCheck('Source Code', sourceViolations === 0, 
            `${sourceViolations} potential hardcoded sensitive data found`);
    }

    scanForSensitiveData(source, content) {
        if (!content || typeof content !== 'string') return [];
        
        const violations = [];
        
        Object.entries(this.sensitivePatterns).forEach(([patternName, pattern]) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    violations.push({
                        source,
                        pattern: patternName,
                        match: this.redactSensitiveData(match),
                        severity: this.getSeverity(patternName),
                        timestamp: new Date().toISOString()
                    });
                });
            }
        });

        this.violations.push(...violations);
        return violations;
    }

    redactSensitiveData(data) {
        // Redact sensitive data for reporting
        if (data.length <= 4) return '[REDACTED]';
        return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
    }

    getSeverity(patternName) {
        const highSeverity = ['accountNumbers', 'creditCards', 'ssn', 'apiKeys', 'passwords'];
        const mediumSeverity = ['emails', 'phones', 'realPnL', 'realBalances'];
        
        if (highSeverity.includes(patternName)) return 'HIGH';
        if (mediumSeverity.includes(patternName)) return 'MEDIUM';
        return 'LOW';
    }

    isSuspiciousVariableName(name) {
        const suspiciousKeywords = [
            'password', 'pass', 'pwd', 'secret', 'key', 'token', 'auth',
            'account', 'balance', 'pnl', 'profit', 'loss', 'trade', 'position',
            'user', 'customer', 'client', 'personal', 'private', 'confidential'
        ];
        
        const lowerName = name.toLowerCase();
        return suspiciousKeywords.some(keyword => lowerName.includes(keyword));
    }

    logCheck(checkName, passed, message) {
        this.checks.push({
            name: checkName,
            passed,
            message
        });
        
        console.log(`${passed ? '✅' : '❌'} ${checkName}: ${passed ? 'No issues found' : message}`);
    }

    // Simulation methods
    async simulateAppOperations() {
        // Simulate operations that might log sensitive data
        try {
            // Simulate CSV import logging
            console.log('Processing CSV file: sample_trades.csv');
            
            // Simulate analytics calculations
            console.log('Calculating portfolio metrics...');
            
            // Simulate error scenarios
            console.log('Trade validation complete');
            
        } catch (error) {
            console.error('Simulation error:', error.message);
        }
    }

    async simulateNetworkOperations() {
        // These should not actually make requests, just test the monitoring
        try {
            // This would be caught by our network monitoring
            // await fetch('https://api.example.com/data');
        } catch (error) {
            // Expected - no actual network calls should be made
        }
    }

    async simulateErrorScenarios() {
        try {
            // Simulate various error conditions
            throw new Error('Processing failed');
        } catch (error) {
            // Error caught and analyzed
        }
    }

    generatePrivacyReport() {
        console.log('\n' + '='.repeat(70));
        console.log('🔐 DATA PRIVACY VALIDATION REPORT - TRADESTIAL');
        console.log('='.repeat(70));

        const totalChecks = this.checks.length;
        const passedChecks = this.checks.filter(c => c.passed).length;
        const failedChecks = totalChecks - passedChecks;

        console.log(`\n📊 PRIVACY COMPLIANCE SUMMARY:`);
        console.log(`   Total Checks: ${totalChecks}`);
        console.log(`   Passed: ${passedChecks}`);
        console.log(`   Failed: ${failedChecks}`);
        console.log(`   Compliance Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

        // Categorize violations by severity
        const highSeverityViolations = this.violations.filter(v => v.severity === 'HIGH');
        const mediumSeverityViolations = this.violations.filter(v => v.severity === 'MEDIUM');
        const lowSeverityViolations = this.violations.filter(v => v.severity === 'LOW');

        console.log(`\n🚨 PRIVACY VIOLATIONS FOUND:`);
        console.log(`   High Severity: ${highSeverityViolations.length}`);
        console.log(`   Medium Severity: ${mediumSeverityViolations.length}`);
        console.log(`   Low Severity: ${lowSeverityViolations.length}`);
        console.log(`   Total Violations: ${this.violations.length}`);

        if (this.violations.length > 0) {
            console.log('\n📋 DETAILED VIOLATIONS:');
            this.violations.forEach((violation, index) => {
                console.log(`   ${index + 1}. [${violation.severity}] ${violation.source}`);
                console.log(`      Pattern: ${violation.pattern}`);
                console.log(`      Data: ${violation.match}`);
            });
        }

        console.log('\n✅ PRIVACY CHECKS RESULTS:');
        this.checks.forEach(check => {
            console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}: ${check.message}`);
        });

        // Privacy compliance assessment
        let complianceLevel;
        if (highSeverityViolations.length > 0) {
            complianceLevel = 'CRITICAL - Immediate action required';
        } else if (mediumSeverityViolations.length > 0) {
            complianceLevel = 'MODERATE - Review and fix recommended';
        } else if (lowSeverityViolations.length > 0) {
            complianceLevel = 'MINOR - Low-priority improvements available';
        } else {
            complianceLevel = 'EXCELLENT - No privacy violations detected';
        }

        console.log(`\n🎯 PRIVACY COMPLIANCE LEVEL: ${complianceLevel}`);

        console.log('\n📋 RECOMMENDATIONS:');
        if (this.violations.length === 0) {
            console.log('   ✅ Application meets privacy standards');
            console.log('   • Continue regular privacy audits');
            console.log('   • Monitor for data exposure in production');
        } else {
            console.log('   🔧 IMMEDIATE ACTIONS:');
            if (highSeverityViolations.length > 0) {
                console.log('   • Remove or encrypt high-sensitivity data exposures');
                console.log('   • Implement data redaction in logging');
            }
            if (mediumSeverityViolations.length > 0) {
                console.log('   • Review medium-severity data exposures');
                console.log('   • Implement data masking where appropriate');
            }
            console.log('   • Add data privacy checks to development workflow');
            console.log('   • Implement production data monitoring');
        }

        console.log('\n🛡️ PRIVACY PROTECTION STATUS:');
        console.log(`   Data Leakage Prevention: ${this.violations.length === 0 ? 'ACTIVE' : 'NEEDS IMPROVEMENT'}`);
        console.log(`   Console Security: ${this.violations.filter(v => v.source.startsWith('console')).length === 0 ? 'SECURE' : 'VULNERABLE'}`);
        console.log(`   Storage Security: ${this.violations.filter(v => v.source.includes('Storage')).length === 0 ? 'SECURE' : 'VULNERABLE'}`);
        console.log(`   Network Security: ${this.violations.filter(v => v.source.includes('fetch') || v.source.includes('xhr')).length === 0 ? 'SECURE' : 'VULNERABLE'}`);

        return {
            complianceRate: (passedChecks / totalChecks) * 100,
            violations: this.violations,
            checks: this.checks,
            complianceLevel
        };
    }
}

// Make available for browser console
if (typeof window !== 'undefined') {
    window.DataPrivacyValidator = DataPrivacyValidator;
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = DataPrivacyValidator;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.document) {
    console.log('🔐 Data Privacy Validator loaded. Run: new DataPrivacyValidator().validateDataPrivacy()');
}
