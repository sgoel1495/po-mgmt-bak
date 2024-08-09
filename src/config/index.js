import * as dotenv from 'dotenv'
dotenv.config()

export const config = {
    database: {
        dsn: process.env.MONGO_CONNECTION_STRING,
        name: process.env.DATABASE_NAME,
    },
    port: process.env.PORT,
    secret: process.env.SECRET_KEY,

    accessTokenExpiry: 60 * 60 * 24,
    refreshTokenExpiry: 60 * 60 * 24 * 7
};
