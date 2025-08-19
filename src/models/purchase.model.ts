import mongoose, { AggregatePaginateModel }  from "mongoose";
import { PurchaseI } from "../types/purchase.types";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

interface PurchaseModelI extends AggregatePaginateModel<PurchaseI> {}

const purchaseSchema = new mongoose.Schema<PurchaseI>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: Boolean,
      default: false,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate purchases
purchaseSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// Lookup optimization indexes
purchaseSchema.index({ userId: 1 });
purchaseSchema.index({ bookId: 1 });
purchaseSchema.index({ paymentId: 1 });

purchaseSchema.plugin(aggregatePaginate)

export const Purchase = mongoose.model<PurchaseI,PurchaseModelI>("Purchase", purchaseSchema);
