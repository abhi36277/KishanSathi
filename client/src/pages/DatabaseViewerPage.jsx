import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Database, Table, Download, RefreshCw, Search, CheckCircle2, Server, HardDrive } from 'lucide-react';

export default function DatabaseViewerPage() {
  const [selectedTable, setSelectedTable] = useState('farmers');
  const [tableData, setTableData] = useState([]);
  const [dbHealth, setDbHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const tables = [
    { key: 'farmers', label: 'Farmers', countKey: 'farmers' },
    { key: 'farms', label: 'Farms', countKey: 'farms' },
    { key: 'crops', label: 'Crops', countKey: 'crops' },
    { key: 'action_plans', label: 'Action Plans', countKey: 'action_plans' },
    { key: 'farm_expenses', label: 'Farm Expenses', countKey: 'farm_expenses' },
    { key: 'transport_pools', label: 'Transport Pools', countKey: 'transport_pools' },
    { key: 'community_posts', label: 'Community Posts', countKey: 'community_posts' },
    { key: 'pest_alerts', label: 'Pest Alerts', countKey: 'pest_alerts' }
  ];

  const fetchHealthAndTable = async () => {
    try {
      setLoading(true);
      const [healthRes, tableRes] = await Promise.all([
        apiClient.get('/db/health'),
        apiClient.get(`/db/tables/${selectedTable}`)
      ]);
      if (healthRes.success) setDbHealth(healthRes.data);
      if (tableRes.success) setTableData(tableRes.data || []);
    } catch (err) {
      console.error('DB fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndTable();
  }, [selectedTable]);

  const filteredRows = tableData.filter(row => {
    if (!searchTerm) return true;
    return JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={24} color="#0284c7" /> Visual Database Explorer
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Inspect live records, table relationships, and disk persistence
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={fetchHealthAndTable} className="btn-outline" style={{ fontSize: '0.82rem' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Database Health Metrics */}
        {dbHealth && (
          <div style={{
            marginTop: '1rem',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={16} color="#0284c7" />
              <span>Storage: <strong>{dbHealth.storage_location}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--primary-green)" />
              <span>Status: <strong>Persisted & Synchronized</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Table Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
        {tables.map(t => {
          const isSelected = selectedTable === t.key;
          const count = dbHealth?.table_records?.[t.countKey] ?? 0;
          return (
            <button
              key={t.key}
              onClick={() => setSelectedTable(t.key)}
              className={isSelected ? 'btn-primary' : 'btn-outline'}
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Table size={14} />
              <span>{t.label}</span>
              <span style={{
                background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: isSelected ? 'white' : 'var(--text-dark)',
                borderRadius: '999px',
                padding: '0.1rem 0.4rem',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Viewer Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize' }}>
              Table: {selectedTable}
            </span>
            <span className="badge badge-success">
              {filteredRows.length} Records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={`Filter ${selectedTable}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', width: '160px' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading table records...
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No records found in {selectedTable}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '550px', border: '1px solid var(--border-light)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-light)', position: 'sticky', top: 0 }}>
                  {columns.map(col => (
                    <th key={col} style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fbfcfb' }}>
                    {columns.map(col => {
                      const val = row[col];
                      let displayVal = val;
                      if (typeof val === 'boolean') {
                        displayVal = val ? '✓ True' : '✗ False';
                      } else if (typeof val === 'object' && val !== null) {
                        displayVal = JSON.stringify(val);
                      }
                      return (
                        <td key={col} style={{ padding: '0.6rem 0.9rem', color: '#334155', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {String(displayVal ?? 'NULL')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MySQL Integration Guide Box */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={18} color="#0284c7" /> How to view this database in MySQL Workbench / MySQL CLI
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          Your system has <strong>MySQL Server 8.4</strong> installed. We generated a dedicated MySQL-compatible SQL dump file at <code>database/kisansathi_dump.sql</code>.
        </p>
        <div style={{ background: '#1e293b', color: '#e2e8f0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', overflowX: 'auto' }}>
          # Import directly into your MySQL:<br />
          mysql -u root -p &lt; database/mysql_schema.sql<br />
          <br />
          # Or export fresh live updates anytime with:<br />
          npm run export:mysql
        </div>
      </div>
    </div>
  );
}
