import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimestamp,
  parseTimestampToSeconds,
  extractTimestampsFromText,
  formatFileSize,
  filterEvents,
  calculateSystemStats
} from './videoUtils';
import { VideoEvent, VideoRecord, VideoAnalysis } from '../types';

test('formatTimestamp formats seconds correctly into mm:ss and hh:mm:ss', () => {
  assert.equal(formatTimestamp(0), '00:00');
  assert.equal(formatTimestamp(31), '00:31');
  assert.equal(formatTimestamp(75), '01:15');
  assert.equal(formatTimestamp(3665), '01:01:05');
  assert.equal(formatTimestamp(-10), '00:00');
});

test('parseTimestampToSeconds parses mm:ss and hh:mm:ss strings to seconds', () => {
  assert.equal(parseTimestampToSeconds('00:31'), 31);
  assert.equal(parseTimestampToSeconds('01:15'), 75);
  assert.equal(parseTimestampToSeconds('01:01:05'), 3665);
  assert.equal(parseTimestampToSeconds('[00:45]'), 45);
  assert.equal(parseTimestampToSeconds('(02:10)'), 130);
  assert.equal(parseTimestampToSeconds('invalid'), 0);
});

test('extractTimestampsFromText extracts and parses multiple timestamps in text', () => {
  const text = 'The person started running at 00:31 and dropped the object around 01:12 before exiting at 01:45.';
  const extracted = extractTimestampsFromText(text);
  assert.deepEqual(extracted, [31, 72, 105]);
});

test('formatFileSize formats byte numbers into human readable units', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(1048576 * 5.5), '5.5 MB');
});

test('filterEvents filters by category and search query correctly', () => {
  const events: VideoEvent[] = [
    {
      id: 'e1',
      timestamp: 45,
      startTime: 40,
      endTime: 50,
      category: 'Movement',
      event: 'Person running',
      description: 'Person starts to run fast',
      confidence: 0.95,
      severity: 'Low'
    },
    {
      id: 'e2',
      timestamp: 10,
      startTime: 8,
      endTime: 15,
      category: 'People',
      event: 'Person entry',
      description: 'Visitor enters through front door',
      confidence: 0.99,
      severity: 'Low'
    },
    {
      id: 'e3',
      timestamp: 75,
      startTime: 70,
      endTime: 80,
      category: 'Important Events',
      event: 'Object dropped',
      description: 'Black backpack dropped near bench',
      confidence: 0.88,
      severity: 'Medium'
    }
  ];

  const sortedAndFiltered = filterEvents(events, 'All', '');
  assert.equal(sortedAndFiltered.length, 3);
  assert.equal(sortedAndFiltered[0].id, 'e2'); // sorted chronologically: 10s < 45s < 75s

  const categoryFiltered = filterEvents(events, 'Movement', '');
  assert.equal(categoryFiltered.length, 1);
  assert.equal(categoryFiltered[0].id, 'e1');

  const searchFiltered = filterEvents(events, 'All', 'backpack');
  assert.equal(searchFiltered.length, 1);
  assert.equal(searchFiltered[0].id, 'e3');
});

test('calculateSystemStats aggregates videos and analyses accurately', () => {
  const mockVideos: VideoRecord[] = [
    {
      id: 'v1',
      fileName: 'cctv_hallway.mp4',
      fileUrl: '/uploads/v1.mp4',
      fileSize: 5000000,
      mimeType: 'video/mp4',
      duration: 120,
      uploadDate: new Date().toISOString(),
      status: 'completed',
      eventCount: 4
    },
    {
      id: 'v2',
      fileName: 'parking_lot.mp4',
      fileUrl: '/uploads/v2.mp4',
      fileSize: 3000000,
      mimeType: 'video/mp4',
      duration: 60,
      uploadDate: new Date().toISOString(),
      status: 'uploaded',
      eventCount: 0
    }
  ];

  const mockAnalyses: VideoAnalysis[] = [
    {
      id: 'a1',
      videoId: 'v1',
      summary: 'Test summary',
      mainActivities: ['walking', 'running'],
      people: [],
      objects: [],
      events: [
        {
          id: 'ev1',
          timestamp: 12,
          startTime: 10,
          endTime: 15,
          category: 'Movement',
          event: 'Walking',
          description: 'Walking',
          confidence: 0.9,
          severity: 'Low'
        }
      ],
      sceneChanges: [],
      keyObservations: [],
      analysisDurationMs: 4200,
      createdAt: new Date().toISOString(),
      modelUsed: 'gemini-3.8-flash'
    }
  ];

  const stats = calculateSystemStats(mockVideos, mockAnalyses);
  assert.equal(stats.totalVideos, 2);
  assert.equal(stats.videosAnalysed, 1);
  assert.equal(stats.totalEvents, 1);
  assert.equal(stats.totalAnalysisTimeSec, 4);
});
