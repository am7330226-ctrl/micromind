// background.js — Service worker for MicroMind Extension

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-to-micromind',
    title: '🧠 Add "%s" to MicroMind Inbox',
    contexts: ['selection'],
  });

  // Enable side panel to open on action click if configured
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-to-micromind' && info.selectionText) {
    const text = info.selectionText.trim();
    if (!text) return;

    // Load existing tasks from chrome.storage.local
    chrome.storage.local.get(['micromind_tasks'], (result) => {
      const tasks = result.micromind_tasks || [];
      const newTask = {
        id: Math.random().toString(36).slice(2, 10),
        text,
        completed: false,
        category: 'inbox',
        createdAt: Date.now(),
      };

      chrome.storage.local.set({ micromind_tasks: [newTask, ...tasks] }, () => {
        // Show notification if permitted
        chrome.action.setBadgeText({ text: 'NEW' });
        chrome.action.setBadgeBackgroundColor({ color: '#a855f7' });
        setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
      });
    });
  }
});
