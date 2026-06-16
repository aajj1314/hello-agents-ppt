// js/core/utils.js

export const $ = (selector, context = document) => context.querySelector(selector);

export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

export function createElement(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
        if (key === 'className') el.className = val;
        else if (key === 'dataset') Object.assign(el.dataset, val);
        else if (key.startsWith('on') && typeof val === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), val);
        } else {
            el.setAttribute(key, val);
        }
    });
    children.forEach(child => {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else if (child) el.appendChild(child);
    });
    return el;
}

export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function throttle(fn, delay) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            lastTime = now;
            fn.apply(this, args);
        }
    };
}

export function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

export async function loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return response.json();
}

export function getURLParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}
