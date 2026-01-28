import { Router } from 'express';
import { getHealth } from './controllers/healthController';
import { validate } from './middleware/validation';
import { authenticate } from './middleware/auth';
import { authorizeEventAccess, authorizeEventsByStatus } from './middleware/authorize';
import { authLimiter, eventCreationLimiter } from './middleware/rateLimit';
import {
  createEventSchema,
  updateEventSchema,
  getEventsQuerySchema,
  getEventByIdParamsSchema,
  eventIdParamsSchema,
  getEventsByStatusQuerySchema,
} from './validations/eventValidation';
import { googleCallbackQuerySchema, refreshTokenSchema } from './validations/authValidation';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check | Kiểm tra sức khỏe hệ thống
 *     description: Returns the health status of the API | Trả về trạng thái hoạt động của API, dùng để kiểm tra xem server có đang chạy bình thường không
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
 *     summary: Get Google OAuth 2.0 Auth URL | Lấy đường dẫn xác thực Google
 *     description: Generates Google OAuth URL for user authentication | Tạo đường dẫn để người dùng đăng nhập bằng tài khoản Google và cấp quyền truy cập Google Calendar
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
router.get('/auth/google/url', authLimiter, authController.getAuthUrl);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 2.0 Callback | Xử lý callback từ Google
 *     description: Handles Google OAuth callback and exchanges code for tokens | Nhận mã xác thực từ Google sau khi người dùng đăng nhập, đổi mã lấy token để truy cập API
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
  authLimiter,
  validate({ query: googleCallbackQuerySchema }),
  authController.googleCallback
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token | Làm mới token truy cập
 *     description: Refreshes expired access token using refresh token | Dùng refresh token để lấy access token mới khi token cũ hết hạn, giúp duy trì phiên đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/auth/refresh',
  authLimiter,
  validate({ body: refreshTokenSchema }),
  authController.refreshToken
);

// Event Routes
import * as eventController from './controllers/eventController';

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create or update event mapping (idempotent) | Tạo hoặc cập nhật sự kiện
 *     description: Creates or updates event mapping from Google Sheets to Calendar | Tạo hoặc cập nhật thông tin ánh xạ sự kiện từ Google Sheets sang Google Calendar, hỗ trợ đồng bộ lịch giảng dạy
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sheetId
 *               - tabName
 *               - title
 *               - startTime
 *               - endTime
 *             properties:
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
 *       401:
 *         description: Unauthorized - Token required
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post(
  '/events',
  authenticate,
  eventCreationLimiter,
  validate({ body: createEventSchema }),
  eventController.createOrUpdateEvent
);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events for authenticated user | Lấy tất cả sự kiện của người dùng
 *     description: Retrieves all event mappings for the authenticated user | Lấy danh sách tất cả các sự kiện đã tạo của người dùng hiện tại
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 *       500:
 *         description: Server error
 */
router.get(
  '/events',
  authenticate,
  validate({ query: getEventsQuerySchema }),
  eventController.getUserEvents
);

/**
 * @swagger
 * /api/events/status:
 *   get:
 *     summary: Get events by sync status for authenticated user | Lấy sự kiện theo trạng thái đồng bộ
 *     description: Retrieves events filtered by sync status (pending/success/failed) | Lấy danh sách sự kiện theo trạng thái đồng bộ (đang chờ/thành công/thất bại) để theo dõi quá trình import
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized - Token required
 *       400:
 *         description: Invalid status
 *       500:
 *         description: Server error
 */
router.get(
  '/events/status',
  authenticate,
  authorizeEventsByStatus,
  validate({ query: getEventsByStatusQuerySchema }),
  eventController.getEventsBySyncStatus
);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID | Lấy chi tiết sự kiện theo ID
 *     description: Retrieves a specific event by its ID | Lấy thông tin chi tiết của một sự kiện cụ thể dựa trên ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - You don't own this event
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get(
  '/events/:id',
  authenticate,
  authorizeEventAccess,
  validate({ params: getEventByIdParamsSchema }),
  eventController.getEventById
);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event mapping | Cập nhật thông tin sự kiện
 *     description: Updates an existing event mapping | Cập nhật thông tin của một sự kiện đã tồn tại (thời gian, tiêu đề, trạng thái đồng bộ, v.v.)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - You don't own this event
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.put(
  '/events/:id',
  authenticate,
  authorizeEventAccess,
  validate({ params: eventIdParamsSchema, body: updateEventSchema }),
  eventController.updateEvent
);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event mapping | Xóa sự kiện
 *     description: Deletes an event mapping from the database | Xóa một sự kiện khỏi cơ sở dữ liệu, hủy ánh xạ giữa Google Sheets và Calendar
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - You don't own this event
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/events/:id',
  authenticate,
  authorizeEventAccess,
  validate({ params: eventIdParamsSchema }),
  eventController.deleteEvent
);

export default router;
