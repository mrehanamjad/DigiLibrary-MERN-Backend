import Stripe from 'stripe';
import { config } from '../config/config';

export const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2025-07-30.basil' });
