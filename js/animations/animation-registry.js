// js/animations/animation-registry.js
export const AnimationRegistry = new Map();

export function registerAnimation(id, factory) {
    AnimationRegistry.set(id, factory);
}

export function getAnimation(id) {
    return AnimationRegistry.get(id);
}

export function _resetRegistry() {
    AnimationRegistry.clear();
}
