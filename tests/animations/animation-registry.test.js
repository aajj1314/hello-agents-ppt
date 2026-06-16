// tests/animations/animation-registry.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationRegistry, registerAnimation, getAnimation, _resetRegistry } from '../../js/animations/animation-registry.js';

describe('AnimationRegistry', () => {
    beforeEach(() => _resetRegistry());

    it('registerAnimation + getAnimation returns factory', () => {
        const factory = () => ({ name: 'x' });
        registerAnimation('ch1', factory);
        expect(getAnimation('ch1')).toBe(factory);
    });

    it('getAnimation returns undefined for unknown id', () => {
        expect(getAnimation('unknown')).toBeUndefined();
    });

    it('registerAnimation overwrites existing id', () => {
        registerAnimation('ch1', () => 'a');
        registerAnimation('ch1', () => 'b');
        expect(getAnimation('ch1')()).toBe('b');
    });
});
