import React, { useState } from 'react';
import { Info, Send, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/format';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'Which customers have the highest overdue receivables?',
  'Summarize missed payment commitments this week.',
  'What is our estimated collection over the next 15 days?',
  'Which SKUs need urgent reordering?',
];

export const BusinessInsights: React.FC = () => {
  const { salesInvoices, commitments, products, customers, expenses } = useApp();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      role: 'assistant',
      text: 'Welcome to CollectFlow Demo Insights. Ask a question or click a suggested prompt below to inspect deterministic sample business summaries (real AI model inference is not active in this frontend prototype).',
    },
  ]);

  const overdueTotal = salesInvoices
    .filter((i) => i.status === 'Overdue')
    .reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
  const pendingCommitments = commitments
    .filter((c) => c.status === 'Pending' || c.status === 'Rescheduled')
    .reduce((s, c) => s + (c.promisedAmount - c.fulfilledAmount), 0);
  const lowStock = products.filter((p) => p.availableStock <= p.reorderLevel);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);

  const generateDemoReply = (q: string): string => {
    const lower = q.toLowerCase();
    if (lower.includes('overdue') || lower.includes('customer')) {
      return `Demo Summary: Total overdue customer receivables currently stand at ${formatINR(overdueTotal)}. Top overdue accounts are Mahalaxmi Hardware (INV-26-1035: ₹2,28,448) and Deccan Electrical Contractors (INV-26-1018: ₹1,71,176 balance, on credit hold).`;
    }
    if (lower.includes('missed') || lower.includes('commitment')) {
      return `Demo Summary: 1 commitment is marked Missed — Deccan Electrical Contractors promised ₹75,000 for 14/11/2026 on INV-26-1018. 1 commitment is Rescheduled (Mahalaxmi Hardware, ₹1,50,000 to 20/11/2026).`;
    }
    if (lower.includes('collection') || lower.includes('15 days') || lower.includes('estimated')) {
      return `Demo Estimate: Based on pending & rescheduled payment commitments (not actual receipts), ${formatINR(pendingCommitments)} is scheduled over the next 15 days across Navkar Builders, Kisan Agro, and Mahalaxmi Hardware.`;
    }
    if (lower.includes('sku') || lower.includes('reorder') || lower.includes('stock')) {
      return `Demo Inventory Alert: ${lowStock.length} SKUs are at or below reorder threshold: ${lowStock.map((p) => `${p.name} (${p.availableStock} ${p.unit})`).join(', ')}.`;
    }
    return `Demo Insight Reply: Across current sample records, overdue receivables total ${formatINR(overdueTotal)}, monthly overheads are ${formatINR(totalExp)}, and ${lowStock.length} products require stock replenishment. (Prototype demo response — no live LLM call executed.)`;
  };

  const handleSend = (questionText?: string) => {
    const q = (questionText ?? input).trim();
    if (!q) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: q };
    const botMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      text: generateDemoReply(q),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!questionText) setInput('');
  };

  const insightCards = [
    {
      title: 'Customers with Increasing Overdue Balances',
      metric: formatINR(overdueTotal),
      detail: 'Deccan Electrical Contractors (>89d overdue) & Mahalaxmi Hardware (INV-26-1035 blocked by dispute).',
      tag: 'Demo Insight · Receivables Risk',
    },
    {
      title: 'Frequently Missed Payment Commitments',
      metric: '1 Missed · 1 Rescheduled',
      detail: 'Deccan Electrical missed 14/11/2026 promise of ₹75,000; enforce advance-only dispatch until cleared.',
      tag: 'Demo Insight · Collections',
    },
    {
      title: 'Highest-Selling Products',
      metric: 'Fe-550D TMT Steel Bar',
      detail: '12mm TMT Steel Bars & MS Equal Angles account for 54% of October–November B2B invoice value.',
      tag: 'Demo Insight · Sales Mix',
    },
    {
      title: 'Expense Trends',
      metric: formatINR(totalExp),
      detail: 'Payroll (58%) and Kalamboli godown rent (23%) represent fixed recurring overheads.',
      tag: 'Demo Insight · Overheads',
    },
    {
      title: 'Collection Performance',
      metric: '87% Target Achieved',
      detail: `Collected ${formatINR(customers.length ? 4665000 : 0)} across team executives against ₹59.00 L monthly target.`,
      tag: 'Demo Insight · Team Recovery',
    },
    {
      title: 'Estimated Upcoming Collections',
      metric: formatINR(pendingCommitments),
      detail: 'Expected inflows from active commitments (Navkar Builders ₹3.14 L + Kisan Agro ₹1.05 L + Mahalaxmi ₹1.50 L).',
      tag: 'Demo Insight · Cash Forecast',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Business Insights (Demo Preview)"
        subtitle="AI-ready analytics workspace displaying clearly labelled demo insights and sample assistant queries."
      />

      <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          <strong>Demo Insights Notice:</strong> All cards and assistant responses on this page are pre-computed sample insights from local demo data. Real predictive AI analysis will connect via the backend API in production.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {insightCards.map((card) => (
          <div key={card.title} className="bg-white border border-slate-200/80 rounded-xl p-5">
            <p className="text-[11px] font-semibold text-[#675BD3] uppercase tracking-wider">{card.tag}</p>
            <h2 className="text-sm font-bold text-slate-900 mt-1">{card.title}</h2>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-2">{card.metric}</p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* AI-Ready Assistant Chat UI */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#675BD3]" />
            <h2 className="text-sm font-bold text-slate-900">CollectFlow Insights Assistant (Demo UI)</h2>
          </div>
          <span className="text-xs text-slate-500">Sample Query Mode</span>
        </div>

        <div className="p-5 space-y-3 max-h-80 overflow-y-auto bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#675BD3] text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a sample question about receivables, commitments, or inventory..."
              className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
            >
              <Send className="w-3.5 h-3.5" /> Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
