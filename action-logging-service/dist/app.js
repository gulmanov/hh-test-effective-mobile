"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const ActionLog_1 = require("./entity/ActionLog");
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.get('/', (req, res) => {
    res.send('Action Logging Service');
});
// Endpoint to create a log entry
app.post('/log', async (req, res) => {
    const { shop_id, plu, action } = req.body;
    try {
        const actionLog = new ActionLog_1.ActionLog();
        actionLog.shop_id = shop_id;
        actionLog.plu = plu;
        actionLog.action = action;
        actionLog.date = new Date();
        const logRepo = data_source_1.AppDataSource.getRepository(ActionLog_1.ActionLog);
        await logRepo.save(actionLog);
        res.status(201).send('Action logged successfully');
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error logging action');
    }
});
// Endpoint to retrieve logs with filters
app.get('/logs', async (req, res) => {
    const { shop_id, plu, action, date_start, date_end } = req.query;
    const logRepo = data_source_1.AppDataSource.getRepository(ActionLog_1.ActionLog);
    let query = logRepo.createQueryBuilder('log');
    // Use an OR condition to allow any filter to work individually
    let conditions = [];
    let parameters = {};
    if (shop_id) {
        conditions.push('log.shop_id = :shop_id');
        parameters.shop_id = shop_id;
    }
    if (plu) {
        conditions.push('log.plu = :plu');
        parameters.plu = plu;
    }
    if (action) {
        conditions.push('log.action = :action');
        parameters.action = action;
    }
    if (date_start && date_end) {
        conditions.push('log.date BETWEEN :date_start AND :date_end');
        parameters.date_start = date_start;
        parameters.date_end = date_end;
    }
    // Add conditions to the query only if there are any filters provided
    if (conditions.length > 0) {
        query.where(conditions.join(' OR '), parameters);
    }
    try {
        const logs = await query.getMany();
        res.status(200).json(logs);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving logs');
    }
});
