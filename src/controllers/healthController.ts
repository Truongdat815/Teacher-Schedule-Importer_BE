import { Request, Response } from 'express';

export const getHealth = (req: Request, res: Response) => {
    res.status(200).json({ 
        success: true,
        status: 'ok', 
        message: 'API is healthy' 
    });
};
