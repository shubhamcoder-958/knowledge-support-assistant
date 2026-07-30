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
  citedSources: Array<{
    id: string;
    title: string;
    relevance: string;
  }>;
  history: Array<{
    label: string;
    time: string;
  }>;
};

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
        "Thanks for flagging this. I can help you update the billing email address and confirm the change.",
      missingInfoFlags: ["Billing screenshot", "Account identifier"],
      followUpQuestions: [
        "Can you share the current billing email?",
        "Can you upload a screenshot of the billing page?"
      ],
      suggestedAction: {
        title: "Request account verification",
        description:
          "Ask the customer to verify the account before making changes.",
        status: "PENDING_APPROVAL",
      },
      citedSources: [
        {
          id: "kb-001",
          title: "Billing contact update guide",
          relevance: "High",
        },
      ],
      history: [],
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
        "User cannot sign in after password reset.",
      previousCommunication:
        "Issue affects multiple users.",
      draftedResponse:
        "We are investigating the authentication issue.",
      missingInfoFlags: ["Browser", "Device"],
      followUpQuestions: [
        "Which browser are you using?",
        "Does this happen on another device?"
      ],
      suggestedAction: {
        title: "Escalate to engineering",
        description:
          "Request technical investigation.",
        status: "PENDING_APPROVAL",
      },
      citedSources: [
        {
          id: "kb-002",
          title: "SSO Troubleshooting",
          relevance: "High",
        },
      ],
      history: [],
    },
  ];
}

let tickets: TicketItem[] = createSeedTickets();

export async function readTickets(): Promise<TicketItem[]> {
  return tickets;
}

export async function writeTickets(
  updatedTickets: TicketItem[]
): Promise<TicketItem[]> {
  tickets = updatedTickets;
  return tickets;
}

export async function updateTicket(
  ticket: TicketItem
): Promise<TicketItem[]> {
  const index = tickets.findIndex((t) => t.id === ticket.id);

  if (index >= 0) {
    tickets[index] = ticket;
  } else {
    tickets.push(ticket);
  }

  return tickets;
}