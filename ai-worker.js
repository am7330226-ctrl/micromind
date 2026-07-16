/**
 * ai-worker.js — MicroMind Local AI Worker
 * Runs entirely in a Web Worker thread so the UI never freezes.
 * Uses Transformers.js with a tiny NLI model for zero-shot classification.
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Configure Transformers.js: use CDN for model files (cached by browser/SW)
env.allowLocalModels = false;
env.useBrowserCache = true;

// The four Eisenhower quadrant labels we classify against
const LABELS = [
    'urgent and important task',
    'important but not urgent task',
    'urgent but not important task',
    'not urgent and not important task'
];

// Label → category mapping (must match the app's internal category names: q1, q2, q3, q4)
const LABEL_TO_CATEGORY = {
    'urgent and important task':         'q1',
    'important but not urgent task':     'q2',
    'urgent but not important task':     'q3',
    'not urgent and not important task': 'q4',
};

let classifier = null;
let isLoading = false;

/**
 * Load the model pipeline. Posts progress messages back to main thread.
 */
async function loadModel() {
    if (classifier || isLoading) return;
    isLoading = true;

    self.postMessage({ type: 'status', status: 'loading' });

    try {
        classifier = await pipeline(
            'zero-shot-classification',
            'Xenova/nli-deberta-v3-small',
            {
                progress_callback: (progressInfo) => {
                    if (progressInfo.status === 'progress') {
                        self.postMessage({
                            type: 'progress',
                            file: progressInfo.file,
                            progress: progressInfo.progress
                        });
                    }
                }
            }
        );
        self.postMessage({ type: 'status', status: 'ready' });
    } catch (err) {
        self.postMessage({ type: 'status', status: 'error', error: err.message });
    } finally {
        isLoading = false;
    }
}

/**
 * Classify a task text and post the result back.
 */
async function classifyTask(taskId, text) {
    if (!classifier) {
        self.postMessage({ type: 'result', taskId, error: 'Model not loaded' });
        return;
    }

    try {
        const result = await classifier(text, LABELS, {
            multi_label: false
        });

        // result.labels[0] is the top-scoring label
        const topLabel = result.labels[0];
        const topScore = result.scores[0];
        const category = LABEL_TO_CATEGORY[topLabel];

        self.postMessage({
            type: 'result',
            taskId,
            label: topLabel,
            score: topScore,
            category
        });
    } catch (err) {
        self.postMessage({ type: 'result', taskId, error: err.message });
    }
}

// Handle messages from the main thread
self.addEventListener('message', async (event) => {
    const { type, taskId, text } = event.data;
    if (type === 'load') {
        await loadModel();
    } else if (type === 'classify') {
        await classifyTask(taskId, text);
    }
});
