import { useHR } from './hooks';
import EmployeeRecords from './EmployeeRecords';
import AttendanceTracking from './AttendanceTracking';
import LeaveManagement from './LeaveManagement';
import PayrollProcessing from './PayrollProcessing';
import PerformanceEvaluation from './PerformanceEvaluation';
import TrainingRecords from './TrainingRecords';
import EmployeeDocuments from './EmployeeDocuments';
import './HRSidebar.css';

export default function HRSidebar() {
  const hr = useHR();

  if (hr.loading) {
    return null;
  }

  if (hr.error) {
    return (
      <div className="content-error">
        <p>{hr.error}</p>
      </div>
    );
  }

  return (
    <>
      <EmployeeRecords hr={hr} />
      <AttendanceTracking hr={hr} />
      <LeaveManagement hr={hr} />
      <PayrollProcessing hr={hr} />
      <PerformanceEvaluation hr={hr} />
      <TrainingRecords hr={hr} />
      <EmployeeDocuments hr={hr} />
    </>
  );
}
