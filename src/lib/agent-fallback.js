function buildFallbackResult(ticket, relevantArticles = []) {
  const urgency = ticket.user_urgency === 'Urgent' || ticket.user_urgency === 'High' ? 'High' : 'Medium';
  const missingInfoFlags = [
    'Screenshot of the affected billing or auth screen',
    'Confirmation of the account email or contact change',
  ].filter((flag, index) => (ticket.product_area === 'Billing' ? index === 0 || index === 1 : true));

  const fallbackDraft = [
    `Thanks for reaching out about ${ticket.title.toLowerCase()}.`,
    `I reviewed the issue details and will help determine the next support step.`,
    `If this is still happening, please share a screenshot and confirm the account email or contact change so we can verify the issue quickly.`,
  ].join(' ');

  return {
    ai_category: ticket.product_area || 'General Support',
    ai_suggested_urgency: urgency,
    missing_info_flags: missingInfoFlags,
    drafted_response: fallbackDraft,
    suggested_internal_action: {
      action_type: 'Follow up with customer',
      description: 'Request the missing screenshot and confirmation details before escalating the ticket.',
      status: 'PENDING_APPROVAL',
    },
    cited_sources: relevantArticles.map((article) => article.title),
  };
}

module.exports = { buildFallbackResult };
