import SystemSettings from '../models/SystemSettings.js';

// Cache for system settings to avoid frequent DB queries
const settingsCache = new Map();
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get a system setting value by key
 * @param {string} key - The setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {Promise<any>} The setting value
 */
export async function getSystemSetting(key, defaultValue = null) {
  const now = Date.now();
  
  // Check if cache is still valid
  if (now > cacheExpiry) {
    settingsCache.clear();
    cacheExpiry = now + CACHE_DURATION;
  }

  // Check cache first
  if (settingsCache.has(key)) {
    return settingsCache.get(key);
  }

  try {
    console.log(`🔍 Looking for system setting: ${key}`);
    const setting = await SystemSettings.findOne({ key });
    console.log(`🔍 Found setting:`, setting ? `${key}=${setting.value} (type: ${typeof setting.value})` : 'null');
    const value = setting?.value ?? defaultValue;
    console.log(`🔍 Using value: ${value} (fallback: ${defaultValue})`);
    
    // Cache the result
    settingsCache.set(key, value);
    
    return value;
  } catch (error) {
    console.error(`Error fetching system setting '${key}':`, error);
    return defaultValue;
  }
}

/**
 * Get the default workload balance window in days
 * @returns {Promise<number>} Default workload balance window days
 */
export async function getDefaultWorkloadBalanceWindowDays() {
  console.log('🔍 Getting default workload balance window days...');
  const value = await getSystemSetting('defaultWorkloadBalanceWindowDays', 7);
  console.log(`🔍 Default workload balance window: ${value} days (type: ${typeof value})`);
  return value;
}

/**
 * Get the maximum number of days in the future to process jobs
 * @returns {Promise<number>} Maximum future job days
 */
export async function getMaxFutureJobDays() {
  console.log('🔍 Getting max future job days...');
  const value = await getSystemSetting('maxFutureJobDays', 90);
  console.log(`🔍 Max future job days: ${value} days (type: ${typeof value})`);
  return value;
}

/**
 * Clear the settings cache (useful for testing or after updates)
 */
export function clearSystemSettingsCache() {
  settingsCache.clear();
  cacheExpiry = 0;
}