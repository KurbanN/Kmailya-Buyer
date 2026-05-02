import { z } from "zod"

import { orderStatusSchema } from "@/lib/validators/domain"

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  size: z.string().min(1),
  colorHex: z.string().min(1),
  unitPrice: z.number().min(0),
  title: z.string().min(1),
})

export const createOrderSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  stateRegion: z.string().min(1),
  country: z.string().min(1),
  zip: z.string().min(1),
  shippingMethod: z.string().min(1),
  paymentMethod: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number().min(0),
  shippingFee: z.number().min(0),
  total: z.number().min(0),
  /** Необязательно; пустая строка на клиенте допускается */
  promoCode: z.string().max(32).optional(),
})

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  note: z.string().trim().max(300).optional(),
})

export const updateOrderTrackingSchema = z.object({
  trackingNumber: z.string().trim().min(3).max(120),
  carrier: z.string().trim().min(2).max(80).optional(),
})
