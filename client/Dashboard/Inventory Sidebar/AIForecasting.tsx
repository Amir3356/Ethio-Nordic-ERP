import { useState } from 'react';
import { aiForecastingAPI, type AIForecastResponse, type AIReorderResponse, type AIHealthResponse } from '../../services/ai-forecasting';

type TabType = 'forecast' | 'reorder' | 'health';

export default function AIForecasting() {
  const [activeTab, setActiveTab] = useState<TabType>('forecast');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<AIForecastResponse['data'] | null>(null);
  const [reorderData, setReorderData] = useState<AIReorderResponse['data'] | null>(null);
  const [healthData, setHealthData] = useState<AIHealthResponse['data'] | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiForecastingAPI.getDemandForecast();
      if (res.data.success) {
        setForecastData(res.data.data);
        setLastGenerated(res.data.data.generated_at);
      }
    } catch {
      setError('Failed to generate demand forecast');
    } finally {
      setLoading(false);
    }
  };

  const fetchReorderRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiForecastingAPI.getReorderRecommendations();
      if (res.data.success) {
        setReorderData(res.data.data);
        setLastGenerated(res.data.data.generated_at);
      }
    } catch {
      setError('Failed to generate reorder recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiForecastingAPI.getInventoryHealth();
      if (res.data.success) {
        setHealthData(res.data.data);
        setLastGenerated(res.data.data.generated_at);
      }
    } catch {
      setError('Failed to generate health analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleGenerate = () => {
    switch (activeTab) {
      case 'forecast':
        fetchForecast();
        break;
      case 'reorder':
        fetchReorderRecommendations();
        break;
      case 'health':
        fetchHealthAnalysis();
        break;
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="inv-ai-error">
          <p>{error}</p>
          <button className="inv-btn inv-btn-secondary" onClick={handleGenerate}>
            Retry
          </button>
        </div>
      );
    }

    if (activeTab === 'forecast' && forecastData) {
      return (
        <div className="inv-ai-result">
          <div className="inv-ai-result-header">
            <span className="inv-ai-badge">Demand Forecast</span>
            <span className="inv-ai-timestamp">
              Generated: {new Date(forecastData.generated_at).toLocaleString()}
            </span>
          </div>
          <div className="inv-ai-snapshot">
            <h4>Inventory Snapshot</h4>
            <div className="inv-ai-snapshot-grid">
              <div className="inv-ai-snapshot-item">
                <span className="inv-ai-snapshot-label">Products</span>
                <span className="inv-ai-snapshot-value">{forecastData.inventory_snapshot.total_products}</span>
              </div>
              <div className="inv-ai-snapshot-item">
                <span className="inv-ai-snapshot-label">Stock Units</span>
                <span className="inv-ai-snapshot-value">{forecastData.inventory_snapshot.total_stock_units.toLocaleString()}</span>
              </div>
              <div className="inv-ai-snapshot-item">
                <span className="inv-ai-snapshot-label">Inventory Value</span>
                <span className="inv-ai-snapshot-value">{forecastData.inventory_snapshot.total_inventory_value.toLocaleString()} ETB</span>
              </div>
              <div className="inv-ai-snapshot-item">
                <span className="inv-ai-snapshot-label">Low Stock</span>
                <span className="inv-ai-snapshot-value inv-ai-warning">{forecastData.inventory_snapshot.low_stock_products}</span>
              </div>
              <div className="inv-ai-snapshot-item">
                <span className="inv-ai-snapshot-label">Expiring (90d)</span>
                <span className="inv-ai-snapshot-value inv-ai-danger">{forecastData.inventory_snapshot.expiring_batches}</span>
              </div>
              <div className="inv-ai-snapshot-item">
                <span className="inv-ai-snapshot-label">Pending Adjustments</span>
                <span className="inv-ai-snapshot-value">{forecastData.inventory_snapshot.pending_adjustments}</span>
              </div>
            </div>
          </div>
          <div className="inv-ai-content">
            <pre className="inv-ai-pre">{forecastData.forecast.content}</pre>
          </div>
        </div>
      );
    }

    if (activeTab === 'reorder' && reorderData) {
      return (
        <div className="inv-ai-result">
          <div className="inv-ai-result-header">
            <span className="inv-ai-badge">Reorder Recommendations</span>
            <span className="inv-ai-timestamp">
              Generated: {new Date(reorderData.generated_at).toLocaleString()}
            </span>
          </div>
          <div className="inv-ai-meta">
            <span>Active Reorder Rules: {reorderData.active_rules}</span>
          </div>
          <div className="inv-ai-content">
            <pre className="inv-ai-pre">{reorderData.recommendations.content}</pre>
          </div>
        </div>
      );
    }

    if (activeTab === 'health' && healthData) {
      return (
        <div className="inv-ai-result">
          <div className="inv-ai-result-header">
            <span className="inv-ai-badge">Inventory Health Analysis</span>
            <span className="inv-ai-timestamp">
              Generated: {new Date(healthData.generated_at).toLocaleString()}
            </span>
          </div>
          <div className="inv-ai-content">
            <pre className="inv-ai-pre">{healthData.health_analysis.content}</pre>
          </div>
        </div>
      );
    }

    return (
      <div className="inv-ai-empty">
        <div className="inv-ai-empty-icon">🤖</div>
        <h4>AI-Powered Inventory Intelligence</h4>
        <p>
          {activeTab === 'forecast' && 'Generate demand predictions based on your inventory data, movements, and stock levels.'}
          {activeTab === 'reorder' && 'Get intelligent reorder recommendations based on current stock, reorder rules, and usage patterns.'}
          {activeTab === 'health' && 'Analyze overall inventory health including efficiency, waste, and optimization opportunities.'}
        </p>
        <p className="inv-ai-empty-hint">
          Click the button above to generate AI analysis
        </p>
      </div>
    );
  };

  return (
    <div className="inv-ai-forecasting">
      <div className="inv-ai-header">
        <h3>AI Forecasting</h3>
        <p className="inv-ai-subtitle">Demand prediction & reorder recommendations powered by AI</p>
      </div>

      <div className="inv-tab-group">
        <button
          className={`inv-tab ${activeTab === 'forecast' ? 'inv-tab-active' : ''}`}
          onClick={() => handleTabChange('forecast')}
        >
          Demand Forecast
        </button>
        <button
          className={`inv-tab ${activeTab === 'reorder' ? 'inv-tab-active' : ''}`}
          onClick={() => handleTabChange('reorder')}
        >
          Reorder Recommendations
        </button>
        <button
          className={`inv-tab ${activeTab === 'health' ? 'inv-tab-active' : ''}`}
          onClick={() => handleTabChange('health')}
        >
          Health Analysis
        </button>
      </div>

      <div className="inv-ai-controls">
        <button
          className="inv-btn inv-btn-primary inv-btn-ai"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : `Generate ${activeTab === 'forecast' ? 'Forecast' : activeTab === 'reorder' ? 'Recommendations' : 'Health Analysis'}`}
        </button>
        {lastGenerated && (
          <span className="inv-ai-last-generated">
            Last generated: {new Date(lastGenerated).toLocaleString()}
          </span>
        )}
      </div>

      <div className="inv-ai-content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
}
