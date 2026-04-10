import SystemSettings from '../models/SystemSettings.js';

// Cache for system settings to avoid frequent DB queries
const settingsCache = new Map();
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MATCH_ENGINE_LOCK_KEY = 'matchEngineRunLock';
const DEFAULT_MATCH_ENGINE_LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

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

/**
 * Attempt to acquire a distributed lock for match engine execution.
 * @param {Object} options
 * @param {string} options.owner - Caller identifier for observability.
 * @param {number} options.timeoutMs - Lock expiry in milliseconds.
 * @returns {Promise<{acquired: boolean, runId: string|null, lock: Object|null}>}
 */
export async function acquireMatchEngineRunLock({
  owner = 'unknown',
  timeoutMs = DEFAULT_MATCH_ENGINE_LOCK_TIMEOUT_MS,
} = {}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + timeoutMs);
  const runId = `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`;

  const lockDoc = await SystemSettings.findOneAndUpdate(
    {
      key: MATCH_ENGINE_LOCK_KEY,
      $or: [
        { 'value.locked': { $ne: true } },
        { 'value.expiresAt': { $lte: now } },
      ],
    },
    {
      $set: {
        value: {
          locked: true,
          owner,
          runId,
          lockedAt: now,
          expiresAt,
        },
        updatedAt: now,
      },
      $setOnInsert: {
        key: MATCH_ENGINE_LOCK_KEY,
        type: 'object',
        label: 'Match Engine Run Lock',
        description: 'Distributed lock preventing overlapping match engine executions.',
        category: 'matching',
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  if (!lockDoc || lockDoc?.value?.runId !== runId) {
    const existing = await SystemSettings.findOne({ key: MATCH_ENGINE_LOCK_KEY }).lean();
    return {
      acquired: false,
      runId: null,
      lock: existing?.value || null,
    };
  }

  return {
    acquired: true,
    runId,
    lock: lockDoc.value,
  };
}

/**
 * Release the distributed match engine lock if owned by the provided runId.
 * @param {string} runId - Run identifier returned by acquireMatchEngineRunLock.
 * @returns {Promise<boolean>} true if lock was released, otherwise false.
 */
export async function releaseMatchEngineRunLock(runId) {
  if (!runId) {
    return false;
  }

  const now = new Date();
  const released = await SystemSettings.findOneAndUpdate(
    {
      key: MATCH_ENGINE_LOCK_KEY,
      'value.runId': runId,
      'value.locked': true,
    },
    {
      $set: {
        value: {
          locked: false,
          runId: null,
          owner: null,
          lockedAt: null,
          releasedAt: now,
          expiresAt: now,
        },
        updatedAt: now,
      },
    },
    { new: true }
  );

  return Boolean(released);
}