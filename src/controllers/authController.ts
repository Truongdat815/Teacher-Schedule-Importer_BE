import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import * as authService from '../services/authService';
import { BadRequestError } from '../utils/errors';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import prisma from '../config/prisma';

/**
 * Create OAuth2 client with dynamic callback URL
 */
const getOAuth2Client = () => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const callbackUrl = `${backendUrl}/api/auth/google/callback`;

    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl
    );
};

export const getAuthUrl = (req: Request, res: Response) => {
    const oauth2Client = getOAuth2Client();
    
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: 'security_token',
    });

    // Redirect user directly to Google OAuth
    res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const oauth2Client = getOAuth2Client();
        const code = req.query.code as string;

        if (!code) {
            throw new BadRequestError('Authorization code not found');
        }

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info from Google
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            throw new BadRequestError('Email not found in Google profile');
        }

        if (!userInfo.data.id) {
            throw new BadRequestError('Google ID not found in profile');
        }

        // Save/update user in database
        const user = await authService.findOrCreateUser(
            userInfo.data.email,
            userInfo.data.name || 'Unknown',
            userInfo.data.picture || '',
            userInfo.data.id,
            tokens
        );

        // Generate JWT tokens
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Set secure httpOnly cookies
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Redirect to frontend with success
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(
            `${frontendUrl}/dashboard?success=true&email=${encodeURIComponent(user.email)}`
        );

    } catch (error: any) {
        console.error('OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const errorMessage = error.message || 'Authentication failed';
        res.redirect(
            `${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`
        );
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
