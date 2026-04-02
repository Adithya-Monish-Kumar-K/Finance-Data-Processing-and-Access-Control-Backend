import { Request, Response, NextFunction } from 'express';
import { recordService } from '../services/record.service';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../utils/response';

/**
 * Financial records controller.
 */

export class RecordController {
  async getRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { records, pagination } = await recordService.getRecords(
        req.query as Record<string, string>
      );
      sendPaginatedSuccess(res, records, pagination, 'Records retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await recordService.getRecordById(req.params.id as string);
      sendSuccess(res, record, 'Record retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await recordService.createRecord(req.body, req.user!.id);
      sendCreated(res, record, 'Financial record created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await recordService.updateRecord(req.params.id as string, req.body);
      sendSuccess(res, record, 'Record updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req: Request, res: Response, next: NextFunction) {
    try {
      await recordService.deleteRecord(req.params.id as string);
      sendSuccess(res, null, 'Record deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const recordController = new RecordController();
