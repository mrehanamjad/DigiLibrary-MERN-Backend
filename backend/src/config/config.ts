import { config as conf } from "dotenv";

conf();

const _config = {
    port: process.env.PORT as string,
    databaseUrl: process.env.MONGODB_URI as string,
    env: process.env.NODE_ENV as string,
    jwtSecret: process.env.JWT_SECRET as string,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "8d",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
    imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    imagekitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
}

export const config = Object.freeze(_config);