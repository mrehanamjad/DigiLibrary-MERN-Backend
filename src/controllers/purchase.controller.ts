// import { Request, Response } from "express";
// import { ApiError } from "../utils/ApiError";
// import { ApiResponse } from "../utils/ApiResponse";
// import { Book } from "../models/book.model";
// import { stripe } from "../utils/stripe";
// import { config } from "../config/config";
// import { asyncHandler } from "../utils/asyncHandler";
// import { AuthRequest } from "../types/user.types";
// import { Seller } from "../models/seller.model";
// import { nanoid } from "nanoid";
// import Stripe from "stripe";
// import mongoose from "mongoose";

// const endpointSecret = config.stripeWebhookSecretKey;
// const ranId = nanoid();

// const createPurchase = asyncHandler(async (req: Request, res: Response) => {
//   const { cartItems } = req.body; // cartItems = [{ bookId, quantity }]
//   const _req = req as AuthRequest;

//   if (!Array.isArray(cartItems) || cartItems.length === 0) {
//     throw new ApiError(400, "Cart is empty");
//   }

//   // ✅ Fetch all books
//   const bookIds = cartItems.map((item) => item.bookId);
//   const books = await Book.find({ _id: { $in: bookIds }, isPublished: true });

//   if (books.length !== cartItems.length) {
//     throw new ApiError(404, "One or more books not found");
//   }

//   // ✅ Build Stripe line_items
//   const lineItems = cartItems.map((item) => {
//     const book = books.find((b) => b._id!.toString() === item.bookId)!;
//     return {
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: book.title,
//           metadata: {
//             id: book._id!.toString(),
//             name: book.title,
//             price: book.price,
//           },
//         },
//         unit_amount: book.price * 100, // cents
//       },
//       quantity: item.quantity || 1,
//     };
//   });

//   const transferGroupId = `order-${ranId}`;

//   // ✅ Create Stripe checkout session
//   const checkout = await stripe.checkout.sessions.create({
//     line_items: lineItems,
//     customer_email: _req.user.email,
//     mode: "payment",
//     success_url: `${config.corsOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.corsOrigin}/checkout/cancel`,
//     payment_intent_data: {
//       transfer_group: transferGroupId,
//     },
//     metadata: {
//       buyerId: _req.user._id.toString(),
//       items: JSON.stringify(cartItems),
//       transferGroupId,
//     },
//   });

//   if (!checkout.url) {
//     throw new ApiError(400, "Failed to create chechout session");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, checkout, "Checkout session created"));
// });

// const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
//   if (!endpointSecret) {
//     throw new ApiError(404, "Stripe webhook secret is missing");
//   }

//   const signature = req.headers["stripe-signature"];

//   if (!signature) {
//     throw new ApiError(400, "Stripe signature not found");
//   }

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
//   } catch (err: any) {
//     console.error("⚠️ Webhook signature verification failed.", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   switch (event.type) {
//     case "checkout.session.completed": {
//       const session: Stripe.Checkout.Session = event.data.object;

//       try {
//         if (!session.metadata || !session.metadata.items) {
//           throw new ApiError(400, "Missing metadata from Stripe session");
//         }

//         // Expand the payment_intent
//         const paymentIntentResponse = await stripe.paymentIntents.retrieve(
//           session.payment_intent as string,
//           {
//             expand: ["charges"], // 👈 important
//           }
//         );

//         console.log(
//           "✅ PaymentIntentResponase with charges:",
//           paymentIntentResponse
//         );

//         const paymentIntent = await stripe.paymentIntents.retrieve(
//           session.payment_intent as string
//         );

//         if (!paymentIntent.latest_charge) {
//           throw new Error("❌ No latest_charge found on paymentIntent");
//         }

//         // ✅ Fetch the actual charge object
//         const charge = await stripe.charges.retrieve(
//           paymentIntent.latest_charge as string
//         );

//         console.log("😎 Full Chaarge OBj:::::", charge)

//         console.log(
//           "💳 Charge object:",
//           charge.id,
//           charge.amount,
//           charge.balance_transaction
//         );

//         const cartItems = JSON.parse(session.metadata.items);

//         const bookIds = cartItems.map(
//           (item: { bookId: string; quantity: number }) => item.bookId
//         );

//         const books = await Book.find({
//           _id: { $in: bookIds },
//           isPublished: true,
//         });

//         if (books.length !== bookIds.length) {
//           console.error(
//             "❌ Not all books found in the database. Found:",
//             books.length,
//             "Expected:",
//             bookIds.length
//           );
//         }

//         const sellerPriceObj: Record<string, number> = {};
//         const FEE_PERCENTAGE = 0.14; // 14% platform fee
//         for (const item of cartItems) {
//           const book = books.find((b) => b._id!.toString() === item.bookId);
//           if (!book) {
//             continue;
//           }
//           const sellerId = book.userId.toString();
//           const totalPrice = book.price * (item.quantity || 1);
//           const amountToTransfer = totalPrice * (1 - FEE_PERCENTAGE);

//           if (!sellerPriceObj[sellerId]) {
//             sellerPriceObj[sellerId] = 0;
//           }
//           sellerPriceObj[sellerId] += amountToTransfer;
//         }

//         for (const key in sellerPriceObj) {
//           const seller = await Seller.findOne({ userId: key });
//           if (!mongoose.Types.ObjectId.isValid(key)) {
//             throw new Error(
//               "mongoose.Types.ObjectId.isValid key/sellerId is not valid"
//             );
//           }
//           if (!seller || !seller.stripeAccountId) {
//             console.error(
//               `❌ Seller or Stripe account not found for ID: ${key}`
//             );
//             continue;
//           }

