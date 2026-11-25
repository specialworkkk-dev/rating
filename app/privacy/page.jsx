import LegalPage, { ContactEmail } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

const P = LEGAL.provider;

export const metadata = {
  title: `Privacy Policy · ${P}`,
  description: `How ${P} collects, uses and protects information from customers and shop owners.`,
};

const sections = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          {P} gives shops a rating page that customers open by scanning a QR code or tapping an NFC card. Each shop that uses {P} is
          called “the shop” here. For questions about this policy, to use your rights, or to make a complaint, email <ContactEmail />.
        </p>
      </>
    ),
  },
  {
    id: "rating",
    title: "What we collect when you rate a shop",
    body: (
      <>
        <p>You do not need an account. When you open a shop’s rating page and give a rating, we store:</p>
        <ul>
          <li>the stars you gave, the shop, and the date and time;</li>
          <li>whether you opened the page from a QR code or an NFC card, and whether you tapped the button to review on Google;</li>
          <li>
            a <b>random device code</b>, kept in a cookie and in your browser’s storage. It lets you change your rating later
            instead of adding a second one, and stops one phone from rating the same shop many times;
          </li>
          <li>
            a <b>scrambled code made from your internet address</b> (a one-way, keyed hash). We never store the address itself. It
            helps us spot floods of fake ratings coming from one network;
          </li>
          <li>your browser type (for example “Chrome on Android”), to spot automated abuse.</li>
        </ul>
        <p>We also count each time the page is opened, without any device code or internet address.</p>
      </>
    ),
  },
  {
    id: "feedback",
    title: "What we collect when you send feedback",
    body: (
      <>
        <p>If you choose to send the shop a private message, we store:</p>
        <ul>
          <li>your message and the stars you gave;</li>
          <li>
            your <b>name and phone number, only if you type them</b>. Both are optional. Leave them out and your message stays
            anonymous to the shop;
          </li>
          <li>the same device code and scrambled internet-address code as above, to stop spam.</li>
        </ul>
        <p>By adding your name or phone number, you agree that the shop can see them and contact you about your feedback.</p>
      </>
    ),
  },
  {
    id: "not",
    title: "What we do not collect",
    body: (
      <ul>
        <li>No location, contacts, photos or Google account details.</li>
        <li>No advertising or tracking cookies, and no selling or renting of your information to anyone.</li>
        <li>
          Reviews you write on Google are written on Google’s own website, not ours. Google’s privacy policy applies there. We only
          know that you tapped the button.
        </li>
      </ul>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To show the shop its ratings and the feedback sent to it, so it can improve.</li>
        <li>
          If you left your phone number, the shop may call or WhatsApp you <b>only about your feedback</b>. Shops agree to this in our
          Terms and may not use it for advertising.
        </li>
        <li>To keep the service fair: one rating per phone, and spotting fake or automated ratings.</li>
        <li>To count totals (for example “120 ratings this month”), which contain no personal details.</li>
      </ul>
    ),
  },
  {
    id: "share",
    title: "Who can see it",
    body: (
      <ul>
        <li>
          <b>The shop’s owner</b> (and anyone they let use their login) sees the ratings and feedback for their own shop only,
          including any name and phone number you added.
        </li>
        <li>
          <b>The {P} team</b>, only to run the service, help shops, and investigate abuse.
        </li>
        <li>
          <b>Our service providers</b>, who store the data for us under contract: Vercel (website hosting) and MongoDB Atlas
          (database). Both keep the data in Mumbai, India.
        </li>
        <li>Government authorities, only when the law requires it.</li>
      </ul>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <ul>
        <li>
          <b>Ratings, page opens and Google taps:</b> deleted automatically after about {LEGAL.rawKeepMonths} months. After that only
          totals with no personal details remain.
        </li>
        <li>
          <b>Feedback messages</b> (with any name and phone number): kept until the shop deletes them, until you ask us to delete
          them, or until the shop stops using {P}.
        </li>
        <li>
          <b>The device cookie</b> expires about 400 days after your last rating. You can clear it at any time in your browser.
        </li>
        <li>Short-lived anti-spam records are deleted automatically within a day.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under India’s Digital Personal Data Protection Act, 2023, you can ask us to:</p>
        <ul>
          <li>tell you what personal data we hold about you and how it is used;</li>
          <li>correct or complete it;</li>
          <li>delete it, including withdrawing your consent for the name and phone number you shared;</li>
          <li>look into a complaint (grievance) about how we handled it;</li>
          <li>let someone you name use these rights for you if you die or cannot act yourself.</li>
        </ul>
        <p>
          Email <ContactEmail /> with the shop’s name, roughly when you rated or sent feedback, and the phone number you used (if
          any), so we can find it. We reply within {LEGAL.replyDays} days. If you are not satisfied with our answer, you can complain
          to the Data Protection Board of India.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Rating pages are meant for adults. If you are under 18, please do not add your name or phone number to feedback. A parent or
        guardian who thinks a child has shared personal details can ask us to delete them.
      </p>
    ),
  },
  {
    id: "owners",
    title: "Shop owners",
    body: (
      <>
        <p>
          For shop owners we store your name, email address, your shop’s details (name, logo, Google listing ID, plan and payments),
          and your password in a scrambled form that nobody can read, not even us. A login cookie keeps you signed in.
        </p>
        <p>
          We use this to run your account, show your dashboard, and contact you about your plan. We keep it while your account is
          open, and delete it within 90 days of the account being closed, unless the law requires us to keep billing records longer.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and browser storage",
    body: (
      <ul>
        <li>
          <b>Device cookie</b> (customers): the random device code described above.
        </li>
        <li>
          <b>Login cookies</b> (shop owners and our team): keep you signed in.
        </li>
        <li>
          <b>Browser storage</b>: a copy of the device code, and small preferences such as hiding the “install app” banner.
        </li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        All pages use encrypted connections (HTTPS). Passwords and internet addresses are stored only in scrambled form, each shop
        can see only its own data, and access to the database is limited to the people who run {P}. No system is perfectly secure:
        if a breach affects your data, we will tell you and the Data Protection Board as the law requires.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <p>
        If we change this policy, we update the date at the top. For important changes we will also tell shop owners on their
        dashboard. Questions, requests and complaints: <ContactEmail />.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what information ${P} collects when you rate a shop or send it feedback, and when a shop owner uses ${P}, how it is used, and the choices you have.`}
      summary={[
        "No account needed to rate. Your name and phone number are always optional.",
        "Your feedback goes only to that shop. We never sell your information or show ads.",
        `Ratings and visit records are deleted after about ${LEGAL.rawKeepMonths} months.`,
        "Your data is stored in India, and you can ask us to see or delete it at any time.",
      ]}
      sections={sections}
      other={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
