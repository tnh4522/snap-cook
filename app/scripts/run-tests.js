/**
 * Test suite for frontend utility functions and i18n localization.
 * Run with: node scripts/run-tests.js
 */
const assert = require('assert');

// Port of recipe utility functions and translation logic for verification
const translations = {
  en: {
    tabs: { snapAndCook: 'Snap & Cook', history: 'History', favorites: 'Favorites', settings: 'Settings' },
    common: { cancel: 'Cancel', delete: 'Delete', clear: 'Clear', person: 'person', people: 'people', servings: 'servings' },
    settings: {
      appLanguageTitle: 'App language',
      appLanguageSubtitle: 'Language used for the app interface and recipe generation.',
      themeTitle: 'Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
    },
    time: {
      justNow: 'Just now',
      minAgo: '{count} min ago',
      hoursAgo: '{count}h ago',
      daysAgo: '{count}d ago',
      minutesOnly: '{count} min',
      hoursMinutes: '{hours}h {minutes}m',
      hoursOnly: '{hours}h',
    },
  },
  vi: {
    tabs: { snapAndCook: 'Chụp & Nấu', history: 'Lịch sử', favorites: 'Yêu thích', settings: 'Cài đặt' },
    common: { cancel: 'Hủy', delete: 'Xóa', clear: 'Xóa', person: 'người', people: 'người', servings: 'khẩu phần' },
    settings: {
      appLanguageTitle: 'Ngôn ngữ ứng dụng',
      appLanguageSubtitle: 'Ngôn ngữ hiển thị cho giao diện ứng dụng và gợi ý công thức.',
      themeTitle: 'Giao diện',
      themeLight: 'Sáng',
      themeDark: 'Tối',
      themeSystem: 'Hệ thống',
    },
    time: {
      justNow: 'Vừa xong',
      minAgo: '{count} phút trước',
      hoursAgo: '{count} giờ trước',
      daysAgo: '{count} ngày trước',
      minutesOnly: '{count} phút',
      hoursMinutes: '{hours}h {minutes}p',
      hoursOnly: '{hours}h',
    },
  },
};

function translate(lang, key, params) {
  const langDict = translations[lang] || translations.en;
  const parts = key.split('.');
  let current = langDict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = undefined;
      break;
    }
  }
  if (typeof current !== 'string') return key;
  if (!params) return current;
  return current.replace(/\{(\w+)\}/g, (_, placeholder) => {
    return placeholder in params ? String(params[placeholder]) : `{${placeholder}}`;
  });
}

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

