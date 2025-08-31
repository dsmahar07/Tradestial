/**
 * Accessibility Testing Suite for Tradestial
 * Automated WCAG 2.1 compliance checking
 */

class AccessibilityTester {
    constructor() {
        this.results = {
            violations: [],
            passes: [],
            incomplete: [],
            summary: {},
            timestamp: new Date().toISOString()
        };
    }

    async runAccessibilityAudit() {
        console.log('♿ Starting Accessibility Audit for Tradestial...\n');

        // Test keyboard navigation
        await this.testKeyboardNavigation();
        
        // Test color contrast
        await this.testColorContrast();
        
        // Test ARIA labels
        await this.testAriaLabels();
        
        // Test form accessibility
        await this.testFormAccessibility();
        
        // Test heading structure
        await this.testHeadingStructure();
        
        // Test image alt text
        await this.testImageAltText();
        
        // Test focus management
        await this.testFocusManagement();

        this.generateAccessibilityReport();
    }

    async testKeyboardNavigation() {
        console.log('⌨️ Testing Keyboard Navigation...');
        
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        
        let issues = [];
        let passes = 0;

        focusableElements.forEach((element, index) => {
            // Check if element is visible
            const style = window.getComputedStyle(element);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
            
            if (!isVisible) {
                issues.push(`Focusable element ${index + 1} is not visible`);
                return;
            }

            // Check for focus indicators
            element.focus();
            const focusedStyle = window.getComputedStyle(element, ':focus');
            const hasFocusIndicator = focusedStyle.outline !== 'none' || 
                                    focusedStyle.boxShadow !== 'none' ||
                                    focusedStyle.border !== element.style.border;

            if (hasFocusIndicator) {
                passes++;
            } else {
                issues.push(`Element ${element.tagName} lacks focus indicator`);
            }
        });

        this.logResult('keyboard-navigation', {
            total: focusableElements.length,
            passes,
            issues,
            description: 'Keyboard navigation and focus indicators'
        });
    }

