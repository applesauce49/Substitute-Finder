import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_SYSTEM_SETTINGS } from "../../../utils/graphql/systemSettings/queries";
import { UPDATE_SYSTEM_SETTING, INITIALIZE_SYSTEM_SETTINGS } from "../../../utils/graphql/systemSettings/mutations";

export function SystemSettings() {
  const { data, loading, error, refetch } = useQuery(QUERY_SYSTEM_SETTINGS);
  const [updateSetting] = useMutation(UPDATE_SYSTEM_SETTING, {
    onCompleted: () => refetch(),
  });
  const [initializeSettings] = useMutation(INITIALIZE_SYSTEM_SETTINGS, {
    onCompleted: () => refetch(),
  });

  const [editingSettings, setEditingSettings] = React.useState({});

  const settings = data?.systemSettings || [];

  React.useEffect(() => {
    // Initialize system settings if empty
    if (!loading && !error && settings.length === 0) {
      initializeSettings();
    }
  }, [loading, error, settings.length, initializeSettings]);

  const handleUpdateSetting = React.useCallback(async (key, value) => {
    try {
      await updateSetting({
        variables: { key, value: String(value) }
      });
      setEditingSettings(prev => ({ ...prev, [key]: false }));
    } catch (err) {
      console.error("Error updating setting:", err);
      alert(`Error updating setting: ${err.message}`);
    }
  }, [updateSetting]);

  const handleEdit = React.useCallback((key) => {
    setEditingSettings(prev => ({ ...prev, [key]: true }));
  }, []);

  const handleCancel = React.useCallback((key) => {
    setEditingSettings(prev => ({ ...prev, [key]: false }));
  }, []);

  if (loading) return <div>Loading system settings...</div>;
  if (error) return <div>Error loading system settings: {error.message}</div>;

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    const category = setting.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">System Settings</h2>
          <small className="text-muted">Configure system-wide default values and behaviors</small>
        </div>
      </div>

      {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
        <div key={category} className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0 text-capitalize">{category} Settings</h5>
          </div>
          <div className="card-body">
            {categorySettings.map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                isEditing={editingSettings[setting.key]}
                onEdit={() => handleEdit(setting.key)}
                onUpdate={handleUpdateSetting}
                onCancel={() => handleCancel(setting.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingRow({ setting, isEditing, onEdit, onUpdate, onCancel }) {
  const [value, setValue] = React.useState(setting.value);

  React.useEffect(() => {
    setValue(setting.value);
  }, [setting.value]);

  const handleSave = () => {
    onUpdate(setting.key, value);
  };

  const renderInput = () => {
    switch (setting.type) {
      case 'number':
        return (
          <input
            type="number"
            className="form-control"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
        );
      case 'boolean':
        return (
          <select
            className="form-select"
            value={String(value)}
            onChange={(e) => setValue(e.target.value === 'true')}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            className="form-control"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
        );
    }
  };

  const formatValue = (val, type) => {
    switch (type) {
      case 'number':
        return `${val} ${setting.key.includes('Days') ? 'days' : ''}`;
      case 'boolean':
        return val ? 'Enabled' : 'Disabled';
      default:
        return String(val);
    }
  };

  return (
    <div className="row align-items-center py-3 border-bottom">
      <div className="col-md-4">
        <div>
          <strong>{setting.label}</strong>
          {setting.description && (
            <div className="text-muted small mt-1">{setting.description}</div>
          )}
        </div>
      </div>
      <div className="col-md-4">
        {isEditing ? (
          renderInput()
        ) : (
          <div className="d-flex align-items-center">
            <span className="badge bg-light text-dark me-2">
              {formatValue(setting.value, setting.type)}
            </span>
            <small className="text-muted">({setting.type})</small>
          </div>
        )}
      </div>
      <div className="col-md-4">
        {isEditing ? (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-success" onClick={handleSave}>
              <i className="bi bi-check"></i> Save
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>
              <i className="bi bi-x"></i> Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-outline-primary btn-sm" onClick={onEdit}>
            <i className="bi bi-pencil"></i> Edit
          </button>
        )}
      </div>
    </div>
  );
}