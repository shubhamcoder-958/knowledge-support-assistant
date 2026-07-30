import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";

import { mockKnowledgeBaseArticles } from "../../../../lib/mock-data";
import { buildFallbackResult } from "../../../../lib/agent-fallback";

dotenv.config();

/* -------------------------------------------------------------------------- */
/*                               Gemini Client                                */
/* -------------------------------------------------------------------------- */

const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

const genAI = geminiApiKey
  ? new GoogleGenerativeAI(geminiApiKey)
  : null;

/* -------------------------------------------------------------------------- */
/*                              Ticket Validation                             */
/* -------------------------------------------------------------------------- */

const TicketInputSchema = z.object({
  id: z.string(),

  title: z
    .string()
    .min(5)
    .max(150),

  customer_type: z.enum([
    "Free",
    "Pro",
    "Enterprise",
  ]),

  product_area: z.enum([
    "Billing",
    "Auth",
    "Dashboard",
    "API",
  ]),

  issue_description: z
    .string()
    .min(10),

  previous_communication: z
    .string()
    .nullable()
    .optional(),

  user_urgency: z
    .enum([
      "Low",
      "Medium",
      "High",
      "Urgent",
      "",
    ])
    .optional(),

  status: z
    .enum([
      "Open",
      "Under Review",
      "Escalated",
      "Closed",
    ])
    .optional(),
});

/* -------------------------------------------------------------------------- */
/*                          AI Output Validation                              */
/* -------------------------------------------------------------------------- */

const AgentOutputSchema = z.object({
  ai_category: z.string(),

  ai_suggested_urgency: z.enum([
    "Low",
    "Medium",
    "High",
    "Urgent",
  ]),

  confidence: z
    .number()
    .min(0)
    .max(100),

  missing_info_flags: z.array(z.string()),

  follow_up_questions: z.array(z.string()),

  drafted_response: z.string(),

  suggested_internal_action: z.object({
    action_type: z.enum([
      "REQUEST_CLARIFICATION",
      "ESCALATE_TECHNICAL_REVIEW",
      "CREATE_MOCK_BUG",
      "NO_ACTION",
    ]),

    description: z.string(),

    status: z.literal(
      "PENDING_APPROVAL"
    ),
  }),

  response_citations: z.array(z.string()),

  action_citations: z.array(z.string()),
});

/* -------------------------------------------------------------------------- */
/*                               Types                                         */
/* -------------------------------------------------------------------------- */

type Ticket = z.infer<
  typeof TicketInputSchema
>;

type KBArticle =
  (typeof mockKnowledgeBaseArticles)[number];

/* -------------------------------------------------------------------------- */
/*                            Keyword Scoring                                 */
/* -------------------------------------------------------------------------- */

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function getKeywordScore(
  query: string,
  haystack: string
) {
  const queryTokens = tokenize(query);
  const haystackTokens = tokenize(haystack);

  let score = 0;

  for (const token of queryTokens) {
    if (haystackTokens.includes(token)) {
      score += 3;
    }

    if (haystack.includes(token)) {
      score += 1;
    }
  }

  return score;
}

/* -------------------------------------------------------------------------- */
/*                         Knowledge Retrieval                                */
/* -------------------------------------------------------------------------- */

