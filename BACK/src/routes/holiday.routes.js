import { Router } from 'express';
import { getHolidays, addHoliday, deleteHoliday } from '../controllers/holiday.controller.js';
import { isAuthenticated, checkRole } from '../middlewares/auth.middleware.js';

const holidayRouter = Router();

holidayRouter.get('/', isAuthenticated, checkRole(['admin']), getHolidays);
holidayRouter.post('/', isAuthenticated, checkRole(['admin']), addHoliday);
holidayRouter.delete('/:hid', isAuthenticated, checkRole(['admin']), deleteHoliday);

export default holidayRouter;