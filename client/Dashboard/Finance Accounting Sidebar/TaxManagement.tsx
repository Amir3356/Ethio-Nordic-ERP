import { useMemo } from 'react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function TaxManagement({ finance }: Props) {
  const { data, getPendingTaxRecords } = finance;

  const taxByType = useMemo(() => {
    if (!data) return [];
    const byType: Record<string, { filed: number; accrued: number; pending: number }> = {};

    data.tax_records.forEach((record) => {
      if (!byType[record.tax_type]) {
        byType[record.tax_type] = { filed: 0, accrued: 0, pending: 0 };
      }
      if (record.status === 'filed') byType[record.tax_type].filed++;
      else if (record.status === 'accrued') byType[record.tax_type].accrued++;
      else byType[record.tax_type].pending++;
    });

    return Object.entries(byType).map(([type, counts]) => ({
      type,
      ...counts,
    }));
  }, [data]);

  const pendingRecords = getPendingTaxRecords();

  const totalVATPayable = useMemo(() => {
    if (!data) return 0;
    return data.tax_records
      .filter((r) => r.tax_type === 'VAT' || r.tax_type === 'VAT Monthly')
      .reduce((sum, r) => sum + (r.net_vat_payable || 0), 0);
  }, [data]);

  const totalWHTPayable = useMemo(() => {
    if (!data) return 0;
    return data.tax_records
      .filter((r) => r.tax_type === 'Withholding Tax')
      .reduce((sum, r) => sum + (r.wht_collected || 0) - (r.wht_paid || 0), 0);
  }, [data]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'filed' ? 'finance-badge-green' :
      status === 'accrued' ? 'finance-badge-amber' :
      'finance-badge-red';
    return <span className={`finance-badge ${cls}`}>{status}</span>;
  };

  const getTaxTypeBadge = (type: string) => {
    const cls =
      type === 'VAT' || type === 'VAT Monthly' ? 'finance-badge-blue' :
      type === 'Withholding Tax' ? 'finance-badge-purple' :
      'finance-badge-green';
    return <span className={`finance-badge ${cls}`}>{type}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="tax-management">
      <div className="content-section-header">
        <h2>Tax Management</h2>
      </div>

      <p className="content-description">
        VAT and withholding tax computation and reporting for Ethiopian statutory compliance.
      </p>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>VAT</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{totalVATPayable.toLocaleString()} ETB</span>
            <span className="finance-stat-label">VAT Payable</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-purple">
            <span style={{ fontSize: 18 }}>WHT</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{totalWHTPayable.toLocaleString()} ETB</span>
            <span className="finance-stat-label">WHT Payable</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-amber">
            <span style={{ fontSize: 18 }}>!</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{pendingRecords.length}</span>
            <span className="finance-stat-label">Pending Filings</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-green">
            <span style={{ fontSize: 18 }}>{data.tax_records.filter((r) => r.status === 'filed').length}</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{data.tax_records.filter((r) => r.status === 'filed').length}</span>
            <span className="finance-stat-label">Filed Returns</span>
          </div>
        </div>
      </div>

      <h3 className="finance-subsection-title">Tax Records by Type</h3>
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Tax Type</th>
              <th>Filed</th>
              <th>Accrued</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>
            {taxByType.map(({ type, filed, accrued, pending }) => (
              <tr key={type}>
                <td className="finance-table-name">{getTaxTypeBadge(type)}</td>
                <td className="finance-text-green">{filed}</td>
                <td className="finance-text-red">{accrued}</td>
                <td className="finance-text-red">{pending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="finance-subsection-title">Tax Records Detail</h3>
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Type</th>
              <th>Period</th>
              <th>Filing Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Date</th>
              <th>Payment Ref</th>
            </tr>
          </thead>
          <tbody>
            {data.tax_records.map((record) => {
              let amount = 0;
              if (record.tax_type === 'VAT' || record.tax_type === 'VAT Monthly') {
                amount = record.net_vat_payable || 0;
              } else if (record.tax_type === 'Withholding Tax') {
                amount = record.wht_collected || 0;
              } else {
                amount = record.tax_amount || 0;
              }

              return (
                <tr key={record.id}>
                  <td className="finance-table-name">{record.id}</td>
                  <td>{getTaxTypeBadge(record.tax_type)}</td>
                  <td>{record.period}</td>
                  <td>{record.filing_date}</td>
                  <td className="finance-text-bold">{amount.toLocaleString()} ETB</td>
                  <td>{getStatusBadge(record.status)}</td>
                  <td>{record.payment_date || <span className="finance-text-muted">—</span>}</td>
                  <td>{record.payment_ref || <span className="finance-text-muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
