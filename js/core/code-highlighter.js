// js/core/code-highlighter.js
import { escapeHTML } from './utils.js';

const KEYWORDS = {
    python: ['class','def','return','if','elif','else','for','while','in','import','from','as','with','try','except','finally','True','False','None','self','pass','break','continue','lambda','yield','async','await','not','and','or','is','print','raise','global','nonlocal'],
    js: ['function','class','const','let','var','return','if','else','for','while','new','this','async','await','try','catch','throw','true','false','null','undefined','import','from','export','default','typeof','instanceof']
};

export function highlightCode(code, language) {
    if (!code) return '';

    const isPy = language === 'python' || language === 'py';
    const isJs = language === 'javascript' || language === 'js' || language === 'ts' || language === 'typescript';
    const isJson = language === 'json';

    // Step 1: escape HTML
    let html = escapeHTML(code);

    // Step 2: tokenize — capture strings/comments into placeholders to prevent keyword pollution
    const placeholders = [];
    const store = (match, wrapped) => {
        const key = `\x00PH${placeholders.length}\x00`;
        placeholders.push(wrapped || match);
        return key;
    };

    if (isJson) {
        // JSON keys: "key": (colon consumed into placeholder)
        html = html.replace(/("(?:[^"\\]|\\.)*")\s*:/g, (m, s) => store(m, `<span class="kw">${s}</span>:`));
        // JSON values: remaining strings
        html = html.replace(/("(?:[^"\\]|\\.)*")/g, (m, s) => store(m, `<span class="str">${s}</span>`));
        html = html.replace(/\b(true|false|null)\b/g, (m) => store(m, `<span class="comment">${m}</span>`));
        html = html.replace(/\b(\d+)\b/g, (m) => store(m, `<span class="num">${m}</span>`));
    } else {
        // Comments
        if (isPy) {
            html = html.replace(/(#[^\n]*)/g, (m) => store(m, `<span class="comment">${m}</span>`));
        } else if (isJs) {
            html = html.replace(/(\/\/[^\n]*)/g, (m) => store(m, `<span class="comment">${m}</span>`));
        } else {
            html = html.replace(/(\/\/[^\n]*|#[^\n]*)/g, (m) => store(m, `<span class="comment">${m}</span>`));
        }

        // Strings (both " and ')
        html = html.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (m) => store(m, `<span class="str">${m}</span>`));

        // Keywords
        const keywords = isPy ? KEYWORDS.python : isJs ? KEYWORDS.js : [];
        if (keywords.length) {
            const re = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
            html = html.replace(re, (m) => store(m, `<span class="kw">${m}</span>`));
        }

        // Numbers (only standalone, not inside strings/comments which are already tokenized)
        html = html.replace(/\b(\d+)\b/g, (m) => store(m, `<span class="num">${m}</span>`));
    }

    // Step 3: restore placeholders
    placeholders.forEach((val, i) => {
        html = html.replace(`\x00PH${i}\x00`, val);
    });

    return html;
}
