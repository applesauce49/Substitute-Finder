// Keys = schema "shape"
// Values = default values (useful for resetting or validating)
export const RECURRENCE_SCHEMA = {
  frequency: null,      // "WEEKLY"
  daysOfWeek: null,     // ["MO", "WE"]
  startTime: null,      // "19:00"
  endTime: null,        // "20:00"
  until: null,          // Date or null
  timezone: null,     // "America/New_York"
};
