import { z } from 'zod';

// Event Attribute Schema
export const eventAttributeSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  role: z.string().nullable().optional(),
});

// Create Event Schema (userId is taken from JWT token, not from body)
export const createEventSchema = z.object({
  sheetId: z.string().min(1, 'Sheet ID is required'),
  tabName: z.string().min(1, 'Tab name is required'),
  rowNumber: z.number().int().min(0).optional().default(0),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  startTime: z.string().datetime({ message: 'Invalid start time format. Use ISO 8601 format (e.g., 2025-02-01T08:00:00Z)' }),
  endTime: z.string().datetime({ message: 'Invalid end time format. Use ISO 8601 format (e.g., 2025-02-01T10:00:00Z)' }),
  attributes: z.array(eventAttributeSchema).optional(),
}).refine(
  (data) => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    return endTime > startTime;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Update Event Schema
export const updateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long').optional(),
  startTime: z.string().datetime({ message: 'Invalid start time format. Use ISO 8601 format' }).optional(),
  endTime: z.string().datetime({ message: 'Invalid end time format. Use ISO 8601 format' }).optional(),
  googleEventId: z.string().nullable().optional(),
  syncStatus: z.enum(['pending', 'success', 'failed'], {
    message: 'Sync status must be one of: pending, success, failed',
  }).optional(),
  attributes: z.array(eventAttributeSchema).optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      return endTime > startTime;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Get Events Query Schema (userId is taken from JWT token, not from query)
export const getEventsQuerySchema = z.object({});

// Get Event by ID Params Schema
export const getEventByIdParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});

// Update/Delete Event Params Schema
export const eventIdParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});

// Get Events by Status Query Schema
export const getEventsByStatusQuerySchema = z.object({
  status: z.enum(['pending', 'success', 'failed'], {
    message: 'Status must be one of: pending, success, failed',
  }),
});

// Type exports
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type GetEventsQuery = z.infer<typeof getEventsQuerySchema>;
export type GetEventByIdParams = z.infer<typeof getEventByIdParamsSchema>;
export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
export type GetEventsByStatusQuery = z.infer<typeof getEventsByStatusQuerySchema>;
