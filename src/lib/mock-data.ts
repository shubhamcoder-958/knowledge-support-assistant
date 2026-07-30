export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export const mockKnowledgeBaseArticles: KnowledgeBaseArticle[] = [
  {
    id: "kb-001",
    title: "Billing contact update guide",
    category: "Billing",
    content:
      "Customers can update billing contact details from the billing settings page. If the change does not appear immediately, verify the account email and ensure the contact change is saved.",
    tags: ["billing", "contact", "profile"],
  },
  {
    id: "kb-002",
    title: "SSO troubleshooting steps",
    category: "Auth",
    content:
      "If SSO fails after a password reset, confirm the identity provider is reachable, verify the browser cookie policy, and retry from an incognito window.",
    tags: ["auth", "sso", "login"],
  },
  {
    id: "kb-003",
    title: "Dashboard widget troubleshooting",
    category: "Dashboard",
    content:
      "Blank widgets are often caused by stale browser cache or incompatible browser extensions. Check the browser console and verify the widget configuration.",
    tags: ["dashboard", "widgets", "troubleshooting"],
  },
  {
    id: "kb-004",
    title: "Invoice portal FAQ",
    category: "Billing",
    content:
      "Invoices can be viewed, downloaded, and shared from the invoice portal. If a generated PDF is blank, try a different browser or clear cached content.",
    tags: ["billing", "invoices", "pdf"],
  },
  {
    id: "kb-005",
    title: "API rate limit policy",
    category: "API",
    content:
      "Most API usage tiers include a default request quota. A 429 response indicates that the retry window is temporarily exceeded; reduce concurrency or retry later.",
    tags: ["api", "rate limit", "429"],
  },
];
