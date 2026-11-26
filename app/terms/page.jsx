import Link from "next/link";
import LegalPage, { ContactEmail } from "@/components/LegalPage";
import { FAIR_RULES } from "@/lib/fairRules";
import { LEGAL, TOKEN_TERMS } from "@/lib/legal";

const P = LEGAL.provider;

export const metadata = {
  title: `Terms of Service · ${P}`,
  description: `The agreement between ${P} and the shops that use it: price, payment, refunds and fair-review rules.`,
};

const sections = [
  {
    id: "service",
    title: "The service",
    body: (
      <>
        <p>
          {P} gives your shop a rating page, QR posters and NFC links for it, and a dashboard showing your ratings and the private
          feedback customers send you. Every customer is offered the same button to review you on Google, whatever stars they give.
        </p>
        <p>
          These terms are an agreement between {P} (“we”) and the shop owner using it (“you”). By agreeing on your dashboard or
          using the service, you accept them. You confirm that you are at least 18 and allowed to act for the shop.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>We create your login. Keep your password private; you are responsible for everything done with your login, including by your staff.</li>
        <li>Tell us straight away at <ContactEmail /> if you think someone else has used your account.</li>
        <li>The details you give us (shop name, Google listing, contact email) must be correct and must be yours to use.</li>
      </ul>
    ),
  },
  {
    id: "price",
    title: "Price and payment",
    body: (
      <ul>
        <li>
          <b>Your price</b> is the monthly amount agreed with you when your shop is set up. It is shown on your dashboard. Prices
          include taxes only if we say so; GST is added where it applies.
        </li>
        <li>
          <b>Free trial:</b> new shops may get a free trial for the period agreed at setup. Nothing is charged during the trial.
        </li>
        <li>
          <b>Payment is in advance</b> for each month (or longer period you choose). Your dashboard shows the date your plan is paid
          until.
        </li>
        <li>
          <b>If a trial or paid period ends without payment,</b> your rating page pauses automatically and customers see a
          “service paused” message. Your data stays safe, and the page comes back as soon as payment is received.
        </li>
        <li>
          <b>Price changes:</b> we will tell you at least 15 days before. A new price applies from your next payment period, never to
          a period you have already paid for.
        </li>
      </ul>
    ),
  },
  {
    id: "refunds",
    title: "Refunds and cancelling",
    body: (
      <ul>
        <li>
          <b>First payment:</b> if you are not happy, email <ContactEmail /> within {LEGAL.refundDays} days of your first payment for
          a full refund of that payment.
        </li>
        <li>After that, payments are not refunded, including for unused days in a month.</li>
        <li>You can stop at any time by not renewing. Your page then pauses at the end of the period you have paid for.</li>
        <li>No refund is due if we stop your account because you broke these terms (see section 4 and section 10).</li>
      </ul>
    ),
  },
  {
    id: "fair",
    title: "Fair-review rules",
    body: (
      <>
        <p>
          Google does not allow fake, paid or filtered reviews. Breaking its rules can get your reviews removed or a warning shown on
          your Google profile. To protect you and every other shop on {P}, you and your staff must follow these rules:
        </p>
        <ul>
          {FAIR_RULES.map((r) => (
            <li key={r.title}>
              <b>{r.title}.</b> {r.text}
            </li>
          ))}
          <li>
            <b>No fake or bought ratings.</b> Never create ratings or reviews yourself, pay anyone to post them, or flood your page
            with ratings from your own devices or network.
          </li>
        </ul>
        <p>
          {P} itself shows every customer the same Google button and blocks owners from rating their own shop. If we see clear signs
          that the rules are being broken, we may remove the ratings involved, pause your page, or close your account.
        </p>
      </>
    ),
  },
  {
    id: "google",
    title: "Google",
    body: (
      <p>
        {P} is not part of Google and is not endorsed by Google. Customers decide whether to post a review and what to write. We do
        not promise any number of reviews, a particular rating, or any search ranking, and we are not responsible for Google’s
        decisions, such as removing reviews or restricting a business profile.
      </p>
    ),
  },
  {
    id: "data",
    title: "Customer feedback and personal data",
    body: (
      <>
        <p>
          Customers may give you their name and phone number with their feedback. When they do, you must:
        </p>
        <ul>
          <li>use those details <b>only to reply to that feedback</b>: no advertising, offers or bulk messages unless the customer separately agrees;</li>
          <li>keep them private, and not share them outside your shop;</li>
          <li>delete a customer’s feedback when they ask you to (you can do this from your Feedback page);</li>
          <li>follow India’s Digital Personal Data Protection Act, 2023 and other laws that apply to you.</li>
        </ul>
        <p>
          We handle all data as described in our{" "}
          <Link href="/privacy" className="font-medium text-brand-700 underline">
            Privacy Policy
          </Link>
          . Your ratings, feedback and settings belong to you; we use them only to provide the service
          {TOKEN_TERMS ? " and, as daily totals across all shops, for the public token burn described in “Review Booster Token”" : ""}.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "Acceptable use",
    body: (
      <ul>
        <li>Use {P} only for your own shop and only for lawful purposes.</li>
        <li>Do not try to break, overload or get around the service’s protections, or access other shops’ data.</li>
        <li>Do not copy, resell or rent the service to others without our written agreement.</li>
        <li>Logos and names you upload must be yours or used with permission.</li>
      </ul>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes to the service",
    body: (
      <p>
        We work to keep {P} running at all times, but we cannot promise it will never be interrupted, for example during
        maintenance or problems with our hosting providers. We may improve or change features; if a change takes away something
        important you pay for, we will tell you in advance.
      </p>
    ),
  },
  {
    id: "end",
    title: "Pausing and closing accounts",
    body: (
      <ul>
        <li>You can ask us to close your account at any time.</li>
        <li>
          We may pause or close your account if payment is not made, if you seriously or repeatedly break these terms, or if the law
          requires it. Where reasonable, we will warn you first and give you time to fix the problem.
        </li>
        <li>
          After an account is closed, we delete its ratings and feedback within 90 days, unless the law requires us to keep
          something longer. Ask us before closing if you want a copy.
        </li>
      </ul>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility",
    body: (
      <p>
        We provide {P} with reasonable care and skill. As far as the law allows, we are not responsible for indirect losses such
        as lost profit, lost customers or harm to reputation, and our total responsibility to you for any claim is limited to the
        amount you paid us in the 3 months before the claim. Nothing in these terms limits rights you have that cannot be limited
        by law.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. We will show the new date at the top and tell you on your dashboard. For important changes we
        will ask you to agree again before you continue; if you do not agree, you can stop using {P} and ask for your account to be
        closed.
      </p>
    ),
  },
  ...(TOKEN_TERMS
    ? [
        {
          id: "token",
          title: "Review Booster Token (RBT)",
          body: (
            <>
              <p>
                {P} has a digital token, the Review Booster Token (RBT), on BNB Smart Chain. Each day, the{" "}
                <b>total number of ratings across all shops</b> on {P} is used to set how many RBT are permanently removed
                (“burned”) from a public burn pool. Every burn can be checked by anyone on BscScan.
              </p>
              <ul>
                <li>
                  Only a single daily count is used. <b>No names, phone numbers, messages, devices or shop-level figures</b> are
                  shared or put on the blockchain.
                </li>
                <li>It does not change your service, your price, your figures or how your customers rate you.</li>
                <li>You are not asked to buy, hold or promote RBT, and it is not part of your plan or payment.</li>
                <li>RBT is not an investment offer from {P}, and no one is promised that its price will rise.</li>
              </ul>
            </>
          ),
        },
      ]
    : []),
  {
    id: "law",
    title: "Law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India, and any dispute will be handled by the courts in India. Please contact us
        first at <ContactEmail />: most problems can be solved quickly by talking.
      </p>
    ),
  },
  {
    id: "customers",
    title: "For customers rating a shop",
    body: (
      <p>
        Rating a shop is free and needs no account. Please rate honestly, only for shops you have actually visited, and do not send
        abusive or unlawful messages. We may block ratings or messages that are clearly fake, automated or abusive. How we handle
        your information is explained in our{" "}
        <Link href="/privacy" className="font-medium text-brand-700 underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms cover how shops use ${P}: your price and payments, refunds, the fair-review rules that protect your Google profile, and how you handle your customers’ details.`}
      summary={[
        "You pay the monthly price agreed with you, in advance. Your page pauses if a period ends unpaid.",
        `Your first payment can be refunded within ${LEGAL.refundDays} days. You can stop anytime by not renewing.`,
        "No fake, paid or filtered reviews: every customer is asked the same way.",
        "Customers’ names and phone numbers are only for replying to their feedback.",
      ]}
      sections={sections}
      other={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
