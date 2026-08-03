/**
 * parseRichText.js — Converts task text with markdown and hashtags into HTML.
 * Bold (**text**), italic (*text*), links ([text](url)), and #tags.
 */

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[tag] || tag,
  );
}

export function parseRichText(text) {
  let s = escapeHTML(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
    const trimmed = url.trim();
    // Block dangerous URI schemes to prevent XSS
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
      return `<span class="task-tag" title="Blocked unsafe link">${linkText}</span>`;
    }
    const clean = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });
  s = s.replace(
    /(^|\s)#([\w-]+)/g,
    (_, prefix, tag) =>
      `${prefix}<span class="task-tag" data-tag="${tag.toLowerCase()}">#${tag}</span>`,
  );
  return s;
}
