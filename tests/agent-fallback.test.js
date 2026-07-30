const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFallbackResult } = require('../src/lib/agent-fallback.js');

test('buildFallbackResult returns a complete agent result for a ticket', () => {
  const ticket = {
    id: 'ticket-001',
    title: 'Billing email update issue',
    customer_type: 'Free',
    product_area: 'Billing',
    issue_description: 'I cannot update my billing email on the invoice portal.',
    previous_communication: 'Asked for a screenshot.',
    user_urgency: 'High',
    status: 'Open',
  };

  const articles = [
    { id: 'kb-1', title: 'Billing email update policy' },
    { id: 'kb-2', title: 'Invoice portal FAQ' },
  ];

  const result = buildFallbackResult(ticket, articles);

  assert.equal(result.ai_category, 'Billing');
  assert.equal(result.ai_suggested_urgency, 'High');
  assert.ok(Array.isArray(result.missing_info_flags));
  assert.ok(result.drafted_response.includes('billing email'));
  assert.equal(result.suggested_internal_action.status, 'PENDING_APPROVAL');
  assert.deepEqual(result.cited_sources, ['Billing email update policy', 'Invoice portal FAQ']);
});
