export function toRecurringBaseId(eventId) {
  if (!eventId || typeof eventId !== 'string') return '';

  const trimmedEventId = eventId.trim();
  if (!trimmedEventId) return '';

  const markerIndex = trimmedEventId.indexOf('_R');
  return markerIndex > -1 ? trimmedEventId.slice(0, markerIndex) : trimmedEventId;
}

export function normalizeMeetingGoogleLinkFields(input = {}) {
  const normalizedEventId = typeof input.gcalEventId === 'string'
    ? input.gcalEventId.trim()
    : '';
  const normalizedRecurringEventId = typeof input.gcalRecurringEventId === 'string'
    ? input.gcalRecurringEventId.trim()
    : '';

  const preferredSeriesId = toRecurringBaseId(normalizedRecurringEventId || normalizedEventId);
  if (!preferredSeriesId) {
    return {
      ...input,
      gcalEventId: normalizedEventId || null,
      gcalRecurringEventId: normalizedRecurringEventId || null,
    };
  }

  const cameFromRecurringInstance = preferredSeriesId !== normalizedEventId;
  const shouldStoreRecurringId = Boolean(normalizedRecurringEventId) || cameFromRecurringInstance;

  return {
    ...input,
    gcalEventId: preferredSeriesId,
    gcalRecurringEventId: shouldStoreRecurringId ? preferredSeriesId : null,
  };
}