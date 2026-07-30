# Knowledge-Grounded Customer Support Assistant

An AI-powered internal customer support workspace built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Google Gemini AI**. The application assists support agents by analyzing customer support tickets, retrieving relevant knowledge base articles, drafting customer responses, and recommending internal actions while ensuring every AI-generated output is reviewed by a human before approval.

---

## 🚀 Live Demo

**Live Application:** https://YOUR-VERCEL-URL.vercel.app

**GitHub Repository:** https://github.com/shubhamcoder-958/knowledge-support-assistant

---

# Features

## Ticket Management

- Create and edit customer support tickets
- Customer Types
  - Free
  - Pro
  - Enterprise
- Product Areas
  - Billing
  - Authentication
  - Dashboard
  - API
- Optional urgency selection
- Previous communication history
- Ticket status management

---

## Gemini AI Workflow

The AI agent performs the complete support workflow:

- Classifies support issues
- Suggests ticket urgency
- Retrieves relevant knowledge base articles
- Identifies missing information
- Generates follow-up questions
- Drafts customer responses grounded in retrieved knowledge
- Suggests one internal action
- Provides citations for the drafted response
- Provides citations supporting the suggested internal action
- Returns a confidence score

The AI **never** sends responses or executes actions automatically.

---

## Human-in-the-Loop Workflow

Support agents remain in complete control.

The application allows agents to:

- Inspect retrieved knowledge sources
- View full knowledge articles
- Edit AI-generated responses
- Approve or reject drafted responses
- Approve or reject suggested internal actions
- Update ticket status
- Review audit history
- Review communication history

---

# Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Google Gemini API
- Zod
- Lucide React

---

# Project Structure

```
app/
 ├── api/
 │   ├── agent/
 │   └── tickets/
components/
lib/
public/
types/
```

---

# Architecture

```
Customer Ticket

        │

        ▼

Gemini AI Agent

        │

        ▼

Knowledge Retrieval

        │

        ▼

Issue Classification

        │

        ▼

Missing Information Detection

        │

        ▼

Follow-up Question Generation

        │

        ▼

Draft Response

        │

        ▼

Internal Action Recommendation

        │

        ▼

Human Review

        │

        ▼

Approve / Reject

        │

        ▼

Ticket History
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/shubhamcoder-958/knowledge-support-assistant.git

cd knowledge-support-assistant
```

Install dependencies

```bash
npm install
```

Create a `.env.local`

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Run locally

```bash
npm run dev
```

Build

```bash
npm run build
```

---

# Environment Variables

| Variable | Description |
|----------|-------------|
| GEMINI_API_KEY | Google Gemini API Key |

---

# Completed Scope

- AI issue classification
- Suggested urgency prediction
- Knowledge retrieval
- Missing information detection
- Follow-up question generation
- Knowledge-grounded customer response
- Internal action recommendation
- Citation support
- Confidence scoring
- Human approval workflow
- Ticket status management
- Audit history
- Communication history
- Responsive UI

---

# Intentionally Excluded

To keep the project focused on the assignment requirements, the following were intentionally excluded:

- User authentication
- Role-based permissions
- Database persistence
- Email integration
- External ticketing systems
- Vector database
- Semantic search
- Multi-agent orchestration

---

# Testing

## Sample Ticket

Customer Type

```
Pro
```

Product Area

```
Authentication
```

Issue

```
Unable to log in after resetting my password.
```

Previous Communication

```
Customer already cleared browser cache.
```

Urgency

```
High
```

---

# Known Limitations

- Uses a mock knowledge base
- Ticket data is stored in memory for demonstration purposes
- Data resets when the serverless function restarts
- No authentication
- No persistent database
- No vector search

---

# Deployment

The application is deployed on **Vercel**.

Required environment variable:

```env
GEMINI_API_KEY
```

---

# AI Safety

The AI is intentionally prevented from:

- Sending customer emails automatically
- Executing internal actions automatically
- Closing tickets automatically

All AI-generated content requires explicit human approval.

---

# Future Improvements

- PostgreSQL / MongoDB persistence
- Vector search using embeddings
- Authentication and RBAC
- Real ticketing integrations
- Streaming AI responses
- Knowledge base management
- Analytics dashboard
- Multi-language support

---

# Repository Requirements

Included in this repository:

- ✅ README.md
- ✅ AGENT_USAGE.md
- ✅ .env.example

No API keys, tokens, or secrets are committed.

---

Developed as part of the **Knowledge-Grounded Customer Support Assistant** mini-project assignment.
