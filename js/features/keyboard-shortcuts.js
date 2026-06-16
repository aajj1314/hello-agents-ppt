import { Storage } from '../core/storage.js';

let _handlers = {};

export function registerShortcut(key, handler) { _handlers[key] = handler; }

export function bindShortcuts() {
    document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key === 'k') {
            e.preventDefault();
            import('./search.js').then(m => m.openSearch());
            return;
        }
        if (e.key === '?') { e.preventDefault(); showHelp(); return; }
        if (e.key === 't' || e.key === 'T') {
            e.preventDefault();
            import('./toc-sidebar.js').then(m => m.toggleToc());
            return;
        }
        if (e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            const cur = Storage.getTheme();
            Storage.setTheme(cur === 'light' ? 'dark' : 'light');
            return;
        }
        if (_handlers[e.key]) { e.preventDefault(); _handlers[e.key](); }
    });
}

function showHelp() {
    let help = document.querySelector('.help-modal');
    if (help) { help.remove(); return; }
    help = document.createElement('div');
    help.className = 'help-modal';
    help.innerHTML = `
        <div class="help-content">
            <h2>快捷键</h2>
            <table>
                <tr><td><kbd>Ctrl/Cmd</kbd>+<kbd>K</kbd></td><td>搜索</td></tr>
                <tr><td><kbd>T</kbd></td><td>章节目录</td></tr>
                <tr><td><kbd>D</kbd></td><td>暗色模式</td></tr>
                <tr><td><kbd>←/→</kbd></td><td>翻页</td></tr>
                <tr><td><kbd>Home/End</kbd></td><td>首页/末页</td></tr>
                <tr><td><kbd>P</kbd></td><td>演讲者模式</td></tr>
                <tr><td><kbd>Esc</kbd></td><td>关闭弹层</td></tr>
                <tr><td><kbd>?</kbd></td><td>本帮助</td></tr>
            </table>
            <div class="help-hint">按 ? 关闭</div>
        </div>`;
    help.addEventListener('click', (e) => { if (e.target === help) help.remove(); });
    document.body.appendChild(help);
}
