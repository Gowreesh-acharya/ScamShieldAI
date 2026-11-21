import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Trash2,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { queryInvestigationAi } from '../services/api';
import { getScanHistory, getLatestScan } from '../utils/storage';

const SUGGESTED_QUESTIONS = [
  'Why was this message classified as dangerous?',
  'Which words make this suspicious?',
  'What happens if I click this link?',
  'What information could the scammer steal?',
  'How can I verify whether this is genuine?',
  'What should I do next?'
];

export default function InvestigationAssistant() {
  const [historyList] = useState(() => getScanHistory());
  const [selectedScan, setSelectedScan] = useState(() => getLatestScan());
  const msgIdCounter = useRef(1);

  const [messages, setMessages] = useState(() => {
    const latest = getLatestScan();
    if (latest) {
      return [
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello! I am your ScamShield Cyber Investigation Assistant. I have loaded context from your latest scan: "${latest.target.slice(0, 70)}..." (${latest.classification}, Risk ${latest.riskScore}/100).\n\nFeel free to ask any question or select one of the suggested prompts below to evaluate the threat evidence.`,
          timestamp: 'Session Start'
        }
      ];
    }
    return [
      {
        id: 'welcome-empty',
        sender: 'assistant',
        text: 'Hello! I am your ScamShield Cyber Investigation Assistant. No previous scan records were found in this session. Run a scan from the Message or URL scanner, or ask me general questions about fraud indicators and cyber safety.',
        timestamp: 'Session Start'
      }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionToSend) => {
    const query = questionToSend || inputText;
    if (!query.trim() || loading) return;

    const userMessage = {
      id: `msg-user-${msgIdCounter.current++}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const responseObj = await queryInvestigationAi(query, selectedScan);

      const aiMessage = {
        id: `msg-ai-${msgIdCounter.current++}`,
        sender: 'assistant',
        text: responseObj.response,
        isLive: responseObj.isLive,
        source: responseObj.source,
        timestamp: 'Just now'
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || 'Failed to generate investigation guidance.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScan = (scanId) => {
    const scan = historyList.find((s) => s.id === scanId);
    if (scan) {
      setSelectedScan(scan);
      setMessages((prev) => [
        ...prev,
        {
          id: `switch-${msgIdCounter.current++}`,
          sender: 'assistant',
          text: `Switched investigation context to: "${scan.target.slice(0, 70)}..." (${scan.classification}, Risk: ${scan.riskScore}/100). What would you like to investigate about this artifact?`,
          timestamp: 'Just now'
        }
      ]);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `clear-${msgIdCounter.current++}`,
        sender: 'assistant',
        text: 'Conversation cleared. Context is still active. Ask me any security question or select a prompt below.',
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <div className="page-content">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Chat Area */}
        <div className="scanner-panel" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', padding: '20px' }}>
          {/* Chat Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} color="var(--accent-sky)" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                  Cyber Scam Investigation Assistant
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Interactive Threat Explanations & Evidence Clarification
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearChat}
              style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
            >
              <Trash2 size={12} />
              <span>Clear Chat</span>
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  {!isUser && (
                    <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-subtle)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-sky)', flexShrink: 0 }}>
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor: isUser ? 'var(--accent-blue)' : 'var(--bg-surface-input)',
                      border: isUser ? 'none' : '1px solid var(--border-subtle)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {!isUser && msg.source && (
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: msg.isLive ? 'var(--accent-sky)' : 'var(--threat-warning)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {msg.isLive ? 'FastAPI Neural Model' : 'Demo Heuristic Advisory'}
                      </div>
                    )}
                    <div>{msg.text}</div>
                    <div style={{ fontSize: '10px', color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-3)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                      <User size={15} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-sky)' }}>
                  <Bot size={15} />
                </div>
                <span>Analyzing threat indicators & formulating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions Bar */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.6px', display: 'block', marginBottom: '6px' }}>
              Suggested Inquiries:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  <Sparkles size={11} color="var(--accent-sky)" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          {error && (
            <div className="error-banner" style={{ marginBottom: '8px', fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="var(--threat-danger)" />
              <span>{error}</span>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              className="cyber-input"
              placeholder="Ask a question about this threat, next steps, or scam techniques..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !inputText.trim()}
              style={{ width: '44px', flex: 'none', padding: 0 }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Right Column: Context Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Context Card */}
          <div className="scanner-panel" style={{ padding: '16px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.6px' }}>
                Active Investigation Context
              </span>
              <HelpCircle size={14} color="var(--accent-sky)" />
            </div>

            {selectedScan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`classification-badge ${selectedScan.classification}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {selectedScan.classification === 'DANGEROUS' && <ShieldAlert size={12} />}
                    {selectedScan.classification === 'SUSPICIOUS' && <AlertTriangle size={12} />}
                    {selectedScan.classification === 'SAFE' && <ShieldCheck size={12} />}
                    {selectedScan.classification}
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '14px', color: selectedScan.riskScore >= 70 ? 'var(--threat-danger)' : (selectedScan.riskScore >= 30 ? 'var(--threat-warning)' : 'var(--threat-safe)') }}>
                    {selectedScan.riskScore}/100
                  </span>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface-input)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', maxHeight: '110px', overflowY: 'auto', lineHeight: '1.4' }}>
                  {selectedScan.target}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {selectedScan.summary}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>
                No active scan selected.
              </div>
            )}
          </div>

          {/* Switch Context Dropdown / List */}
          <div className="scanner-panel" style={{ padding: '16px', gap: '10px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.6px' }}>
              Select Artifact from History ({historyList.length})
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectScan(item.id)}
                  style={{
                    backgroundColor: selectedScan?.id === item.id ? 'var(--bg-surface-3)' : 'var(--bg-surface-input)',
                    border: selectedScan?.id === item.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-mono)' }}>
                      {item.target}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {item.type} &bull; {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={`classification-badge ${item.classification}`} style={{ fontSize: '9px', padding: '1px 5px', flexShrink: 0 }}>
                    {item.classification}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
