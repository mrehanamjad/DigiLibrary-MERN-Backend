import mongoose,{ Document } from "mongoose";

export interface SellerI extends Document {
  userId: mongoose.Types.ObjectId; // Reference to your application's user
  stripeAccountId: string; // The Connect acct_... ID
  onboardingCompleted: boolean; // Track onboarding status
  createdAt: Date;
  updatedAt: Date;
}