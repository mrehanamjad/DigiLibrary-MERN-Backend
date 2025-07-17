import { app } from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 8000;

app.on("error", (err) => {
    console.log("❌ App Error:", err);
    process.exit(1);
});

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running at port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err);
        process.exit(1);
    });
