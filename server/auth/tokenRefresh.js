import jwt from 'jsonwebtoken';
import { getUserFromReq } from './middleware.js';

const refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
const refreshMaxAgeSeconds = Number(process.env.JWT_REFRESH_MAX_AGE_SECONDS || 30 * 24 * 60 * 60);

/**
 * Generate a new JWT token for a user
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiration time (default: 1h)
 * @returns {string} JWT token
 */
export function generateToken(user, expiresIn = '1h') {
    const payload = {
        _id: user._id,
        username: user.username,
        email: user.email,
        admin: user.admin
    };
    
    return jwt.sign(
        { data: payload },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn }
    );
}

/**
 * Middleware to handle JWT token refresh
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function refreshToken(req, res) {
    try {
        // Get user from current token (even if expired)
        const user = await getUserFromReq(req);
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid or missing token' 
            });
        }
        
        // Generate new token with configurable extended expiration
        const newToken = generateToken(user, refreshExpiration);
        
        res.json({ 
            token: newToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                admin: user.admin
            }
        });
    } catch (error) {
        console.error('[AUTH] Token refresh failed:', error);
        res.status(401).json({ 
            error: 'Token refresh failed' 
        });
    }
}

/**
 * Enhanced middleware that allows expired tokens for refresh requests
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export async function refreshAuthMiddleware(req, res, next) {
    const authHeader = req.headers?.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    const token = parts[1];
    
    try {
        // Try to decode even expired tokens for refresh
        const decoded = jwt.decode(token, { complete: true });
        
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token format' });
        }
        
        const payload = decoded.payload?.data || decoded.payload;
        
        // Check if token is too old to refresh
        const now = Math.floor(Date.now() / 1000);
        const maxAge = refreshMaxAgeSeconds;
        
        if (decoded.payload.exp && (now - decoded.payload.exp) > maxAge) {
            return res.status(401).json({ error: 'Token too old to refresh' });
        }
        
        // Set user on request for refresh handler
        req.user = payload;
        next();
        
    } catch (error) {
        console.error('[AUTH] Refresh middleware error:', error);
        res.status(401).json({ error: 'Token processing failed' });
    }
}