    async testColorContrast() {
        console.log('🎨 Testing Color Contrast...');
        
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label');
        let issues = [];
        let passes = 0;

        textElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const color = style.color;
            const backgroundColor = style.backgroundColor;
            
            // Skip if no text content
            if (!element.textContent.trim()) return;

            // Basic contrast check (simplified)
            if (color === backgroundColor) {
                issues.push(`Poor contrast detected on ${element.tagName}`);
            } else {
                passes++;
            }
        });

        this.logResult('color-contrast', {
            total: textElements.length,
            passes,
            issues,
            description: 'Color contrast ratios'
        });
    }

    async testAriaLabels() {
        console.log('🏷️ Testing ARIA Labels...');
        
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, [role="button"], [role="link"]');
        let issues = [];
        let passes = 0;

        interactiveElements.forEach(element => {
            const hasAriaLabel = element.hasAttribute('aria-label');
            const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
            const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
            const hasTextContent = element.textContent.trim().length > 0;
            const hasAltText = element.hasAttribute('alt');

            if (hasAriaLabel || hasAriaLabelledBy || hasTextContent || hasAltText) {
                passes++;
            } else {
                issues.push(`${element.tagName} missing accessible name`);
            }
        });

        this.logResult('aria-labels', {
            total: interactiveElements.length,
            passes,
            issues,
            description: 'ARIA labels and accessible names'
        });
    }

    async testFormAccessibility() {
        console.log('📝 Testing Form Accessibility...');
        
        const formElements = document.querySelectorAll('input, textarea, select');
        let issues = [];
        let passes = 0;

        formElements.forEach(element => {
            const hasLabel = document.querySelector(`label[for="${element.id}"]`) || 
                           element.closest('label') ||
                           element.hasAttribute('aria-label');
            
            const hasRequiredIndicator = element.hasAttribute('required') && 
                                       (element.hasAttribute('aria-required') || 
                                        document.querySelector(`[aria-describedby="${element.id}"]`));

            if (hasLabel) {
                passes++;
            } else {
                issues.push(`Form field ${element.type || element.tagName} missing label`);
            }

            if (element.hasAttribute('required') && !hasRequiredIndicator) {
                issues.push(`Required field missing proper indication`);
            }
        });

        this.logResult('form-accessibility', {
            total: formElements.length,
            passes,
            issues,
            description: 'Form field labels and requirements'
        });
    }

    async testHeadingStructure() {
        console.log('📋 Testing Heading Structure...');
        
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let issues = [];
        let passes = 0;
        let previousLevel = 0;

        if (headings.length === 0) {
            issues.push('No headings found on page');
        } else {
            headings.forEach((heading, index) => {
                const level = parseInt(heading.tagName.charAt(1));
                
                if (index === 0 && level !== 1) {
                    issues.push('Page should start with h1');
                } else if (level > previousLevel + 1) {
                    issues.push(`Heading level jumps from h${previousLevel} to h${level}`);
                } else {
                    passes++;
                }
                
                previousLevel = level;
            });
        }

        this.logResult('heading-structure', {
            total: headings.length,
            passes,
            issues,
            description: 'Logical heading hierarchy'
        });
    }

    async testImageAltText() {
        console.log('🖼️ Testing Image Alt Text...');
        
        const images = document.querySelectorAll('img');
        let issues = [];
        let passes = 0;

        images.forEach(img => {
            const hasAlt = img.hasAttribute('alt');
            const altText = img.getAttribute('alt');
            const isDecorative = altText === '';
            
            if (hasAlt) {
                if (isDecorative || altText.length > 0) {
                    passes++;
                } else {
                    issues.push('Image has empty alt attribute but may not be decorative');
                }
            } else {
                issues.push('Image missing alt attribute');
            }
        });

        this.logResult('image-alt-text', {
            total: images.length,
            passes,
            issues,
            description: 'Image alternative text'
        });
    }

    async testFocusManagement() {
        console.log('🎯 Testing Focus Management...');
        
        let issues = [];
        let passes = 0;

        // Test for focus traps in modals
        const modals = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');
        modals.forEach(modal => {
            const focusableInModal = modal.querySelectorAll(
                'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableInModal.length > 0) {
                passes++;
            } else {
                issues.push('Modal without focusable elements');
            }
        });

        // Test for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"], .skip-link');
        if (skipLinks.length > 0) {
            passes++;
        } else {
            issues.push('No skip links found for keyboard users');
        }

        this.logResult('focus-management', {
            total: modals.length + 1, // modals + skip links
            passes,
            issues,
            description: 'Focus management and skip links'
        });
    }

    logResult(testName, result) {
        if (result.issues.length > 0) {
            this.results.violations.push({
                test: testName,
                ...result
            });
            console.log(`❌ ${result.description}: ${result.issues.length} issues found`);
        } else {
            this.results.passes.push({
                test: testName,
                ...result
            });
            console.log(`✅ ${result.description}: All checks passed`);
        }
    }

    generateAccessibilityReport() {
        console.log('\n' + '='.repeat(70));
        console.log('♿ ACCESSIBILITY AUDIT REPORT - TRADESTIAL');
        console.log('='.repeat(70));

        const totalTests = this.results.violations.length + this.results.passes.length;
        const passedTests = this.results.passes.length;
        const failedTests = this.results.violations.length;

        console.log(`\n📊 SUMMARY:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${failedTests}`);
        console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (this.results.violations.length > 0) {
            console.log('\n🚨 ACCESSIBILITY VIOLATIONS:');
            this.results.violations.forEach((violation, index) => {
                console.log(`\n${index + 1}. ${violation.description.toUpperCase()}`);
                violation.issues.forEach(issue => {
                    console.log(`   • ${issue}`);
                });
            });
        }

        console.log('\n✅ PASSED TESTS:');
        this.results.passes.forEach(pass => {
            console.log(`   • ${pass.description}: ${pass.passes}/${pass.total} elements compliant`);
        });

        console.log('\n🎯 RECOMMENDATIONS:');
        if (failedTests > 0) {
            console.log('   • Fix accessibility violations before deployment');
            console.log('   • Test with screen readers (NVDA, JAWS, VoiceOver)');
            console.log('   • Validate with automated tools (axe-core, WAVE)');
        }
        console.log('   • Conduct user testing with disabled users');
        console.log('   • Implement accessibility testing in CI/CD pipeline');

        // Calculate WCAG compliance level
        const complianceLevel = passedTests / totalTests;
        if (complianceLevel >= 0.95) {
            console.log('\n🏆 WCAG 2.1 AA Compliance: EXCELLENT');
        } else if (complianceLevel >= 0.85) {
            console.log('\n⚠️ WCAG 2.1 AA Compliance: GOOD (needs minor fixes)');
        } else {
            console.log('\n❌ WCAG 2.1 AA Compliance: NEEDS IMPROVEMENT');
        }

        this.results.summary = {
            totalTests,
            passedTests,
            failedTests,
            successRate: (passedTests / totalTests) * 100,
            complianceLevel: complianceLevel >= 0.95 ? 'excellent' : complianceLevel >= 0.85 ? 'good' : 'needs-improvement'
        };
    }
}

// Make available for browser console
if (typeof window !== 'undefined') {
    window.AccessibilityTester = AccessibilityTester;
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = AccessibilityTester;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.document) {
    console.log('♿ Accessibility Tester loaded. Run: new AccessibilityTester().runAccessibilityAudit()');
}
