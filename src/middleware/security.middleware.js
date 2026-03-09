import aj from '#config/arcjet.js'
    
const securityMiddleware = async (req, res, next) => {
    try {
        const role = req.user?.role || 'guest';
        
        let limit;
        let message;
        switch (role) {
            case 'admin':
                limit=20
                message = 'Admin request limit exceeded (20 per minute). Slow down.'
            break;
            case 'user':
                limit=10;
                message = 'User request limit exceeded (10 per minute). Slow down.'
            break;
            case 'guest':
                limit=5;
                message = 'Guest request limit exceeded (5 per minute). Slow down.'
            break;         
        }
        
        const client = aj.
        
    } catch (e) {
        console.error('Arcjet middleware error:', e);
            res.status(500).json({ error: 'Internal server error', message: 'Something went wrong with security middleware'})
    }
} 