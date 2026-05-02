import { Resend } from "resend"

import { formatKzt } from "@/lib/currency"
import { getSiteUrl } from "@/lib/site-config"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function fromAddress(): string {
  const raw = process.env.ORDER_EMAIL_FROM?.trim()
  if (raw && raw.length > 3) return raw
  return "Kamilya <onboarding@resend.dev>"
}

function orderUrl(orderId: string): string {
  return `${getSiteUrl()}/account/orders/${orderId}`
}

function logSkip(reason: string, meta: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[email] ${reason}`, meta)
  }
}

export async function sendOrderPlacedEmail(args: {
  to: string
  orderId: string
  totalKzt: number
  firstName?: string
}) {
  if (!resend) {
    logSkip("RESEND_API_KEY missing; skip order placed", { orderId: args.orderId })
    return
  }
  const greeting = args.firstName?.trim() ? `Здравствуйте, ${args.firstName.trim()}!` : "Здравствуйте!"
  const shortId = args.orderId.slice(0, 8)
  await resend.emails.send({
    from: fromAddress(),
    to: args.to,
    subject: `Заказ ${shortId} принят`,
    html: `
      <p>${greeting}</p>
      <p>Мы получили ваш заказ <strong>${shortId}</strong>.</p>
      <p>Сумма: <strong>${formatKzt(Math.round(args.totalKzt))}</strong></p>
      <p><a href="${orderUrl(args.orderId)}">Статус и детали заказа</a></p>
      <p style="color:#666;font-size:12px;margin-top:24px;">Kamilya</p>
    `,
  })
}

export async function sendOrderPaidEmail(args: { to: string; orderId: string; totalKzt: number }) {
  if (!resend) {
    logSkip("RESEND_API_KEY missing; skip paid", { orderId: args.orderId })
    return
  }
  const shortId = args.orderId.slice(0, 8)
  await resend.emails.send({
    from: fromAddress(),
    to: args.to,
    subject: `Оплата заказа ${shortId} получена`,
    html: `
      <p>Спасибо! Оплата заказа <strong>${shortId}</strong> зафиксирована.</p>
      <p>Сумма: <strong>${formatKzt(Math.round(args.totalKzt))}</strong></p>
      <p><a href="${orderUrl(args.orderId)}">Открыть заказ</a></p>
      <p style="color:#666;font-size:12px;margin-top:24px;">Kamilya</p>
    `,
  })
}

export async function sendOrderShippedEmail(args: {
  to: string
  orderId: string
  trackingNumber?: string | null
  trackingCarrier?: string | null
}) {
  if (!resend) {
    logSkip("RESEND_API_KEY missing; skip shipped", { orderId: args.orderId })
    return
  }
  const shortId = args.orderId.slice(0, 8)
  const track =
    typeof args.trackingNumber === "string" && args.trackingNumber.trim().length > 0
      ? `<p>Трек-номер: <strong>${args.trackingNumber.trim()}</strong>${
          typeof args.trackingCarrier === "string" && args.trackingCarrier.trim()
            ? ` (${args.trackingCarrier.trim()})`
            : ""
        }</p>`
      : "<p>Трек-номер будет доступен в личном кабинете, как только служба передаст его.</p>"

  await resend.emails.send({
    from: fromAddress(),
    to: args.to,
    subject: `Заказ ${shortId} отправлен`,
    html: `
      <p>Ваш заказ <strong>${shortId}</strong> передан в доставку.</p>
      ${track}
      <p><a href="${orderUrl(args.orderId)}">Статус доставки</a></p>
      <p style="color:#666;font-size:12px;margin-top:24px;">Kamilya</p>
    `,
  })
}
