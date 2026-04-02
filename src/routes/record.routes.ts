import { Router } from 'express';
import { recordController } from '../controllers/record.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createRecordSchema,
  updateRecordSchema,
  recordIdParamSchema,
  listRecordsQuerySchema,
} from '../validators/record.validator';

/**
 * Financial record routes.
 * 
 * Access control:
 * - Viewing: Analyst and Admin
 * - Creating/Updating/Deleting: Admin only
 * - Viewers cannot access records directly (they use dashboard summaries)
 */

const router = Router();

// All record routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/records:
 *   get:
 *     tags: [Financial Records]
 *     summary: List financial records
 *     description: Analyst and Admin only. Returns paginated records with filtering and sorting.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, category, createdAt]
 *           default: date
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Records retrieved successfully
 */
router.get(
  '/',
  authorize('ADMIN', 'ANALYST'),
  validate({ query: listRecordsQuerySchema }),
  recordController.getRecords
);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   get:
 *     tags: [Financial Records]
 *     summary: Get record by ID
 *     description: Analyst and Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record retrieved successfully
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  authorize('ADMIN', 'ANALYST'),
  validate({ params: recordIdParamSchema }),
  recordController.getRecordById
);

/**
 * @swagger
 * /api/v1/records:
 *   post:
 *     tags: [Financial Records]
 *     summary: Create a financial record
 *     description: Admin only.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000.00
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 example: Salary
 *               description:
 *                 type: string
 *                 example: Monthly salary payment
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  authorize('ADMIN'),
  validate({ body: createRecordSchema }),
  recordController.createRecord
);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   patch:
 *     tags: [Financial Records]
 *     summary: Update a financial record
 *     description: Admin only. Partial update supported.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Record updated successfully
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate({ params: recordIdParamSchema, body: updateRecordSchema }),
  recordController.updateRecord
);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   delete:
 *     tags: [Financial Records]
 *     summary: Delete a financial record (soft delete)
 *     description: Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate({ params: recordIdParamSchema }),
  recordController.deleteRecord
);

export default router;
