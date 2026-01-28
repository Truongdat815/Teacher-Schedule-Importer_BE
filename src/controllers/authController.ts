import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import * as authService from '../services/authService';
import { BadRequestError } from '../utils/errors';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import prisma from '../config/prisma';

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

        if (!userInfo.data.id) {
            throw new BadRequestError('Google ID not found in profile');
        }

        // Save to DB
        const user = await authService.findOrCreateUser(
            userInfo.data.email,
            userInfo.data.name || 'Unknown',
            userInfo.data.picture || '',
            userInfo.data.id, // Google ID (sub)
            tokens
        );

        // Generate JWT tokens
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Return success with JWT tokens
        res.json({
            success: true,
            message: 'Authentication successful',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken: refreshTokenFromBody } = req.body;

        if (!refreshTokenFromBody) {
            return next(new BadRequestError('Refresh token is required'));
        }

        // Verify refresh token
        const { verifyToken } = require('../utils/jwt');
        let decoded: any;
        try {
            decoded = verifyToken(refreshTokenFromBody);
        } catch (tokenError: any) {
            return next(new BadRequestError('Invalid or expired refresh token'));
        }

        // Check if it's a refresh token (not access token)
        if (!decoded.type || decoded.type !== 'refresh') {
            return next(new BadRequestError('Invalid token type. Refresh token required.'));
        }

        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return next(new BadRequestError('User not found'));
        }

        // Generate new tokens
        const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
        const newAccessToken = generateAccessToken(user.id, user.email);
        const newRefreshToken = generateRefreshToken(user.id, user.email);

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error: any) {
        // Handle unexpected errors
        if (error instanceof BadRequestError) {
            return next(error);
        }
        next(error);
    }
};