//           const amountInCents = Math.round(sellerPriceObj[key] * 100);

//           await stripe.transfers.create({
//             amount: amountInCents,
//             currency: "usd",
//             destination: seller.stripeAccountId,
//             transfer_group: session.metadata.transferGroupId,
//             source_transaction: charge.id,
//           });
//         }
//       } catch (err: any) {
//         console.error(
//           "❌ Error handling checkout.session.completed:",
//           err.message
//         );
//         throw new ApiError(400, "Error handling checkout.session.completed");
//       }
//       break;
//     }

//     default:
//       console.log(`➡️ Unhandled event type: ${event.type}`);
//   }

//   return res.status(200).send({ received: true });
// });

// export { createPurchase, stripeWebhook };

// 👆 FIXME: and use leter

import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Book } from "../models/book.model";
import { stripe } from "../utils/stripe";
import { config } from "../config/config";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types/user.types";
import { Seller } from "../models/seller.model";
import Stripe from "stripe";
import { PLATFORM_FEE } from "../config/constant";
import { Purchase } from "../models/purchase.model";
import mongoose, { PipelineStage, PrePaginatePipelineStage } from "mongoose";
import { getPaginationOptions } from "../utils/helper";

const endpointSecret = config.stripeWebhookSecretKey;

// ----------------- CREATE PURCHASE -----------------
const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.body;
  const quantity = 1;

  const _req = req as AuthRequest;

  if (!bookId || !quantity) {
    throw new ApiError(400, "BookId and Quantity are required");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, "Book not found");
  }

  const seller = await Seller.findOne({ userId: book.userId });
  if (!seller || !seller.stripeAccountId) {
    throw new ApiError(404, "Seller or Stripe account not found");
  }

  //   const imageUrlStr = book.coverImage as unknown as string;

  const unitAmountInCent = book.price * 100;
  const applicationFeeInCent = Math.round(unitAmountInCent * PLATFORM_FEE);

  const checkout = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: book.title,
            // images: [imageUrlStr] ,
          },
          unit_amount: unitAmountInCent, // cents
        },
        quantity: quantity || 1,
      },
    ],
    customer_email: _req.user.email,
    mode: "payment",
    success_url: `${config.corsOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.corsOrigin}/checkout/cancel`,
    payment_intent_data: {
      application_fee_amount: applicationFeeInCent,
      transfer_data: {
        destination: seller.stripeAccountId,
      },
    },
    metadata: {
      buyerId: _req.user._id.toString(),
      bookId: book._id!.toString(),
      sellerId: seller._id!.toString(),
      totalPrice: book.price,
    },
  });

  if (!checkout.url) {
    throw new ApiError(400, "Failed to create checkout session");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, checkout, "Checkout session created"));
});

// ----------------- STRIPE WEBHOOK -----------------
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
    // ✅ IMPORTANT: req.body must be the raw body, not parsed JSON
    // In Express, you need `express.raw({ type: "application/json" })` middleware
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle important events
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("✅ Checkout completed:", session.id);
      // TODO: Save order to DB, mark as paid, notify seller, etc.
      if (!session) {
        throw new ApiError(404, "session not found at checkout complete");
      }

      if (!session.metadata) {
        throw new ApiError(
          404,
          "session metadata not found at checkout complete"
        );
      }

      console.log("checkout coplete session ::", session);

      await Purchase.create({
        userId: session.metadata.buyerId,
        bookId: session.metadata.bookId,
        paymentStatus: true,
        paymentId: session.payment_intent,
        price: session.metadata.totalPrice,
      });

      break;

    case "payment_intent.succeeded":
      const intent = event.data.object as Stripe.PaymentIntent;
      console.log("💰 Payment succeeded:", intent.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return res.status(200).send({ received: true });
});

const currentBalance = asyncHandler(async (req: Request, res: Response) => {
  const balance = await stripe.balance.retrieve();

  return res
    .status(200)
    .json(new ApiResponse(200, balance, "balance get successfully"));
});

const getMyPurchases = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, sortType = "desc" } = req.query;
  const _req = req as AuthRequest;

  const aggregationPipeline = [
    {
      $match: { userId: new mongoose.Types.ObjectId(_req.user._id) },
    },
    {
      $sort: { createdAt: sortType === "desc" ? -1 : 1 },
    },
    {
      $lookup: {
        from: "books",
        localField: "bookId",
        foreignField: "_id",
        as: "book",
        pipeline: [
          {
            $lookup: {
              from: "users",
              let: { userId: "$userId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$userId"] },
                  },
                },
              ],
              as: "user",
            },
          },
          { $unwind: "$user" },
        ],
      },
    },
    { $unwind: "$book" },
    {
      $project: {
        book: {
          _id: "$book._id",
          title: "$book.title",
          author: "$book.author",
          price: "$book.price",
          isFree: "$book.isFree",
          category: "$book.category",
          language: "$book.language",
          views: "$book.views",
          isPublished: "$book.isPublished",
          user: {
            _id: "$book.user._id",
            username: "$book.user.username",
            fullName: "$book.user.fullName",
            avatar: "$book.user.avatar",
          },
        },
        price: 1,
        paymentStatus: 1,
        paymentId: 1,
      },
    },
  ] as PipelineStage[];


  const options = getPaginationOptions(
    Number(page),
    Number(limit),
    "totalpurchases",
    "purchases"
  );

  const result = await Purchase.aggregatePaginate(
    Purchase.aggregate(aggregationPipeline),
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Your Purchased Books fetched successfully")
    );
});

export { createPurchase, stripeWebhook, currentBalance, getMyPurchases };
