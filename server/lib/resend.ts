/**
 * LeaseMate Resend Email Integration
 * All transactional emails for the LeaseMate marketplace.
 *
 * Sender: notifications@leasemate.com.au (configure in Resend dashboard)
 * Brand: Charcoal #1C1C1E / Slate Teal #4A7C7E / Alabaster #F5F4F0 / Inter font
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_ADDRESS = "LeaseMate <notifications@leasemate.com.au>";
const REPLY_TO = "support@leasemate.com.au";

export { FROM_ADDRESS };

// ─── Base HTML wrapper ────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LeaseMate</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #F5F4F0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1C1C1E; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .header { background-color: #1C1C1E; padding: 28px 40px; }
    .header-logo { font-size: 18px; font-weight: 600; color: #FFFFFF; letter-spacing: -0.3px; }
    .header-logo span { color: #4A7C7E; }
    .body { padding: 40px; }
    .greeting { font-size: 22px; font-weight: 600; color: #1C1C1E; margin-bottom: 16px; line-height: 1.3; }
    .text { font-size: 15px; color: #4B4B4B; line-height: 1.7; margin-bottom: 16px; }
    .info-box { background: #F5F4F0; border-left: 3px solid #4A7C7E; border-radius: 6px; padding: 16px 20px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #EAEAE8; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #9B9B9B; font-weight: 500; }
    .info-value { color: #1C1C1E; font-weight: 500; text-align: right; }
    .cta-button { display: inline-block; background-color: #4A7C7E; color: #FFFFFF !important; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px; margin: 24px 0; letter-spacing: -0.1px; }
    .divider { border: none; border-top: 1px solid #EAEAE8; margin: 28px 0; }
    .note { font-size: 13px; color: #9B9B9B; line-height: 1.6; }
    .footer { background-color: #F5F4F0; padding: 24px 40px; border-top: 1px solid #EAEAE8; }
    .footer-text { font-size: 12px; color: #9B9B9B; line-height: 1.6; }
    .footer-text a { color: #4A7C7E; text-decoration: none; }
    .badge { display: inline-block; background: #EDF4F4; color: #4A7C7E; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .alert-box { background: #FFF8F0; border-left: 3px solid #E8A838; border-radius: 6px; padding: 16px 20px; margin: 24px 0; }
    .alert-text { font-size: 14px; color: #7A5C1E; line-height: 1.6; }
    .success-box { background: #F0F9F4; border-left: 3px solid #3DAF6A; border-radius: 6px; padding: 16px 20px; margin: 24px 0; }
    .success-text { font-size: 14px; color: #1A6640; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">Lease<span>Mate</span></div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p class="footer-text">
        This email was sent by LeaseMate, Melbourne's move-out service marketplace.<br />
        Questions? Reply to this email or contact <a href="mailto:support@leasemate.com.au">support@leasemate.com.au</a><br />
        <a href="https://leasemate.com.au/privacy">Privacy Policy</a> &nbsp;·&nbsp; <a href="https://leasemate.com.au/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Resend API helper ────────────────────────────────────────────────────────

async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ id: string } | null> {
  if (!RESEND_API_KEY) {
    console.warn("[Resend] RESEND_API_KEY not set — email not sent:", params.subject);
    return null;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo ?? REPLY_TO,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Resend] Send failed:", res.status, err);
      return null;
    }
    const data = await res.json() as { id: string };
    console.log("[Resend] Email sent:", data.id, "→", params.subject);
    return data;
  } catch (err) {
    console.error("[Resend] Network error:", err);
    return null;
  }
}

// ─── Email 1: Customer — Request Received ────────────────────────────────────

export async function sendCustomerRequestReceived(params: {
  customerEmail: string;
  customerName: string;
  requestId: number;
  suburb: string;
  moveOutDate: string;
  serviceCount: number;
  dashboardUrl: string;
}) {
  const html = emailWrapper(`
    <div class="badge">Request Confirmed</div>
    <h1 class="greeting">Your move-out request is in.</h1>
    <p class="text">Hi ${params.customerName}, we've received your move-out request for <strong>${params.suburb}</strong> and our team is now matching you with vetted providers across your selected services.</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Request ID</span><span class="info-value">#${params.requestId}</span></div>
      <div class="info-row"><span class="info-label">Suburb</span><span class="info-value">${params.suburb}</span></div>
      <div class="info-row"><span class="info-label">Move-out date</span><span class="info-value">${params.moveOutDate}</span></div>
      <div class="info-row"><span class="info-label">Services requested</span><span class="info-value">${params.serviceCount} service${params.serviceCount !== 1 ? "s" : ""}</span></div>
    </div>

    <p class="text">We'll notify you as providers are matched to each service. You can track the status of your request at any time from your dashboard.</p>

    <a href="${params.dashboardUrl}" class="cta-button">View Request Status →</a>

    <hr class="divider" />
    <p class="note">Your full address is only shared with providers after they've paid their introduction fee — your privacy is protected throughout the process.</p>
  `);

  return sendEmail({
    to: params.customerEmail,
    subject: `Request confirmed — move-out at ${params.suburb} on ${params.moveOutDate}`,
    html,
  });
}

// ─── Email 2: Customer — Provider Matched ────────────────────────────────────

export async function sendCustomerProviderMatched(params: {
  customerEmail: string;
  customerName: string;
  requestId: number;
  serviceCategory: string;
  suburb: string;
  dashboardUrl: string;
}) {
  const html = emailWrapper(`
    <div class="badge">Provider Matched</div>
    <h1 class="greeting">A provider has been matched to your ${params.serviceCategory}.</h1>
    <p class="text">Hi ${params.customerName}, great news — we've matched a vetted provider to your <strong>${params.serviceCategory}</strong> request in <strong>${params.suburb}</strong>.</p>

    <div class="success-box">
      <p class="success-text">The provider has accepted the job and paid their introduction fee. They'll be in touch with you directly to confirm the booking details.</p>
    </div>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${params.serviceCategory}</span></div>
      <div class="info-row"><span class="info-label">Location</span><span class="info-value">${params.suburb}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">Provider confirmed</span></div>
    </div>

    <p class="text">Expect to hear from the provider within 24 hours. If you don't receive contact within 48 hours, please let us know and we'll follow up on your behalf.</p>

    <a href="${params.dashboardUrl}" class="cta-button">View Request Status →</a>

    <hr class="divider" />
    <p class="note">If you have any concerns about the provider or the booking, contact us at support@leasemate.com.au and we'll assist immediately.</p>
  `);

  return sendEmail({
    to: params.customerEmail,
    subject: `Provider matched — ${params.serviceCategory} at ${params.suburb}`,
    html,
  });
}

// ─── Email 3: Customer — Request Fulfilled ───────────────────────────────────

export async function sendCustomerRequestFulfilled(params: {
  customerEmail: string;
  customerName: string;
  requestId: number;
  suburb: string;
  moveOutDate: string;
  providerName: string;
  providerPhone?: string;
  providerEmail?: string;
  serviceCategory: string;
  dashboardUrl: string;
}) {
  const html = emailWrapper(`
    <div class="badge">All Set</div>
    <h1 class="greeting">Your ${params.serviceCategory} is confirmed.</h1>
    <p class="text">Hi ${params.customerName}, your <strong>${params.serviceCategory}</strong> booking is confirmed. Here are the provider's contact details for your records.</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Provider</span><span class="info-value">${params.providerName}</span></div>
      ${params.providerPhone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${params.providerPhone}</span></div>` : ""}
      ${params.providerEmail ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value">${params.providerEmail}</span></div>` : ""}
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${params.serviceCategory}</span></div>
      <div class="info-row"><span class="info-label">Location</span><span class="info-value">${params.suburb}</span></div>
      <div class="info-row"><span class="info-label">Move-out date</span><span class="info-value">${params.moveOutDate}</span></div>
    </div>

    <p class="text">Please reach out to the provider directly to confirm the exact time and any access arrangements. We recommend doing this at least 48 hours before your move-out date.</p>

    <a href="${params.dashboardUrl}" class="cta-button">View Full Request →</a>

    <hr class="divider" />
    <p class="note">If anything changes or you experience any issues with the provider, contact us at support@leasemate.com.au within 7 days of your move-out date.</p>
  `);

  return sendEmail({
    to: params.customerEmail,
    subject: `${params.serviceCategory} confirmed — ${params.providerName} will be in touch`,
    html,
  });
}

// ─── Email 4: Provider — New Opportunity ─────────────────────────────────────

export async function sendProviderNewOpportunity(params: {
  providerEmail: string;
  providerName: string;
  invitationId: number;
  serviceCategory: string;
  suburb: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  moveOutDate: string;
  introductionFee: string;
  expiresIn: string;
  opportunitiesUrl: string;
}) {
  const html = emailWrapper(`
    <div class="badge">New Opportunity</div>
    <h1 class="greeting">You have a new ${params.serviceCategory} job in ${params.suburb}.</h1>
    <p class="text">Hi ${params.providerName}, a customer in your service area is looking for a <strong>${params.serviceCategory}</strong> provider. This opportunity has been matched to your profile.</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${params.serviceCategory}</span></div>
      <div class="info-row"><span class="info-label">Suburb</span><span class="info-value">${params.suburb}</span></div>
      <div class="info-row"><span class="info-label">Property</span><span class="info-value">${params.propertyType}${params.bedrooms ? ` · ${params.bedrooms}bd` : ""}${params.bathrooms ? ` ${params.bathrooms}ba` : ""}</span></div>
      <div class="info-row"><span class="info-label">Move-out date</span><span class="info-value">${params.moveOutDate}</span></div>
      <div class="info-row"><span class="info-label">Introduction fee</span><span class="info-value">$${params.introductionFee} AUD</span></div>
      <div class="info-row"><span class="info-label">Expires in</span><span class="info-value">${params.expiresIn}</span></div>
    </div>

    <div class="alert-box">
      <p class="alert-text"><strong>Full address is hidden</strong> until you accept and pay the introduction fee. Once paid, the customer's address and contact details are released immediately.</p>
    </div>

    <p class="text">Accept this opportunity before it expires. Introduction fees are non-refundable except in cases where the customer is unreachable after 3 documented contact attempts within 7 days.</p>

    <a href="${params.opportunitiesUrl}" class="cta-button">View Opportunity →</a>

    <hr class="divider" />
    <p class="note">This opportunity was matched based on your service area and category settings. To update your coverage zones, visit your provider profile.</p>
  `);

  return sendEmail({
    to: params.providerEmail,
    subject: `New ${params.serviceCategory} opportunity in ${params.suburb} — ${params.expiresIn} to respond`,
    html,
  });
}

// ─── Email 5: Provider — Opportunity Expiring Soon ───────────────────────────

export async function sendProviderOpportunityExpiring(params: {
  providerEmail: string;
  providerName: string;
  invitationId: number;
  serviceCategory: string;
  suburb: string;
  hoursRemaining: number;
  introductionFee: string;
  opportunitiesUrl: string;
}) {
  const html = emailWrapper(`
    <div class="badge" style="background:#FFF3E0;color:#E8A838;">Expiring Soon</div>
    <h1 class="greeting">Your ${params.serviceCategory} opportunity expires in ${params.hoursRemaining} hours.</h1>
    <p class="text">Hi ${params.providerName}, this is a reminder that your <strong>${params.serviceCategory}</strong> opportunity in <strong>${params.suburb}</strong> is about to expire.</p>

    <div class="alert-box">
      <p class="alert-text">
        <strong>Only ${params.hoursRemaining} hours remaining.</strong> If you don't respond before the deadline, this opportunity will be passed to another provider.
      </p>
    </div>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${params.serviceCategory}</span></div>
      <div class="info-row"><span class="info-label">Suburb</span><span class="info-value">${params.suburb}</span></div>
      <div class="info-row"><span class="info-label">Introduction fee</span><span class="info-value">$${params.introductionFee} AUD</span></div>
      <div class="info-row"><span class="info-label">Time remaining</span><span class="info-value" style="color:#E8A838;">${params.hoursRemaining}h</span></div>
    </div>

    <a href="${params.opportunitiesUrl}" class="cta-button">Accept Now →</a>

    <hr class="divider" />
    <p class="note">If you're no longer available for this job, please decline it so we can match another provider promptly.</p>
  `);

  return sendEmail({
    to: params.providerEmail,
    subject: `${params.hoursRemaining}h left — ${params.serviceCategory} opportunity in ${params.suburb}`,
    html,
  });
}

// ─── Email 6: Provider — Payment Confirmed + Address Released ────────────────

export async function sendProviderPaymentConfirmed(params: {
  providerEmail: string;
  providerName: string;
  invitationId: number;
  serviceCategory: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  propertyAddress: string;
  suburb: string;
  moveOutDate: string;
  accessNotes?: string;
  amountPaid: string;
  billingUrl: string;
}) {
  const html = emailWrapper(`
    <div class="badge" style="background:#F0F9F4;color:#3DAF6A;">Payment Confirmed</div>
    <h1 class="greeting">Payment confirmed. Customer details unlocked.</h1>
    <p class="text">Hi ${params.providerName}, your introduction fee has been received. The customer's full address and contact details are now available below.</p>

    <div class="success-box">
      <p class="success-text">Introduction fee of <strong>$${params.amountPaid} AUD</strong> confirmed. Contact the customer within 24 hours to confirm the booking.</p>
    </div>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Customer name</span><span class="info-value">${params.customerName}</span></div>
      <div class="info-row"><span class="info-label">Customer email</span><span class="info-value">${params.customerEmail}</span></div>
      ${params.customerPhone ? `<div class="info-row"><span class="info-label">Customer phone</span><span class="info-value">${params.customerPhone}</span></div>` : ""}
      <div class="info-row"><span class="info-label">Property address</span><span class="info-value">${params.propertyAddress}</span></div>
      <div class="info-row"><span class="info-label">Suburb</span><span class="info-value">${params.suburb}</span></div>
      <div class="info-row"><span class="info-label">Move-out date</span><span class="info-value">${params.moveOutDate}</span></div>
      ${params.accessNotes ? `<div class="info-row"><span class="info-label">Access notes</span><span class="info-value">${params.accessNotes}</span></div>` : ""}
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${params.serviceCategory}</span></div>
    </div>

    <p class="text">Please reach out to the customer within 24 hours to confirm the booking. If you're unable to reach the customer after 3 documented attempts within 7 days, you may be eligible for a refund — contact support.</p>

    <a href="${params.billingUrl}" class="cta-button">View Billing History →</a>

    <hr class="divider" />
    <p class="note">Introduction fees are non-refundable except under the LeaseMate Provider Guarantee. The 7-day refund window begins from the date of this payment confirmation.</p>
  `);

  return sendEmail({
    to: params.providerEmail,
    subject: `Payment confirmed — ${params.serviceCategory} at ${params.suburb} on ${params.moveOutDate}`,
    html,
  });
}

// ─── Email 7: Provider — Refund Approved ─────────────────────────────────────

export async function sendProviderRefundApproved(params: {
  providerEmail: string;
  providerName: string;
  invitationId: number;
  serviceCategory: string;
  suburb: string;
  refundAmount: string;
  refundReason: string;
  billingUrl: string;
}) {
  const html = emailWrapper(`
    <div class="badge" style="background:#F0F9F4;color:#3DAF6A;">Refund Approved</div>
    <h1 class="greeting">Your refund has been approved.</h1>
    <p class="text">Hi ${params.providerName}, we've reviewed your refund request for the <strong>${params.serviceCategory}</strong> introduction fee in <strong>${params.suburb}</strong> and it has been approved.</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${params.serviceCategory}</span></div>
      <div class="info-row"><span class="info-label">Suburb</span><span class="info-value">${params.suburb}</span></div>
      <div class="info-row"><span class="info-label">Refund amount</span><span class="info-value">$${params.refundAmount} AUD</span></div>
      <div class="info-row"><span class="info-label">Reason</span><span class="info-value">${params.refundReason}</span></div>
    </div>

    <div class="success-box">
      <p class="success-text">The refund will appear on your original payment method within 5–10 business days, depending on your bank.</p>
    </div>

    <p class="text">We apologise for the inconvenience. If you have any questions about this refund or would like to discuss the situation further, please contact our support team.</p>

    <a href="${params.billingUrl}" class="cta-button">View Billing History →</a>

    <hr class="divider" />
    <p class="note">Refunds are processed via Stripe and typically appear within 5–10 business days. Contact support@leasemate.com.au if you don't see the refund after 10 business days.</p>
  `);

  return sendEmail({
    to: params.providerEmail,
    subject: `Refund approved — $${params.refundAmount} for ${params.serviceCategory} in ${params.suburb}`,
    html,
  });
}

// ─── Email 8: Operator — Critical Exception Alert ────────────────────────────

export async function sendOperatorExceptionAlert(params: {
  operatorEmail: string;
  exceptionCode: string;
  exceptionTitle: string;
  severity: "critical" | "warning" | "info";
  affectedParty: string;
  entityType: string;
  entityId: number;
  description: string;
  opsUrl: string;
}) {
  const severityColor = params.severity === "critical" ? "#DC2626" : params.severity === "warning" ? "#E8A838" : "#4A7C7E";
  const severityBg = params.severity === "critical" ? "#FEF2F2" : params.severity === "warning" ? "#FFF8F0" : "#EDF4F4";

  const html = emailWrapper(`
    <div class="badge" style="background:${severityBg};color:${severityColor};">${params.severity.toUpperCase()} — ${params.exceptionCode}</div>
    <h1 class="greeting">${params.exceptionTitle}</h1>
    <p class="text">A new exception has been raised in the LeaseMate Operations Center and requires your attention.</p>

    <div class="info-box" style="border-left-color:${severityColor};">
      <div class="info-row"><span class="info-label">Exception code</span><span class="info-value" style="color:${severityColor};">${params.exceptionCode}</span></div>
      <div class="info-row"><span class="info-label">Severity</span><span class="info-value">${params.severity}</span></div>
      <div class="info-row"><span class="info-label">Affected party</span><span class="info-value">${params.affectedParty}</span></div>
      <div class="info-row"><span class="info-label">Entity</span><span class="info-value">${params.entityType} #${params.entityId}</span></div>
    </div>

    <div class="alert-box" style="border-left-color:${severityColor};background:${severityBg};">
      <p class="alert-text" style="color:#4B4B4B;">${params.description}</p>
    </div>

    <a href="${params.opsUrl}" class="cta-button" style="background-color:${severityColor};">Review in Ops Center →</a>

    <hr class="divider" />
    <p class="note">This is an automated alert from the LeaseMate Operations Center. Log in to review the full exception detail, affected parties, and available resolution actions.</p>
  `);

  return sendEmail({
    to: params.operatorEmail,
    subject: `[${params.severity.toUpperCase()}] ${params.exceptionCode}: ${params.exceptionTitle}`,
    html,
  });
}

// ─── Legacy stubs (kept for backward compatibility) ───────────────────────────

/** @deprecated Use sendProviderNewOpportunity instead */
export async function sendProviderInvitation(params: {
  to: string;
  providerName: string;
  categoryName: string;
  suburb: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  expiresAt: Date;
  acceptUrl: string;
  declineUrl: string;
}): Promise<void> {
  const expiresIn = Math.max(0, Math.round((params.expiresAt.getTime() - Date.now()) / 3600000));
  await sendProviderNewOpportunity({
    providerEmail: params.to,
    providerName: params.providerName,
    invitationId: 0,
    serviceCategory: params.categoryName,
    suburb: params.suburb,
    propertyType: params.propertyType,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    moveOutDate: "TBC",
    introductionFee: "15.00",
    expiresIn: `${expiresIn}h`,
    opportunitiesUrl: params.acceptUrl,
  });
}

