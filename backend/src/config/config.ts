import { config as conf } from "dotenv";

conf();

const _config = {
    port: process.env.PORT as string,
    databaseUrl: process.env.MONGO_URI as string,
    env: process.env.NODE_ENV as string,
    jwtSecret: process.env.JWT_SECRET as string,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY as string,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY as string,
}

export const config = Object.freeze(_config);