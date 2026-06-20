// tests/a11y/helpers.js — axe-core wrapper with jsdom fallback
import axe from 'axe-core';

/**
 * Run axe-core against the given context. axe-core has limited
 * support for jsdom (e.g. layout-dependent rules such as color-contrast
 * and landmark visibility often cannot be evaluated), so failures are
 * captured and returned as part of the result rather than thrown.
 *
 * @param {Document|Element} [context=document]
 * @param {object} [options]
 * @returns {Promise<{ok: boolean, violations: Array, error: Error|null}>}
 */
export async function runAxe(context = document, options = {}) {
    try {
        const result = await axe.run(context, {
            resultTypes: ['violations'],
            rules: {
                // jsdom does not implement layout — disable rules that
                // depend on getComputedStyle / layout results.
                'color-contrast': { enabled: false },
                region: { enabled: false }
            },
            ...options
        });
        return { ok: result.violations.length === 0, violations: result.violations, error: null };
    } catch (err) {
        return { ok: false, violations: [], error: err };
    }
}

/**
 * Build a one-line summary of axe violations. Useful for failing
 * tests with a readable list of issues.
 */
export function summarizeViolations(violations, limit = 5) {
    if (!violations.length) return 'no violations';
    return violations.slice(0, limit).map(v => `${v.id}: ${v.help}`).join(' | ');
}