/** @deprecated Use sendCustomerRequestReceived instead */
export async function sendCustomerRequestConfirmation(params: {
  to: string;
  customerName: string;
  requestId: number;
  services: string[];
  trackingUrl: string;
}): Promise<void> {
  await sendCustomerRequestReceived({
    customerEmail: params.to,
    customerName: params.customerName,
    requestId: params.requestId,
    suburb: "Melbourne",
    moveOutDate: "TBC",
    serviceCount: params.services.length,
    dashboardUrl: params.trackingUrl,
  });
}

/** @deprecated Use sendProviderPaymentConfirmed instead */
export async function sendCustomerDetailsRelease(params: {
  to: string;
  providerName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  propertyAddress: string;
  accessNotes: string | null;
  moveOutDate: string | null;
}): Promise<void> {
  await sendProviderPaymentConfirmed({
    providerEmail: params.to,
    providerName: params.providerName,
    invitationId: 0,
    serviceCategory: "Service",
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone ?? undefined,
    propertyAddress: params.propertyAddress,
    suburb: "Melbourne",
    moveOutDate: params.moveOutDate ?? "TBC",
    accessNotes: params.accessNotes ?? undefined,
    amountPaid: "15.00",
    billingUrl: "/provider/billing",
  });
}

/** @deprecated Use sendProviderOpportunityExpiring instead */
export async function sendProviderTimeoutWarning(params: {
  to: string;
  providerName: string;
  categoryName: string;
  hoursRemaining: number;
}): Promise<void> {
  await sendProviderOpportunityExpiring({
    providerEmail: params.to,
    providerName: params.providerName,
    invitationId: 0,
    serviceCategory: params.categoryName,
    suburb: "Melbourne",
    hoursRemaining: params.hoursRemaining,
    introductionFee: "15.00",
    opportunitiesUrl: "/provider/opportunities",
  });
}

