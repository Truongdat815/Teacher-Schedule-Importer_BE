import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import * as authService from '../services/authService';
import { BadRequestError } from '../utils/errors';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (req: Request, res: Response) => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets.readonly', // If reading from sheets
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial for receiving refresh token
        scope: scopes,
        prompt: 'consent', // Force consent to ensure refresh token is returned
    });

    res.json({ 
        success: true,
        url 
    });
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code as string);
        oauth2Client.setCredentials(tokens);

        // Get basic user info
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            throw new BadRequestError('Email not found in Google profile');
        }

        // Save to DB
        const user = await authService.findOrCreateUser(
            userInfo.data.email,
            userInfo.data.name || 'Unknown',
            userInfo.data.picture || ''
        );

        await authService.updateGoogleCredential(user.id, userInfo.data, tokens);

        // Return success (In a real app, you might issue your own JWT here)
        res.json({
            success: true,
            message: 'Authentication successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            tokens: tokens // Be careful returning tokens to client, usually prefer a session/JWT
        });

    } catch (error) {
        next(error);
    }
};
