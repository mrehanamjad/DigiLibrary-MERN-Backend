import ImageKit from "imagekit";
import { config } from "../config/config";
import fs from "fs";

var imagekit = new ImageKit({
  publicKey: config.imagekitPublicKey,
  privateKey: config.imagekitPrivateKey,
  urlEndpoint: config.imagekitUrlEndpoint,
});

const uploadOnImageKit = async (
  localFilePath: string,
  fileName: string,
  isImage: boolean
) => {
  try {
    if (!localFilePath || !fileName) return null;

    const fileBuffer = await fs.promises.readFile(localFilePath);

    const folder = isImage ? "digoLibrary-images" : "digoLibrary-pdfs";

    const result = await imagekit.upload({
      file: fileBuffer,
      fileName,
      folder,
    });
    
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

const deleteFileImagekit = async (imagekitFileId: string) => {
  try {
    await imagekit.deleteFile(imagekitFileId);
    return true;
  } catch (error) {
    console.log("Error while deleting file from imagekit", error);
    return false;
  }
};

export { uploadOnImageKit,deleteFileImagekit };
