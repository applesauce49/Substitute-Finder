import SystemSettings, { DEFAULT_SYSTEM_SETTINGS } from '../models/SystemSettings.js';

/**
 * Initialize system settings with default values if they don't exist
 */
export async function initializeSystemSettings() {
  try {
    console.log('Initializing system settings...');
    
    const existingSettings = await SystemSettings.find({});
    const existingKeys = existingSettings.map(s => s.key);
    
    const settingsToCreate = DEFAULT_SYSTEM_SETTINGS.filter(
      defaultSetting => !existingKeys.includes(defaultSetting.key)
    );

    if (settingsToCreate.length > 0) {
      await SystemSettings.insertMany(settingsToCreate);
      console.log(`✅ Created ${settingsToCreate.length} system settings:`, 
        settingsToCreate.map(s => `${s.key}=${s.value}`).join(', ')
      );
    } else {
      console.log('✅ System settings already initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing system settings:', error);
  }
}