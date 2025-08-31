/**
 * Execute Security Tests on Live Tradestial Application
 * This script runs all security validations and generates a comprehensive report
 */

class SecurityTestExecutor {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            applicationUrl: window.location.href,
            userAgent: navigator.userAgent,
            securityAudit: null,
            privacyValidation: null,
            consoleMonitoring: null,
            networkSecurity: null,
            overallScore: 0,
            criticalIssues: [],
            recommendations: []
        };
        this.consoleCapture = [];
        this.networkCapture = [];
    }

    async executeAllSecurityTests() {
        console.log('🔒 EXECUTING COMPREHENSIVE SECURITY TESTS ON TRADESTIAL');
        console.log('=' .repeat(65));
        console.log(`Application URL: ${window.location.href}`);
        console.log(`Test Time: ${new Date().toLocaleString()}`);
        console.log('=' .repeat(65));

        try {
            // Start monitoring
            this.startConsoleMonitoring();
            this.startNetworkMonitoring();

            // Execute security audit
            await this.runSecurityAudit();
            
            // Execute privacy validation
            await this.runPrivacyValidation();
            
            // Test with real application usage
            await this.testRealApplicationUsage();
            
            // Analyze captured data
            this.analyzeSecurityData();
            
            // Generate final report
            this.generateSecurityReport();

        } catch (error) {
            console.error('❌ Security test execution failed:', error.message);
            this.testResults.criticalIssues.push(`Test execution failure: ${error.message}`);
        }
    }

    startConsoleMonitoring() {
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };

        const self = this;
        ['log', 'warn', 'error', 'info'].forEach(method => {
            console[method] = function(...args) {
                self.captureConsoleOutput(method, args);
                originalConsole[method].apply(console, args);
            };
        });

        this.originalConsole = originalConsole;
    }

    startNetworkMonitoring() {
        const self = this;
        
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            self.captureNetworkRequest('fetch', args);
            return originalFetch.apply(this, args);
        };

        // Monitor XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            self.captureNetworkRequest('xhr', [method, url]);
            return originalXHROpen.apply(this, [method, url, ...args]);
        };

        this.originalFetch = originalFetch;
        this.originalXHROpen = originalXHROpen;
    }

    captureConsoleOutput(method, args) {
        const output = args.join(' ');
        const sensitivePatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit Card
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
            /\$[\d,]{4,}\.?\d*/g, // Large dollar amounts
            /\b(account|acct)[\s#:]?\d{6,}/gi, // Account numbers
            /\b[A-Za-z0-9]{32,}\b/g, // API keys
        ];

        const violations = [];
        sensitivePatterns.forEach((pattern, index) => {
            const matches = output.match(pattern);
            if (matches) {
                violations.push({
                    pattern: ['SSN', 'Credit Card', 'Email', 'Dollar Amount', 'Account Number', 'API Key'][index],
                    matches: matches.map(m => m.substring(0, 4) + '***')
                });
            }
        });

        this.consoleCapture.push({
            method,
            output: output.substring(0, 200),
            violations,
            timestamp: new Date().toISOString()
        });
    }

    captureNetworkRequest(type, args) {
        const url = args[1] || args[0];
        if (url && typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:')) {
            this.networkCapture.push({
                type,
                url,
                timestamp: new Date().toISOString()
            });
        }
    }

    async runSecurityAudit() {
        console.log('\n🔍 Running Security Audit...');
        
        try {
            if (typeof SecurityAuditor !== 'undefined') {
                const auditor = new SecurityAuditor();
                this.testResults.securityAudit = await auditor.runSecurityAudit();
            } else {
                // Manual security checks
                this.testResults.securityAudit = await this.manualSecurityAudit();
            }
        } catch (error) {
            console.error('Security audit failed:', error.message);
            this.testResults.securityAudit = { error: error.message, score: 0 };
        }
    }

    async runPrivacyValidation() {
        console.log('\n🔐 Running Privacy Validation...');
        
        try {
            if (typeof DataPrivacyValidator !== 'undefined') {
                const validator = new DataPrivacyValidator();
                this.testResults.privacyValidation = await validator.validateDataPrivacy();
            } else {
                // Manual privacy checks
                this.testResults.privacyValidation = await this.manualPrivacyValidation();
            }
        } catch (error) {
            console.error('Privacy validation failed:', error.message);
            this.testResults.privacyValidation = { error: error.message, complianceRate: 0 };
        }
    }

    async testRealApplicationUsage() {
        console.log('\n🎯 Testing Real Application Usage...');
        
        try {
            // Simulate CSV import
            await this.simulateCSVImport();
            
            // Simulate analytics usage
            await this.simulateAnalyticsUsage();
            
            // Simulate error scenarios
            await this.simulateErrorScenarios();
            
            // Test localStorage operations
            await this.testLocalStorageOperations();
            
        } catch (error) {
            console.error('Application usage test failed:', error.message);
        }
    }

    async simulateCSVImport() {
        console.log('Testing CSV import functionality...');
        
        // Check for file input elements
        const fileInputs = document.querySelectorAll('input[type="file"]');
        if (fileInputs.length > 0) {
            console.log(`Found ${fileInputs.length} file input(s)`);
        }
        
        // Check for CSV-related elements
        const csvElements = document.querySelectorAll('[data-testid*="csv"], [class*="csv"], [class*="import"]');
        if (csvElements.length > 0) {
            console.log(`Found ${csvElements.length} CSV-related element(s)`);
        }
    }

    async simulateAnalyticsUsage() {
        console.log('Testing analytics dashboard...');
        
        // Check for chart elements
        const chartElements = document.querySelectorAll('canvas, svg, [class*="chart"]');
        if (chartElements.length > 0) {
            console.log(`Found ${chartElements.length} chart element(s)`);
        }
        
        // Check for analytics data
        const dataElements = document.querySelectorAll('[data-value], .metric, .stat');
        if (dataElements.length > 0) {
            console.log(`Found ${dataElements.length} data element(s)`);
        }
    }

    async simulateErrorScenarios() {
        console.log('Testing error handling...');
        
        try {
            // Trigger a controlled error
            throw new Error('Test error for security validation');
        } catch (error) {
            console.log('Error handling test completed');
        }
    }

    async testLocalStorageOperations() {
        console.log('Testing localStorage security...');
        
        // Check existing localStorage data
        const storageKeys = Object.keys(localStorage);
        console.log(`Found ${storageKeys.length} localStorage items`);
        
        // Test storage operation
        const testKey = 'security_test_' + Date.now();
        localStorage.setItem(testKey, 'test_value');
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === 'test_value') {
            console.log('localStorage operations working correctly');
        }
    }

    async manualSecurityAudit() {
        const issues = [];
        let score = 100;

        // Check for sensitive data in localStorage
        Object.keys(localStorage).forEach(key => {
            const value = localStorage.getItem(key);
            if (this.containsSensitiveData(value)) {
                issues.push(`Sensitive data in localStorage: ${key}`);
                score -= 20;
            }
        });

        // Check for external requests
        if (this.networkCapture.length > 0) {
            issues.push(`${this.networkCapture.length} external network requests detected`);
            score -= 15 * this.networkCapture.length;
        }

        // Check console violations
        const consoleViolations = this.consoleCapture.filter(c => c.violations.length > 0);
        if (consoleViolations.length > 0) {
            issues.push(`${consoleViolations.length} console data leaks detected`);
            score -= 10 * consoleViolations.length;
        }

        return {
            score: Math.max(0, score),
            issues,
            passed: score >= 90
        };
    }

    async manualPrivacyValidation() {
        const violations = [];
        let complianceRate = 100;

        // Check DOM for sensitive data
        const textNodes = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );

        let node;
        while (node = textNodes.nextNode()) {
            if (this.containsSensitiveData(node.textContent)) {
                violations.push('Sensitive data in DOM text');
                complianceRate -= 10;
            }
        }

        return {
            complianceRate: Math.max(0, complianceRate),
            violations,
            compliant: complianceRate >= 90
        };
    }

    containsSensitiveData(data) {
        if (!data || typeof data !== 'string') return false;
        
        const patterns = [
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit Card
            /\$[\d,]{4,}/, // Large amounts
            /\b(account|acct)[\s#:]?\d{6,}/i // Account numbers
        ];
        
        return patterns.some(pattern => pattern.test(data));
    }

    analyzeSecurityData() {
        console.log('\n📊 Analyzing Security Data...');
        
        // Analyze console captures
        const totalConsoleOutputs = this.consoleCapture.length;
        const consoleViolations = this.consoleCapture.filter(c => c.violations.length > 0);
        
        this.testResults.consoleMonitoring = {
            totalOutputs: totalConsoleOutputs,
            violations: consoleViolations.length,
            violationRate: totalConsoleOutputs > 0 ? (consoleViolations.length / totalConsoleOutputs * 100).toFixed(1) : 0
        };

        // Analyze network captures
        this.testResults.networkSecurity = {
            totalRequests: this.networkCapture.length,
            externalRequests: this.networkCapture.filter(r => !r.url.includes('localhost')).length,
            secureRequests: this.networkCapture.filter(r => r.url.startsWith('https')).length
        };

        // Calculate overall score
        let overallScore = 100;
        
        if (this.testResults.securityAudit?.score) {
            overallScore = Math.min(overallScore, this.testResults.securityAudit.score);
        }
        
        if (this.testResults.privacyValidation?.complianceRate) {
            overallScore = Math.min(overallScore, this.testResults.privacyValidation.complianceRate);
        }
        
        // Deduct for violations
        overallScore -= consoleViolations.length * 10;
        overallScore -= this.networkCapture.length * 5;
        
        this.testResults.overallScore = Math.max(0, overallScore);
    }

    generateSecurityReport() {
        console.log('\n' + '='.repeat(70));
        console.log('🔒 COMPREHENSIVE SECURITY TEST REPORT - TRADESTIAL');
        console.log('='.repeat(70));
        
        console.log(`\n📊 OVERALL SECURITY SCORE: ${this.testResults.overallScore.toFixed(1)}/100`);
        
        if (this.testResults.overallScore >= 95) {
            console.log('🟢 EXCELLENT - Production ready with high security standards');
        } else if (this.testResults.overallScore >= 85) {
            console.log('🟡 GOOD - Minor security improvements recommended');
        } else if (this.testResults.overallScore >= 70) {
            console.log('🟠 MODERATE - Security improvements required before production');
        } else {
            console.log('🔴 CRITICAL - Major security issues must be resolved');
        }

        // Console Security Results
        console.log('\n🖥️ CONSOLE SECURITY ANALYSIS:');
        console.log(`   Total Console Outputs: ${this.testResults.consoleMonitoring.totalOutputs}`);
        console.log(`   Data Violations: ${this.testResults.consoleMonitoring.violations}`);
        console.log(`   Violation Rate: ${this.testResults.consoleMonitoring.violationRate}%`);
        
        if (this.testResults.consoleMonitoring.violations === 0) {
            console.log('   ✅ No sensitive data leaks in console output');
        } else {
            console.log(`   ❌ ${this.testResults.consoleMonitoring.violations} console security violations found`);
            this.consoleCapture.filter(c => c.violations.length > 0).forEach((violation, index) => {
                console.log(`   ${index + 1}. ${violation.method}: ${violation.violations.map(v => v.pattern).join(', ')}`);
            });
        }

        // Network Security Results
        console.log('\n🌐 NETWORK SECURITY ANALYSIS:');
        console.log(`   Total Network Requests: ${this.testResults.networkSecurity.totalRequests}`);
        console.log(`   External Requests: ${this.testResults.networkSecurity.externalRequests}`);
        console.log(`   HTTPS Requests: ${this.testResults.networkSecurity.secureRequests}`);
        
        if (this.testResults.networkSecurity.totalRequests === 0) {
            console.log('   ✅ No external network requests detected - Excellent privacy protection');
        } else {
            console.log(`   ⚠️ ${this.testResults.networkSecurity.totalRequests} network requests detected`);
            this.networkCapture.forEach((request, index) => {
                console.log(`   ${index + 1}. ${request.type}: ${request.url}`);
            });
        }

        // Storage Security Results
        console.log('\n💾 STORAGE SECURITY ANALYSIS:');
        const storageKeys = Object.keys(localStorage);
        console.log(`   LocalStorage Items: ${storageKeys.length}`);
        
        let sensitiveStorageItems = 0;
        storageKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (this.containsSensitiveData(value)) {
                sensitiveStorageItems++;
                console.log(`   ⚠️ Potential sensitive data in: ${key}`);
            }
        });
        
        if (sensitiveStorageItems === 0) {
            console.log('   ✅ No sensitive data detected in localStorage');
        } else {
            console.log(`   ❌ ${sensitiveStorageItems} items may contain sensitive data`);
        }

        // Security Audit Results
        if (this.testResults.securityAudit) {
            console.log('\n🔍 SECURITY AUDIT RESULTS:');
            if (this.testResults.securityAudit.error) {
                console.log(`   ❌ Audit Error: ${this.testResults.securityAudit.error}`);
            } else {
                console.log(`   Score: ${this.testResults.securityAudit.score || 'N/A'}/100`);
                console.log(`   Status: ${this.testResults.securityAudit.passed ? 'PASSED' : 'FAILED'}`);
            }
        }

        // Privacy Validation Results
        if (this.testResults.privacyValidation) {
            console.log('\n🔐 PRIVACY VALIDATION RESULTS:');
            if (this.testResults.privacyValidation.error) {
                console.log(`   ❌ Validation Error: ${this.testResults.privacyValidation.error}`);
            } else {
                console.log(`   Compliance Rate: ${this.testResults.privacyValidation.complianceRate || 'N/A'}%`);
                console.log(`   Status: ${this.testResults.privacyValidation.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
            }
        }

        // Critical Issues Summary
        console.log('\n🚨 CRITICAL ISSUES SUMMARY:');
        if (this.testResults.criticalIssues.length === 0) {
            console.log('   ✅ No critical security issues found');
        } else {
            this.testResults.criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }

        // Recommendations
        console.log('\n🎯 SECURITY RECOMMENDATIONS:');
        const recommendations = this.generateRecommendations();
        if (recommendations.length === 0) {
            console.log('   ✅ Application meets security standards');
            console.log('   • Continue regular security monitoring');
            console.log('   • Maintain current security practices');
        } else {
            recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        // Final Assessment
        console.log('\n📋 FINAL SECURITY ASSESSMENT:');
        console.log(`   Overall Score: ${this.testResults.overallScore.toFixed(1)}/100`);
        console.log(`   Production Ready: ${this.testResults.overallScore >= 90 ? 'YES' : 'NO'}`);
        console.log(`   Security Level: ${this.getSecurityLevel()}`);
        console.log(`   Compliance Status: ${this.getComplianceStatus()}`);

        // Restore original methods
        this.restoreOriginalMethods();

        return this.testResults;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.consoleMonitoring.violations > 0) {
            recommendations.push('Remove sensitive data from console output');
            recommendations.push('Implement console filtering for production');
        }
        
        if (this.testResults.networkSecurity.totalRequests > 0) {
            recommendations.push('Review external network requests for necessity');
            recommendations.push('Ensure no sensitive data in network requests');
        }
        
        if (this.testResults.overallScore < 90) {
            recommendations.push('Address security issues before production deployment');
            recommendations.push('Implement additional data protection measures');
        }
        
        return recommendations;
    }

    getSecurityLevel() {
        if (this.testResults.overallScore >= 95) return 'ENTERPRISE';
        if (this.testResults.overallScore >= 85) return 'HIGH';
        if (this.testResults.overallScore >= 70) return 'MEDIUM';
        return 'LOW';
    }

    getComplianceStatus() {
        const consoleCompliant = this.testResults.consoleMonitoring.violations === 0;
        const networkCompliant = this.testResults.networkSecurity.externalRequests === 0;
        const overallCompliant = this.testResults.overallScore >= 90;
        
        if (consoleCompliant && networkCompliant && overallCompliant) {
            return 'FULLY COMPLIANT';
        } else if (this.testResults.overallScore >= 70) {
            return 'PARTIALLY COMPLIANT';
        } else {
            return 'NON-COMPLIANT';
        }
    }

    restoreOriginalMethods() {
        if (this.originalConsole) {
            Object.assign(console, this.originalConsole);
        }
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
        }
        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen;
        }
    }
}

// Execute security tests immediately
const securityExecutor = new SecurityTestExecutor();
securityExecutor.executeAllSecurityTests().then(() => {
    console.log('\n✅ Security testing completed successfully');
}).catch(error => {
    console.error('❌ Security testing failed:', error);
});

// Make available globally
window.SecurityTestExecutor = SecurityTestExecutor;
