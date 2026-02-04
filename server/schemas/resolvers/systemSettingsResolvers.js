import SystemSettings, { DEFAULT_SYSTEM_SETTINGS } from '../../models/SystemSettings.js';

export default {
  Query: {
    systemSettings: async () => {
      return await SystemSettings.find({}).sort({ category: 1, label: 1 });
    },

    systemSetting: async (_, { key }) => {
      return await SystemSettings.findOne({ key });
    },
  },

  Mutation: {
    updateSystemSetting: async (_, { key, value }) => {
      const setting = await SystemSettings.findOne({ key });
      
      if (!setting) {
        throw new Error(`System setting '${key}' not found`);
      }

      // Convert value based on type
      let convertedValue = value;
      switch (setting.type) {
        case 'number':
          convertedValue = Number(value);
          if (isNaN(convertedValue)) {
            throw new Error(`Invalid number value for setting '${key}'`);
          }
          break;
        case 'boolean':
          convertedValue = value === 'true' || value === true;
          break;
        case 'object':
          try {
            convertedValue = JSON.parse(value);
          } catch (err) {
            throw new Error(`Invalid JSON value for setting '${key}'`);
          }
          break;
        // 'string' type needs no conversion
      }

      setting.value = convertedValue;
      setting.updatedAt = new Date();
      
      await setting.save();
      
      return {
        ...setting.toObject(),
        value: String(setting.value), // GraphQL expects string
      };
    },

    initializeSystemSettings: async () => {
      const existingSettings = await SystemSettings.find({});
      const existingKeys = existingSettings.map(s => s.key);
      
      const settingsToCreate = DEFAULT_SYSTEM_SETTINGS.filter(
        defaultSetting => !existingKeys.includes(defaultSetting.key)
      );

      if (settingsToCreate.length > 0) {
        await SystemSettings.insertMany(settingsToCreate);
      }

      return await SystemSettings.find({}).sort({ category: 1, label: 1 });
    },
  },
};