function getTopRelevantArticles(
  ticket: Ticket
): KBArticle[] {
  const searchQuery = [
    ticket.title,
    ticket.issue_description,
    ticket.product_area,
    ticket.customer_type,
    ticket.previous_communication ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const ranked = mockKnowledgeBaseArticles
    .map((article) => {
      const searchableText = [
        article.title,
        article.content,
        article.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return {
        article,
        score: getKeywordScore(
          searchQuery,
          searchableText
        ),
      };
    })

    // Remove irrelevant articles
    .filter((item) => item.score > 0)

    // Highest score first
    .sort(
      (a, b) => b.score - a.score
    )

    // Keep only top 3
    .slice(0, 3);

  return ranked.map(
    (item) => item.article
  );
}

/* -------------------------------------------------------------------------- */
/*                            Helper Utilities                                */
/* -------------------------------------------------------------------------- */

function cleanJsonResponse(
  text: string
) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function buildKnowledgeSummary(
  articles: KBArticle[]
) {
  if (!articles.length) {
    return "No relevant knowledge articles were found.";
  }

  return articles
    .map(
      (article) => `
ID: ${article.id}
Title: ${article.title}
Content: ${article.content}
Tags: ${article.tags.join(", ")}
`
    )
    .join("\n----------------------\n");
}

/* -------------------------------------------------------------------------- */
/*                      POST Handler Continues Below                          */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ticket = TicketInputSchema.parse(body);

    const relevantArticles = getTopRelevantArticles(ticket);

    /* ---------------------------------------------------------------------- */
    /*                         Gemini Not Configured                          */
    /* ---------------------------------------------------------------------- */

    if (!geminiApiKey || !genAI) {
      const fallbackResult = buildFallbackResult(
        ticket,
        relevantArticles.map((article) => ({
          id: article.id,
          title: article.title,
        }))
      );

      return NextResponse.json({
        ticket_id: ticket.id,
        relevant_articles: relevantArticles.map((article) => ({
          id: article.id,
          title: article.title,
        })),
        result: fallbackResult,
      });
    }

    /* ---------------------------------------------------------------------- */
    /*                             Prompt                                     */
    /* ---------------------------------------------------------------------- */

    const prompt = `
You are an INTERNAL AI CUSTOMER SUPPORT AGENT.

Your job is to assist a human support representative.

IMPORTANT RULES

- Never invent information.
- Only use the retrieved knowledge articles.
- If the KB does not contain enough information,
  clearly state that clarification is required.
- Never pretend a KB article exists.
- Never auto-resolve the ticket.
- Never auto-send the drafted response.
- Never auto-execute internal actions.

=====================================================

WORKFLOW

Step 1
Classify the issue into ONE category.

Possible categories

Authentication
Billing
Dashboard
API
Performance
General

-----------------------------------------------------

Step 2

Suggest urgency.

Possible values

Low
Medium
High
Urgent

-----------------------------------------------------

Step 3

Determine the most important missing information.

Return ONLY information actually needed.

Examples

Browser

Operating System

Error Screenshot

Exact Error Message

Account ID

-----------------------------------------------------

Step 4

Generate follow-up questions.

Rules

- Ask questions ONLY for missing information.

- If nothing is missing,
  return an empty array.

-----------------------------------------------------

Step 5

Draft a professional customer response.

Rules

- Use ONLY KB articles.

- Never make assumptions.

- Mention clarification when required.

-----------------------------------------------------

Step 6

Suggest EXACTLY ONE internal action.

Allowed values

REQUEST_CLARIFICATION

ESCALATE_TECHNICAL_REVIEW

CREATE_MOCK_BUG

NO_ACTION

Status must always be

PENDING_APPROVAL

-----------------------------------------------------

Step 7

Return KB IDs used for

response_citations

-----------------------------------------------------

Step 8

Return KB IDs used for

action_citations

-----------------------------------------------------

Step 9

Return confidence score

0-100

Confidence Guide

95-100
Strong KB match

80-94
Good evidence

60-79
Partial evidence

Below 60
Limited evidence

=====================================================

Ticket

${JSON.stringify(ticket, null, 2)}

=====================================================

Retrieved Knowledge Articles

${buildKnowledgeSummary(relevantArticles)}

=====================================================

Return VALID JSON ONLY.

No markdown.

No explanation.

No code fences.
`;

    /* ---------------------------------------------------------------------- */
    /*                           Candidate Models                             */
    /* ---------------------------------------------------------------------- */

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
    ];

    let responseText = "";
    let lastError: unknown;

    /* ---------------------------------------------------------------------- */
    /*                          Model Retry Loop                              */
    /* ---------------------------------------------------------------------- */

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,

          generationConfig: {
            temperature: 0.2,

            topP: 0.9,

            responseMimeType: "application/json",

            responseSchema: {
              type: SchemaType.OBJECT,

              properties: {
                ai_category: {
                  type: SchemaType.STRING,
                },

               ai_suggested_urgency: {
  type: SchemaType.STRING,
  format: "enum",
  enum: ["Low", "Medium", "High", "Urgent"],
},

                confidence: {
                  type: SchemaType.NUMBER,
                },

                missing_info_flags: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.STRING,
                  },
                },

                follow_up_questions: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.STRING,
                  },
                },

                drafted_response: {
                  type: SchemaType.STRING,
                },

                suggested_internal_action: {
                  type: SchemaType.OBJECT,

                  properties: {
                   action_type: {
  type: SchemaType.STRING,
  format: "enum",
  enum: [
    "REQUEST_CLARIFICATION",
    "ESCALATE_TECHNICAL_REVIEW",
    "CREATE_MOCK_BUG",
    "NO_ACTION",
  ],
},

                    

                    description: {
                      type: SchemaType.STRING,
                    },

                    status: {
  type: SchemaType.STRING,
  format: "enum",
  enum: ["PENDING_APPROVAL"],
},
},              
                  

                  required: [
                    "action_type",
                    "description",
                    "status",
                  ],
                },

                response_citations: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.STRING,
                  },
                },

                action_citations: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.STRING,
                  },
                },
              },

              required: [
                "ai_category",
                "ai_suggested_urgency",
                "confidence",
                "missing_info_flags",
                "follow_up_questions",
                "drafted_response",
                "suggested_internal_action",
                "response_citations",
                "action_citations",
              ],
            },
          },
        });

        const result =
          await model.generateContent(prompt);

        responseText = cleanJsonResponse(
          result.response.text()
        );

        if (responseText) {
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!responseText) {
      throw (
        lastError ??
        new Error("Gemini request failed.")
      );
    }

    // -------- Part 3 continues from here --------
        /* ---------------------------------------------------------------------- */
    /*                    Parse & Validate Gemini Response                     */
    /* ---------------------------------------------------------------------- */

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", parseError);

      throw new Error("Gemini returned invalid JSON.");
    }

    const parsed = AgentOutputSchema.parse(parsedJson);

    /* ---------------------------------------------------------------------- */
    /*                    Validate Citation References                         */
    /* ---------------------------------------------------------------------- */

    const availableKbIds = new Set(
      relevantArticles.map((article) => article.id)
    );

    parsed.response_citations = parsed.response_citations.filter((id) =>
      availableKbIds.has(id)
    );

    parsed.action_citations = parsed.action_citations.filter((id) =>
      availableKbIds.has(id)
    );

    /* ---------------------------------------------------------------------- */
    /*                      Normalize Confidence Score                         */
    /* ---------------------------------------------------------------------- */

    parsed.confidence = Math.max(
      0,
      Math.min(100, Math.round(parsed.confidence))
    );

    /* ---------------------------------------------------------------------- */
    /*                  Ensure Follow-up Questions Exist                       */
    /* ---------------------------------------------------------------------- */

    if (
      parsed.missing_info_flags.length > 0 &&
      parsed.follow_up_questions.length === 0
    ) {
      parsed.follow_up_questions = parsed.missing_info_flags.map(
        (item) => `Could you please provide your ${item.toLowerCase()}?`
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                  Validate Internal Action Description                   */
    /* ---------------------------------------------------------------------- */

    if (
      parsed.suggested_internal_action.action_type === "NO_ACTION" &&
      parsed.suggested_internal_action.description.trim().length === 0
    ) {
      parsed.suggested_internal_action.description =
        "No additional internal action is required based on the available information.";
    }

    /* ---------------------------------------------------------------------- */
    /*                    Build Human Readable Summary                         */
    /* ---------------------------------------------------------------------- */

    const summary = {
      category: parsed.ai_category,
      urgency: parsed.ai_suggested_urgency,
      confidence: parsed.confidence,
      retrieved_articles: relevantArticles.length,
      missing_information_count:
        parsed.missing_info_flags.length,
      follow_up_questions_count:
        parsed.follow_up_questions.length,
      internal_action:
        parsed.suggested_internal_action.action_type,
    };

    /* ---------------------------------------------------------------------- */
    /*                           Successful Response                           */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,

      ticket_id: ticket.id,

      summary,

      relevant_articles: relevantArticles.map((article) => ({
        id: article.id,
        title: article.title,
        tags: article.tags,
      })),

      result: parsed,
    });
  } catch (error) {
    console.error("process-ticket error", error);

    /* ---------------------------------------------------------------------- */
    /*                          Zod Validation Errors                          */
    /* ---------------------------------------------------------------------- */

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid ticket payload or malformed AI response.",
          details: error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                       Gemini Authentication Errors                      */
    /* ---------------------------------------------------------------------- */

    if (
      error instanceof Error &&
      /api.?key|API_KEY|GEMINI|permission|unauthorized|authentication/i.test(
        error.message
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is missing or invalid.",
        },
        {
          status: 500,
        }
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                          Rate Limit Handling                            */
    /* ---------------------------------------------------------------------- */

    if (
      error instanceof Error &&
      /429|quota|rate.?limit/i.test(error.message)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini rate limit exceeded. Please try again shortly.",
        },
        {
          status: 429,
        }
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                            Invalid JSON                                 */
    /* ---------------------------------------------------------------------- */

    if (
      error instanceof Error &&
      /invalid json/i.test(error.message)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The AI returned an invalid JSON response.",
        },
        {
          status: 502,
        }
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                              Generic Error                              */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process support ticket.",
        message:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}
