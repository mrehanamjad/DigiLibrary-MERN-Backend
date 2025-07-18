import mongoose, { Document } from "mongoose";

export interface PurchaseI extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  price: number;
  paymentStatus:  boolean;
  paymentId: string;
  createdAt: Date;
  updatedAt: Date;
}