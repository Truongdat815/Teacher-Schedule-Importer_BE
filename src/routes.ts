import { Router } from 'express';
import { getHealth } from './controllers/healthController';
import { validate } from './middleware/validation';
import {
  createEventSchema,
  updateEventSchema,
  getEventsQuerySchema,
  getEventByIdParamsSchema,
  eventIdParamsSchema,
  getEventsByStatusQuerySchema,
} from './validations/eventValidation';
import { googleCallbackQuerySchema } from './validations/authValidation';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: API is healthy
 */
router.get('/health', getHealth);

// Auth Routes
import * as authController from './controllers/authController';

/**
 * @swagger
 * /api/auth/google/url:
 *   get:
 *     summary: Get Google OAuth 2.0 Auth URL
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Auth URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 */
router.get('/auth/google/url', authController.getAuthUrl);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 2.0 Callback
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The authorization code returned by Google
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.get(
  '/auth/google/callback',
  validate({ query: googleCallbackQuerySchema }),
  authController.googleCallback
);

// Event Routes
import * as eventController from './controllers/eventController';

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create or update event mapping (idempotent)
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - sheetId
 *               - tabName
 *               - title
 *               - startTime
 *               - endTime
 *             properties:
 *               userId:
 *                 type: string
 *               sheetId:
 *                 type: string
 *               tabName:
 *                 type: string
 *               rowNumber:
 *                 type: number
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     role:
 *                       type: string
 *     responses:
 *       200:
 *         description: Event created/updated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post(
  '/events',
  validate({ body: createEventSchema }),
  eventController.createOrUpdateEvent
);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events for a user
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/events',
  validate({ query: getEventsQuerySchema }),
  eventController.getUserEvents
);

/**
 * @swagger
 * /api/events/status:
 *   get:
 *     summary: Get events by sync status
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed]
 *         required: true
 *         description: Sync status
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       400:
 *         description: Invalid status
 *       500:
 *         description: Server error
 */
router.get(
  '/events/status',
  validate({ query: getEventsByStatusQuerySchema }),
  eventController.getEventsBySyncStatus
);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get(
  '/events/:id',
  validate({ params: getEventByIdParamsSchema }),
  eventController.getEventById
);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event mapping
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               googleEventId:
 *                 type: string
 *               syncStatus:
 *                 type: string
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.put(
  '/events/:id',
  validate({ params: eventIdParamsSchema, body: updateEventSchema }),
  eventController.updateEvent
);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event mapping
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/events/:id',
  validate({ params: eventIdParamsSchema }),
  eventController.deleteEvent
);

export default router;
