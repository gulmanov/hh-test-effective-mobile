import express, { Request, Response } from 'express';
import { AppDataSource } from './data-source';
import { ActionLog } from './entity/ActionLog';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', (req: Request, res: Response) => {
  res.send('Action Logging Service');
});



// Endpoint to create a log entry
app.post('/log', async (req: Request, res: Response) => {
  const { shop_id, plu, action } = req.body;
  try {
    const actionLog = new ActionLog();
    actionLog.shop_id = shop_id;
    actionLog.plu = plu;
    actionLog.action = action;
    actionLog.date = new Date();

    const logRepo = AppDataSource.getRepository(ActionLog);
    await logRepo.save(actionLog);

    res.status(201).send('Action logged successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging action');
  }
});



// Endpoint to retrieve logs with filters
app.get('/logs', async (req: Request, res: Response) => {
  const { shop_id, plu, action, date_start, date_end } = req.query;

  const logRepo = AppDataSource.getRepository(ActionLog);
  let query = logRepo.createQueryBuilder('log');

  // Use an OR condition to allow any filter to work individually
  let conditions = [];
  let parameters: any = {};

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
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving logs');
  }
});


export { app };
