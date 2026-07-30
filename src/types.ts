export type CustomerType = "Free" | "Pro" | "Enterprise";
export type ProductArea = "Billing" | "Auth" | "Dashboard" | "API";
export type UserUrgency = "Low" | "Medium" | "High" | "Urgent";
export type TicketStatus = "Open" | "Under Review" | "Escalated" | "Closed";
export type ActionStatus = "Pending" | "Approved" | "Rejected";

export interface SuggestedInternalAction {
  action_type: string;
  description: string;
  status: ActionStatus;
}

export interface Ticket {
  id: string;
  title: string;
  customer_type: CustomerType;
  product_area: ProductArea;
  issue_description: string;
  previous_communication?: string | null;
  user_urgency: UserUrgency;
  status: TicketStatus;
  ai_suggested_urgency?: UserUrgency | null;
  ai_category?: string | null;
  missing_info_flags: string[];
  drafted_response?: string | null;
  suggested_internal_action?: SuggestedInternalAction | null;
  cited_sources: string[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export interface TicketAuditLog {
  id: string;
  ticket_id: string;
  action_taken: string;
  performed_by: string;
  timestamp: string;
}

export interface SeedData {
  tickets: Ticket[];
  knowledgeBaseArticles: KnowledgeBaseArticle[];
  ticketAuditLogs: TicketAuditLog[];
}
