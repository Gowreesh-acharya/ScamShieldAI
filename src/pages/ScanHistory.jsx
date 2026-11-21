import { useState } from 'react';
import {
  MessageSquare,
  Globe,
  Layers,
  Search,
  Trash2,
  Download,
  Clock,
  X,
  FileImage,
  MessageSquare as FeedbackIcon
} from 'lucide-react';
import { clearScanHistory } from '../utils/storage';

export default function ScanHistory({ history = [], onRefreshHistory, onInspectScan, onFeedback }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'message' | 'url' | 'screenshot' | 'combined'
  const [classFilter, setClassFilter] = useState('ALL'); // 'ALL' | 'DANGEROUS' | 'SUSPICIOUS' | 'SAFE'

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all recorded scan history? This action cannot be undone.')) {
      clearScanHistory();
      if (onRefreshHistory) onRefreshHistory();
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scamshield_audit_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredHistory = history.filter((item) => {
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    if (classFilter !== 'ALL' && item.classification !== classFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const targetMatch = item.target?.toLowerCase().includes(q);
      const summaryMatch = item.summary?.toLowerCase().includes(q);
      const explMatch = item.explanation?.toLowerCase().includes(q);
      return targetMatch || summaryMatch || explMatch;
    }

    return true;
  });

  return (
    <div className="page-content">
      <div className="history-table-container">
        {/* Toolbar */}
        <div className="history-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div className="search-input-box">
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search audit targets, phrases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{ padding: 0 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Type Filter Pills */}
            <div className="history-filters">
              <button
                type="button"
                className={`filter-btn ${typeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setTypeFilter('ALL')}
              >
                All Types
              </button>
              <button
                type="button"
                className={`filter-btn ${typeFilter === 'message' ? 'active' : ''}`}
                onClick={() => setTypeFilter('message')}
              >
                Messages
              </button>
              <button
                type="button"
                className={`filter-btn ${typeFilter === 'url' ? 'active' : ''}`}
                onClick={() => setTypeFilter('url')}
              >
                URLs
              </button>
              <button
                type="button"
                className={`filter-btn ${typeFilter === 'screenshot' ? 'active' : ''}`}
                onClick={() => setTypeFilter('screenshot')}
              >
                Screenshots
              </button>
              <button
                type="button"
                className={`filter-btn ${typeFilter === 'combined' ? 'active' : ''}`}
                onClick={() => setTypeFilter('combined')}
              >
                Combined
              </button>
            </div>

            {/* Classification Filter */}
            <div className="history-filters">
              <button
                type="button"
                className={`filter-btn ${classFilter === 'DANGEROUS' ? 'active' : ''}`}
                onClick={() => setClassFilter(classFilter === 'DANGEROUS' ? 'ALL' : 'DANGEROUS')}
                style={{ color: classFilter === 'DANGEROUS' ? 'var(--threat-danger)' : undefined }}
              >
                Dangerous
              </button>
              <button
                type="button"
                className={`filter-btn ${classFilter === 'SUSPICIOUS' ? 'active' : ''}`}
                onClick={() => setClassFilter(classFilter === 'SUSPICIOUS' ? 'ALL' : 'SUSPICIOUS')}
                style={{ color: classFilter === 'SUSPICIOUS' ? 'var(--threat-warning)' : undefined }}
              >
                Suspicious
              </button>
              <button
                type="button"
                className={`filter-btn ${classFilter === 'SAFE' ? 'active' : ''}`}
                onClick={() => setClassFilter(classFilter === 'SAFE' ? 'ALL' : 'SAFE')}
                style={{ color: classFilter === 'SAFE' ? 'var(--threat-safe)' : undefined }}
              >
                Safe
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportJson}
              title="Download audit history as JSON"
              style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearAll}
              title="Clear all recorded history"
              style={{ height: '30px', fontSize: '11px', padding: '0 10px', color: 'var(--threat-danger)' }}
            >
              <Trash2 size={13} />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        {/* Audit Data Table */}
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Target Artifact / Content Summary</th>
              <th>Classification</th>
              <th>Risk Score</th>
              <th>Threat Findings Overview</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No security audits match the active query or filter criteria.
                </td>
              </tr>
            ) : (
              filteredHistory.map((scan) => {
                const badgeClass = scan.classification || 'SAFE';
                return (
                  <tr key={scan.id}>
                    <td>
                      <span className="scan-type-pill">
                        {scan.type === 'message' && <MessageSquare size={11} />}
                        {scan.type === 'url' && <Globe size={11} />}
                        {scan.type === 'screenshot' && <FileImage size={11} />}
                        {scan.type === 'combined' && <Layers size={11} />}
                        {scan.type}
                      </span>
                    </td>
                    <td>
                      <div className="target-snippet" title={scan.target}>
                        {scan.target}
                      </div>
                    </td>
                    <td>
                      <span className={`classification-badge ${badgeClass}`} style={{ fontSize: '10px', padding: '2px 7px' }}>
                        {badgeClass}
                      </span>
                    </td>
                    <td>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          color:
                            scan.riskScore >= 70
                              ? 'var(--threat-danger)'
                              : scan.riskScore >= 30
                              ? 'var(--threat-warning)'
                              : 'var(--threat-safe)'
                        }}
                      >
                        {scan.riskScore}/100
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {scan.summary || 'Security evaluation complete'}
                    </td>
                    <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} />
                        {new Date(scan.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onInspectScan(scan)}
                          style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                        >
                          Audit
                        </button>
                        {onFeedback && (
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onFeedback(scan)}
                            title="Submit feedback on this scan"
                            style={{ height: '26px', width: '26px' }}
                          >
                            <FeedbackIcon size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
