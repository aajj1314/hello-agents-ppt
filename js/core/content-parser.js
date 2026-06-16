// js/core/content-parser.js
import { escapeHTML } from './utils.js';

export class ContentParser {
    parse(content) {
        if (content == null) return '';
        if (typeof content !== 'string') return String(content);
        const lines = content.split('\n');
        let html = '';
        let listBuffer = [];
        let listType = null;

        const flushList = () => {
            if (!listBuffer.length) return;
            if (listType === 'table') {
                html += this._renderTable(listBuffer);
            } else {
                const tag = listType === 'ol' ? 'ol' : 'ul';
                html += `<${tag} class="bullet-points">${listBuffer.map(li => `<li>${this._inline(li)}</li>`).join('')}</${tag}>`;
            }
            listBuffer = [];
            listType = null;
        };

        for (let raw of lines) {
            const line = raw.replace(/\r$/, '');
            const trimmed = line.trim();

            if (/^\s*\|.*\|\s*$/.test(line)) {
                if (listType !== 'table') flushList();
                listType = 'table';
                listBuffer.push(trimmed);
                continue;
            }

            const bulletMatch = trimmed.match(/^([-•*])\s+(.+)$/) || trimmed.match(/^(\d+)[.)、]\s+(.+)$/);
            if (bulletMatch) {
                const type = /^\d+[.)、]/.test(trimmed) ? 'ol' : 'ul';
                if (listType !== type) flushList();
                listType = type;
                listBuffer.push(bulletMatch[2]);
                continue;
            }

            if (!trimmed) { flushList(); continue; }

            flushList();

            const boxMatch = trimmed.match(/^\[(提示|注意|警告|重要|成功)\]\s*(.+)$/);
            if (boxMatch) {
                const [, level, text] = boxMatch;
                const cls = /警告|注意/.test(level) ? 'warning-box' : /成功/.test(level) ? 'success-box' : 'info-box';
                html += `<div class="${cls}">${this._inline(text)}</div>`;
                continue;
            }

            html += `<p>${this._inline(trimmed)}</p>`;
        }
        flushList();
        return html;
    }

    _inline(text) {
        return escapeHTML(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    }

    _renderTable(rows) {
        const clean = rows.map(r => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim()));
        const isSep = (row) => row.every(c => /^[-:]+$/.test(c));
        const body = clean.filter(r => !isSep(r));
        if (!body.length) return '';
        const [head, ...rest] = body;
        return `<table class="comparison-table"><thead><tr>${head.map(h => `<th>${this._inline(h)}</th>`).join('')}</tr></thead><tbody>${rest.map(r => `<tr>${r.map(c => `<td>${this._inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
}
