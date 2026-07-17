/**
 * parseRichText.js — Converts task text with markdown and hashtags into HTML.
 * Bold (**text**), italic (*text*), links ([text](url)), and #tags.
 */

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[tag] || tag));
}

export function parseRichText(text) {
  let s = escapeHTML(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
    const clean = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });
  s = s.replace(/(^|\s)#([\w-]+)/g, (_, prefix, tag) =>
    `${prefix}<span class="task-tag" data-tag="${tag.toLowerCase()}">#${tag}</span>`
  );
  return s;
}