/** @deprecated Use sendProviderRefundApproved instead */
export async function sendRefundApproved(params: {
  to: string;
  providerName: string;
  amount: number;
  categoryName: string;
}): Promise<void> {
  await sendProviderRefundApproved({
    providerEmail: params.to,
    providerName: params.providerName,
    invitationId: 0,
    serviceCategory: params.categoryName,
    suburb: "Melbourne",
    refundAmount: params.amount.toFixed(2),
    refundReason: "Approved by operator",
    billingUrl: "/provider/billing",
  });
}

export async function sendRefundRejected(params: {
  to: string;
  providerName: string;
  categoryName: string;
  reason: string;
}): Promise<void> {
  const html = emailWrapper(`
    <div class="badge" style="background:#FEF2F2;color:#DC2626;">Refund Declined</div>
    <h1 class="greeting">Your refund request was not approved.</h1>
    <p class="text">Hi ${params.providerName}, we've reviewed your refund request for the <strong>${params.categoryName}</strong> introduction fee and unfortunately it does not meet our refund criteria.</p>

    <div class="alert-box">
      <p class="alert-text"><strong>Reason:</strong> ${params.reason}</p>
    </div>

    <p class="text">If you believe this decision is incorrect or have additional information to provide, please contact our support team within 7 days and we'll review your case again.</p>

    <a href="mailto:support@leasemate.com.au" class="cta-button">Contact Support →</a>

    <hr class="divider" />
    <p class="note">LeaseMate introduction fees are non-refundable except where the customer is genuinely unreachable after 3 documented contact attempts within the 7-day window.</p>
  `);

  await sendEmail({
    to: params.to,
    subject: `Refund request declined — ${params.categoryName} introduction fee`,
    html,
  });
}

/** @deprecated Use sendProviderAcceptanceConfirmation instead */
export async function sendProviderAcceptanceConfirmation(params: {
  to: string;
  providerName: string;
  categoryName: string;
  paymentUrl: string;
  amount: number;
}): Promise<void> {
  const html = emailWrapper(`
    <div class="badge">Acceptance Confirmed</div>
    <h1 class="greeting">You've accepted this opportunity.</h1>
    <p class="text">Hi ${params.providerName}, your acceptance of the <strong>${params.categoryName}</strong> opportunity has been recorded. Complete your payment to unlock the customer's full address and contact details.</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${params.categoryName}</span></div>
      <div class="info-row"><span class="info-label">Introduction fee</span><span class="info-value">$${params.amount.toFixed(2)} AUD</span></div>
    </div>

    <a href="${params.paymentUrl}" class="cta-button">Pay Introduction Fee →</a>

    <hr class="divider" />
    <p class="note">The customer's address will be released immediately after payment is confirmed.</p>
  `);

  await sendEmail({
    to: params.to,
    subject: `Accepted — pay your introduction fee to unlock customer details`,
    html,
  });
}
