import { useFinance } from './hooks';
import ChartOfAccounts from './ChartOfAccounts';
import JournalEntries from './JournalEntries';
import AccountsPayable from './AccountsPayable';
import AccountsReceivable from './AccountsReceivable';
import BankingCash from './BankingCash';
import ExpenseTracking from './ExpenseTracking';
import BudgetManagement from './BudgetManagement';
import FixedAssets from './FixedAssets';
import FinancialStatements from './FinancialStatements';
import TaxManagement from './TaxManagement';
import './FinanceSidebar.css';

export default function FinanceSidebar() {
  const finance = useFinance();

  if (finance.error) {
    return (
      <div className="content-error">
        <p>{finance.error}</p>
        <button onClick={() => finance.refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <ChartOfAccounts finance={finance} />
      <JournalEntries finance={finance} />
      <AccountsPayable finance={finance} />
      <AccountsReceivable finance={finance} />
      <BankingCash finance={finance} />
      <ExpenseTracking finance={finance} />
      <BudgetManagement finance={finance} />
      <FixedAssets finance={finance} />
      <FinancialStatements finance={finance} />
      <TaxManagement finance={finance} />
    </>
  );
}
