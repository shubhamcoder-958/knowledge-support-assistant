import { promises as fs } from "fs";
import path from "path";

export type TicketStatus = "Open" | "Under Review" | "Escalated" | "Closed";

export type TicketItem = {
  id: string;
  title: string;
  customerType: "Free" | "Pro" | "Enterprise";
  productArea: "Billing" | "Auth" | "Dashboard" | "API";
  userUrgency: "Low" | "Medium" | "High" | "Urgent" | "";
  aiSuggestedUrgency: "Low" | "Medium" | "High" | "Urgent";
  status: TicketStatus;
  issueDescription: string;
  previousCommunication: string;
  draftedResponse: string;
  missingInfoFlags: string[];
  followUpQuestions: string[];
  suggestedAction: {
    title: string;
    description: string;
    status: "PENDING_APPROVAL";
  };
  citedSources: Array<{ id: string; title: string; relevance: string }>;
  history: Array<{ label: string; time: string }>;
};

const storeDir = path.join(process.cwd(), "data");
const storeFilePath = path.join(storeDir, "tickets.json");

export function createSeedTickets(): TicketItem[] {
  return [
    {
      id: "ticket-001",
      title: "Unable to update billing email on invoice portal",
      customerType: "Free",
      productArea: "Billing",
      userUrgency: "High",
      aiSuggestedUrgency: "High",
      status: "Open",
      issueDescription:
        "Customer cannot update the billing email address tied to invoices after changing their company contact.",
      previousCommunication:
        "Asked for a screenshot of the billing tab but none was provided.",
      draftedResponse:
        "Thanks for flagging this. I can help you update the billing email address and confirm the change in the billing profile.",
      missingInfoFlags: ["Billing screenshot", "Account identifier"],
      followUpQuestions: [
        "Can you share the current billing email address on the account?",
        "Could you send a screenshot of the billing settings page?",
      ],
      suggestedAction: {
        title: "Request account verification",
        description:
          "Ask the customer to confirm the account email and billing contact before changing records.",
        status: "PENDING_APPROVAL",
      },
      citedSources: [
        { id: "kb-001", title: "Billing contact update guide", relevance: "High" },
        { id: "kb-004", title: "Invoice portal FAQ", relevance: "Medium" },
      ],
      history: [
        { label: "Draft approved by Agent", time: "4:30 PM" },
        { label: "Status changed to Open", time: "2:10 PM" },
      ],
    },
    {
      id: "ticket-002",
      title: "SSO login fails after password reset",
      customerType: "Pro",
      productArea: "Auth",
      userUrgency: "Urgent",
      aiSuggestedUrgency: "Urgent",
      status: "Under Review",
      issueDescription:
        "User is unable to sign in with SSO after resetting the password and receiving a verification email.",
      previousCommunication:
        "Customer mentioned the issue affects two team members.",
      draftedResponse:
        "I’m reviewing the login issue and will share the next support steps shortly.",
      missingInfoFlags: ["Device type", "Browser version"],
      followUpQuestions: [
        "What browser are you using when the issue happens?",
        "Is the issue happening on desktop, mobile, or both?",
      ],
      suggestedAction: {
        title: "Escalate to auth engineering",
        description:
          "Investigate recent password reset flow changes for SSO compatibility.",
        status: "PENDING_APPROVAL",
      },
      citedSources: [
        { id: "kb-002", title: "SSO troubleshooting steps", relevance: "High" },
        { id: "kb-005", title: "Password reset best practices", relevance: "Medium" },
      ],
      history: [
        { label: "Action requested by support lead", time: "3:15 PM" },
        { label: "Draft edited", time: "1:05 PM" },
      ],
    },
  ];
}

async function ensureStoreFile() {
  await fs.mkdir(storeDir, { recursive: true });

  try {
    await fs.access(storeFilePath);
  } catch {
    const seed = {
      tickets: createSeedTickets(),
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(storeFilePath, JSON.stringify(seed, null, 2));
  }
}

export async function readTickets(): Promise<TicketItem[]> {
  await ensureStoreFile();

  const contents = await fs.readFile(storeFilePath, "utf8");
  try {
    const parsed = JSON.parse(contents) as { tickets?: TicketItem[] };
    if (Array.isArray(parsed.tickets)) {
      return parsed.tickets as TicketItem[];
    }
  } catch {
    // fall back to seed data below
  }

  return createSeedTickets();
}

export async function writeTickets(tickets: TicketItem[]): Promise<TicketItem[]> {
  await ensureStoreFile();
  const payload = {
    tickets,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(storeFilePath, JSON.stringify(payload, null, 2));
  return tickets;
}

export async function updateTicket(ticket: TicketItem): Promise<TicketItem[]> {
  const existing = await readTickets();
  const nextTickets = existing.some((item) => item.id === ticket.id)
    ? existing.map((item) => (item.id === ticket.id ? ticket : item))
    : [...existing, ticket];

  return writeTickets(nextTickets);
}
