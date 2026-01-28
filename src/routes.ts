import { Router } from 'express';
import { getHealth } from './controllers/healthController';
import { validate } from './middleware/validation';
import { authenticate } from './middleware/auth';
import { authLimiter } from './middleware/rateLimit';
import { googleCallbackQuerySchema, refreshTokenSchema } from './validations/authValidation';
import { sheetsPreviewInputSchema, calendarSyncInputSchema } from './validations/sheetsValidation';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check | Kiểm tra sức khỏe hệ thống
 *     description: Returns the health status of the API | Trả về trạng thái hoạt động của API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get('/health', getHealth);

// ============ AUTH ROUTES ============
import * as authController from './controllers/authController';

/**
 * @swagger
 * /api/auth/google/url:
 *   get:
 *     summary: Get Google OAuth 2.0 Auth URL | Lấy đường dẫn xác thực Google
 *     tags: [Auth]
 */
router.get('/auth/google/url', authLimiter, authController.getAuthUrl);

/**
 * @swagger
 * /api/auth/google/token:
 *   post:
 *     summary: Exchange Google authorization code for JWT token (for frontend PKCE flow) | Trao đổi mã ủy quyền Google để lấy JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code from Google
 *     responses:
 *       200:
 *         description: Token exchange successful
 */
router.post('/auth/google/token', authLimiter, authController.exchangeGoogleToken);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 2.0 Callback | Xử lý callback từ Google
 *     tags: [Auth]
 */
router.get(
  '/auth/google/callback',
  authLimiter,
  validate({ query: googleCallbackQuerySchema }),
  authController.googleCallback
);

/**
 * @swagger
 * /api/auth/google/configure:
 *   post:
 *     summary: Configure user's Google OAuth credentials | Cấu hình Google OAuth
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleClientId
 *               - googleClientSecret
 *             properties:
 *               googleClientId:
 *                 type: string
 *               googleClientSecret:
 *                 type: string
 *               googleCallbackUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuration successful
 */
router.post(
  '/auth/google/configure',
  authLimiter,
  authenticate,
  authController.configureGoogleOAuth
);

/**
 * @swagger
 * /api/auth/google/config:
 *   get:
 *     summary: Get user's Google OAuth configuration | Lấy cấu hình Google OAuth
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Configuration retrieved
 */
router.get(
  '/auth/google/config',
  authenticate,
  authController.getGoogleOAuthConfig
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token | Làm mới token truy cập
 *     tags: [Auth]
 */
router.post(
  '/auth/refresh',
  authLimiter,
  validate({ body: refreshTokenSchema }),
  authController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and clear session | Đăng xuất và xóa phiên
 *     description: Clear authentication cookies and end user session | Xóa cookies xác thực và kết thúc phiên người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized - Token required
 */
router.post(
  '/auth/logout',
  authenticate,
  authController.logout
);

// ============ SHEETS & CALENDAR ROUTES ============
import * as sheetsController from './controllers/sheetsController';
import * as calendarController from './controllers/calendarController';

/**
 * @swagger
 * /api/sheets/preview:
 *   post:
 *     summary: Preview parsed capstone project structure | Xem trước cấu trúc được phân tích
 *     description: Parse and preview what will be synced without creating calendar events | Phân tích dữ liệu từ dòng Excel và xem trước sẽ tạo những sự kiện nào trên lịch
 *     tags: [Sheets]
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
 *               - rowNumber
 *               - rowData
 *             properties:
 *               sheetId:
 *                 type: string
 *                 example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
 *               tabName:
 *                 type: string
 *                 example: 'Capstone 2026'
 *               rowNumber:
 *                 type: number
 *                 example: 4
 *               rowData:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Raw row data from Google Sheets (column-wise)
 *     responses:
 *       200:
 *         description: Preview generated successfully
 *       401:
 *         description: Unauthorized - Token required
 *       400:
 *         description: Invalid request
 */
router.post(
  '/sheets/preview',
  authenticate,
  validate({ body: sheetsPreviewInputSchema }),
  sheetsController.previewSheetRow
);

/**
 * @swagger
 * /api/calendar/sync:
 *   post:
 *     summary: Sync capstone project to Google Calendar | Đồng bộ dự án tốt nghiệp sang Google Calendar
 *     description: Parse sheet row, create/update capstone project, and sync all stages to Google Calendar | Phân tích dòng Excel, tạo/cập nhật thông tin dự án tốt nghiệp, và đồng bộ tất cả các giai đoạn (Review 1-3, Defense 1-2) sang Google Calendar
 *     tags: [Calendar]
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
 *               - rowNumber
 *               - rowData
 *             properties:
 *               sheetId:
 *                 type: string
 *               tabName:
 *                 type: string
 *               rowNumber:
 *                 type: number
 *               rowData:
 *                 type: object
 *                 additionalProperties: true
 *               syncOptions:
 *                 type: object
 *                 properties:
 *                   syncAllStages:
 *                     type: boolean
 *                     default: true
 *                   stagesToSync:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [REV1, REV2, REV3, SUPERVISOR, DEF1, DEF2]
 *                   overwriteExisting:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       200:
 *         description: Sheet synced to calendar successfully
 *       401:
 *         description: Unauthorized - Token required
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post(
  '/calendar/sync',
  authenticate,
  validate({ body: calendarSyncInputSchema }),
  calendarController.syncSheetToCalendar
);

/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Get synced calendar events | Lấy danh sách sự kiện đã đồng bộ
 *     description: Retrieve all calendar events synced for current user | Lấy danh sách tất cả các sự kiện lịch đã đồng bộ của người dùng hiện tại
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 */
router.get(
  '/calendar/events',
  authenticate,
  calendarController.getSyncedEvents
);

export default router;
