# Knowledge-Grounded Customer Support Assistant

An internal AI-powered customer support workspace built with Next.js, TypeScript, Tailwind CSS, and Google Gemini.

The application assists support agents by analyzing customer tickets, retrieving relevant knowledge base articles, drafting responses, and recommending internal actions while ensuring that every AI-generated decision requires human approval.

---

## Features

### Ticket Management

- Create and edit support tickets
- Customer Type
  - Free
  - Pro
  - Enterprise
- Product Area
  - Billing
  - Authentication
  - Dashboard
  - API
- Previous communication
- User-selected urgency
- Ticket status management

---

### AI Workflow

The Gemini-powered workflow performs the following:

- Issue classification
- Suggested urgency prediction
- Knowledge-base retrieval
- Missing information detection
- Follow-up question generation
- Knowledge-grounded response drafting
- Internal action recommendation
- Citation of knowledge sources
- Confidence scoring

The AI never sends responses or executes actions automatically.

---

### Human-in-the-loop Review

Support agents can:

- Inspect retrieved knowledge articles
- Edit AI-generated responses
- Approve or reject responses
- Approve or reject suggested actions
- Update ticket status
- Review decision history
- Review communication history

---

## Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Google Gemini API
- Zod
- Lucide Icons

---

## Project Structure

```
app/
api/
components/
lib/
types/
public/
```

---

## Installation

```bash
git clone https://github.com/shubhamcoder-958/knowledge-support-assistant.git

cd knowledge-support-assistant

npm install
```

Create a `.env.local`

```env
GEMINI_API_KEY=your_api_key
```

Run locally

```bash
npm run dev
```

---

## Architecture

```
Support Ticket

↓

Gemini AI Agent

↓

Knowledge Retrieval

↓

Issue Classification

↓

Response Draft

↓

Human Review

↓

Approve / Reject

↓

Ticket History
```

---

## Completed Scope

- AI ticket classification
- Suggested urgency
- Knowledge retrieval
- Missing information detection
- Follow-up question generation
- Draft response generation
- Internal action recommendation
- Citation support
- Human approval workflow
- Ticket status updates
- Communication history
- Decision history

---

## Intentionally Excluded

- Authentication
- Database persistence
- Email sending
- Real ticketing integrations
- Production search engine
- Vector database

These were excluded to keep the project focused on the assignment requirements.

---

## Testing

Test using the following example.

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
Unable to login after resetting password.
```

Urgency

```
High
```

---

## Known Limitations

- Uses a mock knowledge base
- No database persistence
- No user authentication
- No vector embeddings
- No streaming AI responses

---

## Deployment

Deploy using Vercel.

Required environment variables

```
GEMINI_API_KEY
```

Repository

https://github.com/shubhamcoder-958/knowledge-support-assistant
