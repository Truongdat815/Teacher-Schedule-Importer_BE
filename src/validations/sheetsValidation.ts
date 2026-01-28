/**
 * Validation Schemas for Sheets & Calendar Sync
 */

import { z } from 'zod';

/**
 * Input validation for preview endpoint
 * POST /api/sheets/preview
 */
export const sheetsPreviewInputSchema = z.object({
  sheetId: z.string().min(1, 'Sheet ID is required'),
  tabName: z.string().min(1, 'Tab name is required'),
  rowNumber: z.number().int().positive('Row number must be positive'),
  rowData: z.record(z.string(), z.any()), // Raw row data from Google Sheets
});

export type SheetsPreviewInput = z.infer<typeof sheetsPreviewInputSchema>;

/**
 * Input validation for sync endpoint
 * POST /api/calendar/sync
 */
export const calendarSyncInputSchema = z.object({
  sheetId: z.string().min(1, 'Sheet ID is required'),
  tabName: z.string().min(1, 'Tab name is required'),
  rowNumber: z.number().int().positive('Row number must be positive'),
  rowData: z.record(z.string(), z.any()), // Raw row data from Google Sheets
  syncOptions: z
    .object({
      syncAllStages: z.boolean().default(true),
      stagesToSync: z.array(z.enum(['REV1', 'REV2', 'REV3', 'SUPERVISOR', 'DEF1', 'DEF2'])).optional(),
      overwriteExisting: z.boolean().default(false),
    })
    .optional(),
});

export type CalendarSyncInput = z.infer<typeof calendarSyncInputSchema>;

/**
 * Get event by ID validation
 */
export const eventIdParamsSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;

/**
 * Get events by stage validation
 */
export const eventsByStageQuerySchema = z.object({
  stage: z.enum(['REV1', 'REV2', 'REV3', 'SUPERVISOR', 'DEF1', 'DEF2']),
});

export type EventsByStageQuery = z.infer<typeof eventsByStageQuerySchema>;
