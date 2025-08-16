import { model, Schema } from "mongoose";
import { SellerI } from "../types/seller.types";

const SellerSchema = new Schema<SellerI>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripeAccountId: { type: String, required: true, unique: true }, // unique auto creates index
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
SellerSchema.index({ userId: 1 }, { unique: true }); // One seller profile per user
SellerSchema.index({ onboardingCompleted: 1 }); // For quick filtering of onboarding status
SellerSchema.index({ createdAt: -1 }); // For recent sellers listing

export const Seller = model<SellerI>("Seller", SellerSchema);
