import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Book } from "../models/book.model";
import { stripe } from "../utils/stripe";
import { config } from "../config/config";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types/user.types";
import { Seller } from "../models/seller.model";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import mongoose from "mongoose";

const endpointSecret = config.stripeWebhookSecretKey;
const ranId = nanoid();

const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { cartItems } = req.body; // cartItems = [{ bookId, quantity }]
  const _req = req as AuthRequest;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  // ✅ Fetch all books
  const bookIds = cartItems.map((item) => item.bookId);
  const books = await Book.find({ _id: { $in: bookIds }, isPublished: true });

  if (books.length !== cartItems.length) {
    throw new ApiError(404, "One or more books not found");
  }

  // ✅ Build Stripe line_items
  const lineItems = cartItems.map((item) => {
    const book = books.find((b) => b._id!.toString() === item.bookId)!;
    return {
      price_data: {
        currency: "usd",
        product_data: { name: book.title },
        unit_amount: Math.round(book.price * 100), // cents
      },
      quantity: item.quantity || 1,
    };
  });

  const transferGroupId = `order-${ranId}`;

  // ✅ Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: `${config.corsOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.corsOrigin}/checkout/cancel`,
    payment_intent_data: {
      transfer_group: transferGroupId,
    },
    metadata: {
      buyerId: _req.user._id.toString(),
      items: JSON.stringify(cartItems),
      transferGroupId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Checkout session created"));
});

const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!endpointSecret) {
    throw new ApiError(404, "Stripe webhook secret is missing");
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new ApiError(400, "Stripe signature not found");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session: Stripe.Checkout.Session = event.data.object;

      try {
        if (!session.metadata || !session.metadata.items) {
          throw new ApiError(400, "Missing metadata from Stripe session");
        }

        const cartItems = JSON.parse(session.metadata.items);

        const bookIds = cartItems.map(
          (item: { bookId: string; quantity: number }) => item.bookId
        );

        const books = await Book.find({
          _id: { $in: bookIds },
          isPublished: true,
        });

        if (books.length !== bookIds.length) {
          console.error(
            "❌ Not all books found in the database. Found:",
            books.length,
            "Expected:",
            bookIds.length
          );
        }

        const sellerPriceObj: Record<string, number> = {};
        const FEE_PERCENTAGE = 0.14; // 14% platform fee
        for (const item of cartItems) {
          const book = books.find((b) => b._id!.toString() === item.bookId);
          if (!book) {
            continue;
          }
          const sellerId = book.userId.toString();
          const totalPrice = book.price * (item.quantity || 1);
          const amountToTransfer = totalPrice * (1 - FEE_PERCENTAGE);

          if (!sellerPriceObj[sellerId]) {
            sellerPriceObj[sellerId] = 0;
          }
          sellerPriceObj[sellerId] += amountToTransfer;
        }

        for (const key in sellerPriceObj) {
          const seller = await Seller.findOne({userId: key});
          if (!mongoose.Types.ObjectId.isValid(key)) {
            throw new Error("mongoose.Types.ObjectId.isValid key/sellerId is not valid");
          }
          if (!seller || !seller.stripeAccountId) {
            console.error(
              `❌ Seller or Stripe account not found for ID: ${key}`
            );
            continue;
          }

          const amountInCents = Math.round(sellerPriceObj[key] * 100);

          const t = await stripe.transfers.create({
            amount: amountInCents,
            currency: "usd",
            destination: seller.stripeAccountId,
            transfer_group: session.metadata.transferGroupId,
          });

          console.log(
            `✅ Transferred $${(amountInCents / 100).toFixed(2)} to seller ${seller._id}`
          );
        }
      } catch (err: any) {
        console.error(
          "❌ Error handling checkout.session.completed:",
          err.message
        );
        throw new ApiError(400, "Error handling checkout.session.completed");
      }
      break;
    }

    default:
      console.log(`➡️ Unhandled event type: ${event.type}`);
  }

  console.log({ received: true });
  return res.status(200).send({ received: true });
});

export { createPurchase, stripeWebhook };
