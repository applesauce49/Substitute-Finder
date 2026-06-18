import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeMeetingGoogleLinkFields,
  toRecurringBaseId,
} from '../utils/googleEventIds.js';

test('toRecurringBaseId strips recurring instance suffixes', () => {
  assert.equal(toRecurringBaseId('abc123_R20260621T150000'), 'abc123');
  assert.equal(toRecurringBaseId('abc123'), 'abc123');
  assert.equal(toRecurringBaseId(''), '');
});

test('normalizeMeetingGoogleLinkFields collapses recurring instances to one series id', () => {
  const normalized = normalizeMeetingGoogleLinkFields({
    summary: 'Solo Parents Support Meeting',
    gcalEventId: '05mkkl0ul3t9lfuk623rvu14vs_R20260621T150000',
  });

  assert.deepEqual(normalized, {
    summary: 'Solo Parents Support Meeting',
    gcalEventId: '05mkkl0ul3t9lfuk623rvu14vs',
    gcalRecurringEventId: '05mkkl0ul3t9lfuk623rvu14vs',
  });
});

test('normalizeMeetingGoogleLinkFields preserves parent ids without inventing recurring metadata', () => {
  const normalized = normalizeMeetingGoogleLinkFields({
    summary: 'Moms Gratitude Connection',
    gcalEventId: 'hrd2tivkukp5q2vt9p5pa8607s',
    gcalRecurringEventId: '',
  });

  assert.deepEqual(normalized, {
    summary: 'Moms Gratitude Connection',
    gcalEventId: 'hrd2tivkukp5q2vt9p5pa8607s',
    gcalRecurringEventId: null,
  });
});