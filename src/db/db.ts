import { DB_Name } from "../config/constant";
import mongoose from "mongoose";
import { config } from "../config/config";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${config.databaseUrl}/${DB_Name}`,
        );
        console.log(
            "n MongoDB connected !! DB HOST:",
            connectionInstance.connection.host,
        );
    } catch (error) {
                console.log(`Error :: mongoodb uri :: ${config.databaseUrl}/${DB_Name}`)

        console.error("MONGODB CONNECTION FAILED:", error);
        process.exit(1); // Exit the process with failure
    }
};

export default connectDB;