function formatCookingTime(minutes, lang = 'en') {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return translate(lang, 'time.minutesOnly', { count: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m
    ? translate(lang, 'time.hoursMinutes', { hours: h, minutes: m })
    : translate(lang, 'time.hoursOnly', { hours: h });
}

function formatRelativeDate(timestamp, lang = 'en', now = Date.now()) {
  const diffMs = now - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return translate(lang, 'time.justNow');
  if (minutes < 60) return translate(lang, 'time.minAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(lang, 'time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return translate(lang, 'time.daysAgo', { count: days });
  return new Date(timestamp).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
}

// 1. stripLeadingStepNumber
assert.strictEqual(stripLeadingStepNumber('1. Crack the eggs into a bowl'), 'Crack the eggs into a bowl');
assert.strictEqual(stripLeadingStepNumber('Step 2: Heat olive oil in pan'), 'Heat olive oil in pan');
assert.strictEqual(stripLeadingStepNumber('Step 3) Add chopped spinach'), 'Add chopped spinach');
assert.strictEqual(stripLeadingStepNumber('4 - Stir gently'), 'Stir gently');
assert.strictEqual(stripLeadingStepNumber('Serve hot and enjoy!'), 'Serve hot and enjoy!');

// 2. formatCookingTime (en and vi)
assert.strictEqual(formatCookingTime(null), null);
assert.strictEqual(formatCookingTime(0), null);
assert.strictEqual(formatCookingTime(15, 'en'), '15 min');
assert.strictEqual(formatCookingTime(15, 'vi'), '15 phút');
assert.strictEqual(formatCookingTime(60, 'en'), '1h');
assert.strictEqual(formatCookingTime(60, 'vi'), '1h');
assert.strictEqual(formatCookingTime(75, 'en'), '1h 15m');
assert.strictEqual(formatCookingTime(75, 'vi'), '1h 15p');
assert.strictEqual(formatCookingTime(120, 'en'), '2h');
assert.strictEqual(formatCookingTime(120, 'vi'), '2h');

// 3. recipeKey deterministic hash
const r1 = { name: 'Fried Rice', ingredients: ['Rice', 'Eggs', 'Soy sauce'] };
const r2 = { name: ' fried rice ', ingredients: ['rice', 'eggs', 'soy sauce '] };
const r3 = { name: 'Fried Rice', ingredients: ['Rice', 'Eggs', 'Salt'] };
assert.strictEqual(recipeKey(r1), recipeKey(r2), 'Key should normalize casing and whitespace');
assert.notStrictEqual(recipeKey(r1), recipeKey(r3), 'Different ingredients produce different keys');
assert(recipeKey(r1).startsWith('r'), 'Key should start with r');

// 4. formatRelativeDate (en and vi)
const now = 1700000000000;
assert.strictEqual(formatRelativeDate(now - 10000, 'en', now), 'Just now');
assert.strictEqual(formatRelativeDate(now - 10000, 'vi', now), 'Vừa xong');
assert.strictEqual(formatRelativeDate(now - 120000, 'en', now), '2 min ago');
assert.strictEqual(formatRelativeDate(now - 120000, 'vi', now), '2 phút trước');
assert.strictEqual(formatRelativeDate(now - 7200000, 'en', now), '2h ago');
assert.strictEqual(formatRelativeDate(now - 7200000, 'vi', now), '2 giờ trước');
assert.strictEqual(formatRelativeDate(now - 86400000 * 3, 'en', now), '3d ago');
assert.strictEqual(formatRelativeDate(now - 86400000 * 3, 'vi', now), '3 ngày trước');

// 5. App language / translations
assert.strictEqual(translate('en', 'tabs.snapAndCook'), 'Snap & Cook');
assert.strictEqual(translate('vi', 'tabs.snapAndCook'), 'Chụp & Nấu');
assert.strictEqual(translate('vi', 'settings.appLanguageTitle'), 'Ngôn ngữ ứng dụng');
assert.strictEqual(translate('en', 'settings.appLanguageTitle'), 'App language');
assert.strictEqual(translate('vi', 'settings.themeTitle'), 'Giao diện');
assert.strictEqual(translate('en', 'settings.themeLight'), 'Light');
assert.strictEqual(translate('vi', 'settings.themeLight'), 'Sáng');

// 6. Phase 1: Health Metrics (BMI, BMR, TDEE, Calorie Budget) & Food Lens Portion Scaling
function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let category = 'normal';
  if (bmi < 18.5) category = 'underweight';
  else if (bmi < 23.0) category = 'normal';
  else if (bmi < 25.0) category = 'overweight';
  else category = 'obese';
  return { bmi, category };
}

function scaleFoodAnalysis(analysis, multiplier) {
  const m = Math.max(0.25, Math.min(3, multiplier));
  const round1 = (n) => Math.round(n * m * 10) / 10;
  return {
    ...analysis,
    estimated_grams: Math.round(analysis.estimated_grams * m),
    calories: Math.round(analysis.calories * m),
    protein_g: round1(analysis.protein_g),
    carbs_g: round1(analysis.carbs_g),
    fat_g: round1(analysis.fat_g),
  };
}

const bmiRes = calculateBmi(60, 165);
assert.strictEqual(bmiRes.bmi, 22.0);
assert.strictEqual(bmiRes.category, 'normal');

const samplePho = {
  food_name: 'Phở bò tái',
  estimated_grams: 500,
  calories: 480,
  protein_g: 28,
  carbs_g: 60,
  fat_g: 12,
};
const scaledHalf = scaleFoodAnalysis(samplePho, 0.5);
assert.strictEqual(scaledHalf.calories, 240);
assert.strictEqual(scaledHalf.estimated_grams, 250);
assert.strictEqual(scaledHalf.protein_g, 14);

const scaledLarge = scaleFoodAnalysis(samplePho, 1.5);
assert.strictEqual(scaledLarge.calories, 720);
assert.strictEqual(scaledLarge.estimated_grams, 750);

// 7. Phase 3: Workout MET Calorie Calculations
function calculateWorkoutCalories(baseMet, durationMin, weightKg, modifier = 1.0) {
  const effectiveMet = baseMet * modifier;
  const hours = durationMin / 60;
  return Math.round(effectiveMet * weightKg * hours);
}
// Running (MET 9.5), 30 min, 60kg, moderate = 9.5 * 60 * 0.5 = 285 kcal
const runBurn = calculateWorkoutCalories(9.5, 30, 60.0);
assert.strictEqual(runBurn, 285);

// Walking (MET 3.8), 60 min, 70kg, moderate = 3.8 * 70 * 1 = 266 kcal
const walkBurn = calculateWorkoutCalories(3.8, 60, 70.0);
assert.strictEqual(walkBurn, 266);

console.log('✓ All frontend utility, health metrics, and localization unit tests passed!');
