import { Request, Response } from 'express';
import { google } from 'googleapis';
import * as authService from '../services/authService';

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

    res.json({ url });
};

export const googleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Invalid code provided' });
        return;
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get basic user info
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            res.status(400).json({ error: 'Email not found in Google profile' });
            return;
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
            message: 'Authentication successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            tokens: tokens // Be careful returning tokens to client, usually prefer a session/JWT
        });

    } catch (error) {
        console.error('Error during Google Auth Callback:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
