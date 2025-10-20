const allowedOrigins = [
    'http://localhost:3000/',
    'http://localhost:3001/',
    'https://localhost:3000/',
    'https://localhost:3001/',
    'https://studio.apollographql.com'
];

export const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`[CORS] Blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}
