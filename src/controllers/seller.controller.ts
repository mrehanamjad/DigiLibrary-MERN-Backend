import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { stripe } from "../utils/stripe";
import { Seller } from "../models/seller.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { config } from "../config/config";
import { AuthRequest } from "../types/user.types";

const createSAccount = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest

  const existingSeller = await Seller.findOne({ userId: _req.user._id });
  if (existingSeller) {
    throw new ApiError(400, "Seller account already exists");
  }

  const account = await stripe.accounts.create({
    controller: {
      stripe_dashboard: {
        type: "express",
      },
      fees: {
        payer: "application", // You take 20%
      },
      losses: {
        payments: "application", // You handle disputes/refunds
      },
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      userId: _req.user._id.toString(),
    },
  });

  if (!account) {
    throw new ApiError(400, "Unable to create Stripe account");
  }

  const seller = await Seller.create({
    userId: _req.user._id,
    stripeAccountId: account.id,
    onboardingCompleted: false,
  });

  const safeSeller = {
    _id: seller._id,
    userId: seller.userId,
    onboardingCompleted: seller.onboardingCompleted,
    createdAt: seller.createdAt,
    updatedAt: seller.updatedAt,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(201, safeSeller, "Stripe account created successfully")
    );
});

const createSAccountLink = asyncHandler(async (req: Request, res: Response) => {
   const _req = req as AuthRequest;

  const seller = await Seller.findOne({ userId: _req.user._id });
  if (!seller) {
    throw new ApiError(404, "Seller account not found");
  }

  if (!seller.stripeAccountId) {
    throw new ApiError(400, "Seller does not have a Stripe account");
  }

  // const accountLink = await stripe.accountLinks.create({
  //   account: accountId,
  //   refresh_url: `${config.corsOrigin}/seller/onboarding/refresh`,
  //   return_url: `${config.corsOrigin}/seller/onboarding/complete`,
  //   type: "account_onboarding",
  // });

  //by stripe:

  const accountLink = await stripe.accountLinks.create({
    account: seller.stripeAccountId,
    return_url: `${config.corsOrigin}/return/${seller.stripeAccountId}`,
    refresh_url: `${config.corsOrigin}/refresh/${seller.stripeAccountId}`,
    type: "account_onboarding",
  });

  if (!accountLink || !accountLink.url) {
    throw new ApiError(400, "Unable to create Stripe onboarding link");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { url: accountLink.url },
        "Stripe onboarding link created successfully"
      )
    );
});

const sellerStripeDashboardLoginUrl = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;

  const seller = await Seller.findOne({ userId: _req.user._id });
  if (!seller) {
    throw new ApiError(404, "Seller account not found");
  }

  if (!seller.stripeAccountId) {
    throw new ApiError(400, "Seller does not have a Stripe account");
  }

  const loginLink = await stripe.accounts.createLoginLink(seller.stripeAccountId);

  if (!loginLink?.url) {
    throw new ApiError(400, "Unable to generate Stripe dashboard login link");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { url: loginLink.url }, "Stripe dashboard login link created successfully"));
});

export { createSAccount, createSAccountLink, sellerStripeDashboardLoginUrl };
