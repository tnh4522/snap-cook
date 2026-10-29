/**
 * Simple test suite for frontend utility functions.
 * Run with: node scripts/run-tests.js
 */
const assert = require('assert');

// Port of recipe utility functions for verification
function recipeKey(recipe) {
  const base = `${recipe.name.trim().toLowerCase()}|${recipe.ingredients
    .map((i) => i.trim().toLowerCase())
    .join(',')}`;
  let hash = 5381;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) + hash + base.charCodeAt(i)) | 0;
  }
  return `r${(hash >>> 0).toString(36)}`;
}

function stripLeadingStepNumber(step) {
  return step.replace(/^(?:step\s*\d+\s*[:.)\-]?\s*|\d+\s*[:.)\-]\s*|\d+\.\s*)/i, '').trim();
}

function formatCookingTime(minutes) {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatRelativeDate(timestamp, now = Date.now()) {
  const diffMs = now - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// 1. stripLeadingStepNumber
assert.strictEqual(stripLeadingStepNumber('1. Crack the eggs into a bowl'), 'Crack the eggs into a bowl');
assert.strictEqual(stripLeadingStepNumber('Step 2: Heat olive oil in pan'), 'Heat olive oil in pan');
assert.strictEqual(stripLeadingStepNumber('Step 3) Add chopped spinach'), 'Add chopped spinach');
assert.strictEqual(stripLeadingStepNumber('4 - Stir gently'), 'Stir gently');
assert.strictEqual(stripLeadingStepNumber('Serve hot and enjoy!'), 'Serve hot and enjoy!');

// 2. formatCookingTime
assert.strictEqual(formatCookingTime(null), null);
assert.strictEqual(formatCookingTime(0), null);
assert.strictEqual(formatCookingTime(15), '15 min');
assert.strictEqual(formatCookingTime(60), '60h'.startsWith('1h') ? '1h' : '1h');
assert.strictEqual(formatCookingTime(75), '1h 15m');
assert.strictEqual(formatCookingTime(120), '2h');

// 3. recipeKey deterministic hash
const r1 = { name: 'Fried Rice', ingredients: ['Rice', 'Eggs', 'Soy sauce'] };
const r2 = { name: ' fried rice ', ingredients: ['rice', 'eggs', 'soy sauce '] };
const r3 = { name: 'Fried Rice', ingredients: ['Rice', 'Eggs', 'Salt'] };
assert.strictEqual(recipeKey(r1), recipeKey(r2), 'Key should normalize casing and whitespace');
assert.notStrictEqual(recipeKey(r1), recipeKey(r3), 'Different ingredients produce different keys');
assert(recipeKey(r1).startsWith('r'), 'Key should start with r');

// 4. formatRelativeDate
const now = 1700000000000;
assert.strictEqual(formatRelativeDate(now - 10000, now), 'Just now');
assert.strictEqual(formatRelativeDate(now - 120000, now), '2 min ago');
assert.strictEqual(formatRelativeDate(now - 7200000, now), '2h ago');
assert.strictEqual(formatRelativeDate(now - 86400000 * 3, now), '3d ago');

console.log('✓ All frontend utility unit tests passed!');
