import ImageKit from "imagekit";
import { config } from "../config/config";
import fs from "fs";

var imagekit = new ImageKit({
    publicKey: config.imagekitPublicKey,
    privateKey: config.imagekitPrivateKey,
    urlEndpoint: config.imagekitUrlEndpoint,
});

const uploadOnImageKit = async (localFilePath: string, fileName: string) => {
    try {
        if (!localFilePath || !fileName) return null;
        const fileBuffer = await fs.promises.readFile(localFilePath);
        const result = await imagekit.upload({ file: fileBuffer, fileName });
        return result;
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    } finally {
        try {
            await fs.promises.unlink(localFilePath);
        } catch (unlinkError) {
            console.error("Error deleting local file:", unlinkError);
        }
    }
};

export { uploadOnImageKit };