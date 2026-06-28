import { Request, Response } from 'express';

export const dummyAction = (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'OK' });
};
