import type { Express } from "express";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../../../../config/cloudinary";

export const uploadToCloudinary = (file: Express.Multer.File): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "task-master/attachments",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};
