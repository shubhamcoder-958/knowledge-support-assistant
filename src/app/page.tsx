"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  PencilLine,
  BookOpen,
  History,
  Sparkles,
  Filter,
  X,
} from "lucide-react";

type TicketStatus = "Open" | "Under Review" | "Escalated" | "Closed";
type TabKey = "Details" | "Copilot Draft" | "Sources" | "Audit History";

type TicketItem = {
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

const initialTickets: TicketItem[] = [
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
      { id: "KB-102", title: "Billing Email Update Policy", relevance: "High" },
      { id: "KB-104", title: "Invoice Portal FAQ", relevance: "Medium" },
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

const statusOptions: TicketStatus[] = ["Open", "Under Review", "Escalated", "Closed"];
const tabs: TabKey[] = ["Details", "Copilot Draft", "Sources", "Audit History"];

function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatSourceId(sourceId: string) {
  const normalized = sourceId.trim();
  if (/^kb[-_]?/i.test(normalized)) {
    return normalized.replace(/^kb[-_]?/i, "KB-").toUpperCase();
  }
  return normalized.startsWith("KB-") ? normalized : `KB-${normalized}`;
}

export default function HomePage() {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(initialTickets[0].id);
  const [activeTab, setActiveTab] = useState<TabKey>("Details");
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(initialTickets[0].status);
  const [draft, setDraft] = useState(initialTickets[0].draftedResponse);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await fetch("/api/tickets");
        if (!response.ok) return;
        const payload = await response.json();
        if (Array.isArray(payload.tickets) && payload.tickets.length) {
          setTickets(payload.tickets);
          setSelectedTicketId(payload.tickets[0].id);
          setDraft(payload.tickets[0].draftedResponse);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadTickets();
  }, []);

  const persistTickets = async (nextTickets: TicketItem[]) => {
    setTickets(nextTickets);
    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickets: nextTickets }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0],
    [selectedTicketId, tickets]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.status === selectedStatus);
  }, [selectedStatus, tickets]);

  const updateTicket = (ticketId: string, updater: (ticket: TicketItem) => TicketItem) => {
    setTickets((current) => {
      const nextTickets = current.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket));
      void persistTickets(nextTickets);
      return nextTickets;
    });
  };

  const handleStatusChange = (nextStatus: TicketStatus) => {
    updateTicket(selectedTicket.id, (ticket) => ({
      ...ticket,
      status: nextStatus,
      history: [...ticket.history, { label: `Status changed to ${nextStatus}`, time: getTimestamp() }],
    }));
  };

  const handleTicketFieldChange = <K extends keyof Pick<TicketItem, "customerType" | "productArea" | "userUrgency" | "issueDescription" | "previousCommunication">>(
    field: K,
    value: TicketItem[K]
  ) => {
    updateTicket(selectedTicket.id, (ticket) => ({
      ...ticket,
      [field]: value,
    } as TicketItem));
  };

  const handleAction = (message: string, historyLabel?: string) => {
    setLoading(true);
    setTimeout(() => {
      if (historyLabel) {
        updateTicket(selectedTicket.id, (ticket) => ({
          ...ticket,
          history: [...ticket.history, { label: historyLabel, time: getTimestamp() }],
        }));
      }
      setToast(message);
      setLoading(false);
    }, 700);
  };

  const handleRunAgent = async () => {
    setLoading(true);
    setToast(null);

    try {
      const response = await fetch("/api/agent/process-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTicket.id,
          title: selectedTicket.title,
          customer_type: selectedTicket.customerType,
          product_area: selectedTicket.productArea,
          issue_description: selectedTicket.issueDescription,
          previous_communication: selectedTicket.previousCommunication || null,
          user_urgency: selectedTicket.userUrgency,
          status: selectedTicket.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Agent request failed");
      }

      const data = await response.json();
      const result = data.result;

      updateTicket(selectedTicket.id, (ticket) => ({
        ...ticket,
        status: "Under Review",
        aiSuggestedUrgency: result.ai_suggested_urgency ?? ticket.aiSuggestedUrgency,
        draftedResponse: result.drafted_response ?? ticket.draftedResponse,
        missingInfoFlags: result.missing_info_flags?.length ? result.missing_info_flags : ticket.missingInfoFlags,
        followUpQuestions: result.missing_info_flags?.length
          ? result.missing_info_flags.map((flag: string) => `Please share ${flag.toLowerCase()}`)
          : ticket.followUpQuestions,
        suggestedAction: {
          title: result.suggested_internal_action?.action_type ?? ticket.suggestedAction.title,
          description: result.suggested_internal_action?.description ?? ticket.suggestedAction.description,
          status: "PENDING_APPROVAL",
        },
        citedSources: result.cited_sources?.length
          ? result.cited_sources.map((source: string, index: number) => ({
              id: `KB-${102 + index}`,
              title: source,
              relevance: index === 0 ? "High" : "Medium",
            }))
          : ticket.citedSources,
        history: [
          ...ticket.history,
          { label: "AI agent refreshed the draft and sources", time: getTimestamp() },
        ],
      }));

      setDraft(result.drafted_response ?? selectedTicket.draftedResponse);
      setActiveTab("Copilot Draft");
      setToast("AI draft and sources updated");
    } catch (error) {
      console.error(error);
      setToast("Unable to reach the AI agent right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40 lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/95 p-4 lg:w-96 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Support Workspace</p>
              <h1 className="text-xl font-semibold">Tickets</h1>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300">
              {tickets.length} open
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/70 px-3 py-2 text-sm text-slate-300">
            <Filter size={16} />
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as TicketStatus)}
              className="w-full bg-transparent outline-none"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status} className="bg-slate-900 text-slate-100">
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filteredTickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                No tickets in this status.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isActive = ticket.id === selectedTicket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setDraft(ticket.draftedResponse);
                      setActiveTab("Details");
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isActive
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-800/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200">
                        {ticket.customerType}
                      </span>
                      <span className="rounded-full bg-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200">
                        {ticket.productArea}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-100">{ticket.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={12} /> {ticket.userUrgency}
                      </span>
                      <span className="rounded-full px-2 py-1 text-[11px] font-medium text-slate-300">
                        {ticket.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex-1 p-4 md:p-6">
          <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-800/60 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200">
                    {selectedTicket.customerType}
                  </span>
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200">
                    {selectedTicket.productArea}
                  </span>
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                    User: {selectedTicket.userUrgency}
                  </span>
                  <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                    AI: {selectedTicket.aiSuggestedUrgency}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white">{selectedTicket.title}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunAgent}
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950"
                >
                  Run AI Agent
                </button>
                <label className="text-sm text-slate-400">Status</label>
                <select
                  value={selectedTicket.status}
                  onChange={(event) => handleStatusChange(event.target.value as TicketStatus)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-slate-900">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  activeTab === tab
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Details" && (
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquareText size={18} className="text-cyan-400" />
                  <h3 className="font-semibold">Ticket Details</h3>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    <span className="mb-1 block">Customer / User Type</span>
                    <select
                      value={selectedTicket.customerType}
                      onChange={(event) => handleTicketFieldChange("customerType", event.target.value as TicketItem["customerType"])}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="Free">Free</option>
                      <option value="Pro">Pro</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </label>

                  <label className="text-sm text-slate-300">
                    <span className="mb-1 block">Product Area</span>
                    <select
                      value={selectedTicket.productArea}
                      onChange={(event) => handleTicketFieldChange("productArea", event.target.value as TicketItem["productArea"])}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="Billing">Billing</option>
                      <option value="Auth">Auth</option>
                      <option value="Dashboard">Dashboard</option>
                      <option value="API">API</option>
                    </select>
                  </label>

                  <label className="text-sm text-slate-300 md:col-span-2">
                    <span className="mb-1 block">Issue Description</span>
                    <textarea
                      value={selectedTicket.issueDescription}
                      onChange={(event) => handleTicketFieldChange("issueDescription", event.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>

                  <label className="text-sm text-slate-300 md:col-span-2">
                    <span className="mb-1 block">Previous Communication</span>
                    <textarea
                      value={selectedTicket.previousCommunication}
                      onChange={(event) => handleTicketFieldChange("previousCommunication", event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>

                  <label className="text-sm text-slate-300">
                    <span className="mb-1 block">Optional User Urgency</span>
                    <select
                      value={selectedTicket.userUrgency}
                      onChange={(event) => handleTicketFieldChange("userUrgency", event.target.value as TicketItem["userUrgency"])}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="">Not set</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-cyan-400" />
                  <h3 className="font-semibold">AI Summary</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-400" /> Suggested urgency is {selectedTicket.aiSuggestedUrgency}.</li>
                  <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-400" /> Category is likely {selectedTicket.productArea} support.</li>
                  <li className="flex gap-2"><Clock3 size={16} className="mt-0.5 text-amber-400" /> Follow-up questions are ready.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "Copilot Draft" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <PencilLine size={18} className="text-cyan-400" />
                  <h3 className="font-semibold">Drafted Customer Response</h3>
                </div>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={7}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none ring-0"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAction("Draft approved and queued for review", "Draft approved and queued for review")}
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white"
                  >
                    Approve & Send
                  </button>
                  <button
                    onClick={() => handleAction("Draft saved", "Draft saved")}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100"
                  >
                    Save Draft Edits
                  </button>
                  <button
                    onClick={() => handleAction("Draft rejected", "Draft rejected")}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    Reject Draft
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                  <h3 className="mb-3 font-semibold">Missing Information Flags</h3>
                  <div className="space-y-2">
                    {selectedTicket.missingInfoFlags.map((flag) => (
                      <div key={flag} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                        {flag}
                      </div>
                    ))}
                  </div>

                  <h3 className="mt-4 mb-3 font-semibold">Suggested Follow-up Questions</h3>
                  <div className="space-y-2">
                    {selectedTicket.followUpQuestions.map((question) => (
                      <div key={question} className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
                        {question}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                  <h3 className="mb-3 font-semibold">Proposed Internal Action</h3>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                    <p className="text-sm font-semibold text-cyan-200">{selectedTicket.suggestedAction.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{selectedTicket.suggestedAction.description}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleAction("Action approved", "Internal action approved")}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white"
                      >
                        Approve Action
                      </button>
                      <button
                        onClick={() => handleAction("Action rejected", "Internal action rejected")}
                        className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white"
                      >
                        Reject Action
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Sources" && (
            <div className="grid gap-4 md:grid-cols-2">
              {selectedTicket.citedSources.map((source) => (
                <div key={source.id} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen size={16} className="text-cyan-400" />
                    <h3 className="font-semibold">{formatSourceId(source.id)}: {source.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">Knowledge base reference</p>
                  <div className="mt-3 inline-flex rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">
                    Relevance: {source.relevance}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Audit History" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <History size={18} className="text-cyan-400" />
                <h3 className="font-semibold">Decision Timeline</h3>
              </div>
              <div className="space-y-3">
                {selectedTicket.history.map((entry, index) => (
                  <div key={entry.time + index} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">{entry.label}</p>
                      <p className="text-sm text-slate-400">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            Updating workspace...
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-lg">
          <CheckCircle2 size={16} /> {toast}
          <button onClick={() => setToast(null)} className="ml-2 rounded-full p-1 hover:bg-emerald-500/20">
            <X size={14} />
          </button>
        </div>
      )}
    </main>
  );
}
