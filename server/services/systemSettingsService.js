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
    const setting = await SystemSettings.findOne({ key });
    const value = setting?.value ?? defaultValue;
    
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
  return await getSystemSetting('defaultWorkloadBalanceWindowDays', 7);
}

/**
 * Clear the settings cache (useful for testing or after updates)
 */
export function clearSystemSettingsCache() {
  settingsCache.clear();
  cacheExpiry = 0;
}