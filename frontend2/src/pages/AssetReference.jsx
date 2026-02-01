import { useState } from 'react';
import { Book, Search, TrendingUp, Bitcoin, Building2, Zap } from 'lucide-react';
import '../styles/AssetReference.css';

const AssetReference = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const assets = {
    stocks: {
      title: 'Stocks',
      icon: <TrendingUp size={24} />,
      color: '#3b82f6',
      description: 'Any stock listed on NYSE, NASDAQ, or other major exchanges - these are just popular examples',
      note: '💡 You can trade ANY stock symbol! Just enter the ticker (e.g., AAPL, TSLA, AMD, etc.)',
      items: [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
        { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
        { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
        { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
        { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial' },
        { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
        { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services' },
        { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
        { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Defensive' },
        { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
        { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
        { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy' },
        { symbol: 'BAC', name: 'Bank of America', sector: 'Financial' },
        { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Entertainment' },
        { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Defensive' },
        { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
        { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
        { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology' },
        { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
        { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
        { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
        { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer Cyclical' },
        { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Cyclical' },
        { symbol: 'COST', name: 'Costco Wholesale', sector: 'Consumer Defensive' },
        { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication' },
        { symbol: 'VZ', name: 'Verizon Communications', sector: 'Communication' },
        { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Financial Services' },
        { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication' },
        { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
        { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
        { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
        { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
        { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology' },
        { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology' },
      ]
    },
    crypto: {
      title: 'Cryptocurrencies',
      icon: <Bitcoin size={24} />,
      color: '#f59e0b',
      description: 'Major cryptocurrencies available on Yahoo Finance - enter symbol without -USD suffix',
      note: '💡 Common cryptos supported: BTC, ETH, BNB, SOL, ADA, XRP, DOT, DOGE, AVAX, MATIC, and many more!',
      items: [
        { symbol: 'BTC', name: 'Bitcoin', marketCap: 'Large Cap' },
        { symbol: 'ETH', name: 'Ethereum', marketCap: 'Large Cap' },
        { symbol: 'BNB', name: 'Binance Coin', marketCap: 'Large Cap' },
        { symbol: 'SOL', name: 'Solana', marketCap: 'Large Cap' },
        { symbol: 'ADA', name: 'Cardano', marketCap: 'Large Cap' },
        { symbol: 'XRP', name: 'Ripple', marketCap: 'Large Cap' },
        { symbol: 'DOT', name: 'Polkadot', marketCap: 'Mid Cap' },
        { symbol: 'DOGE', name: 'Dogecoin', marketCap: 'Mid Cap' },
        { symbol: 'AVAX', name: 'Avalanche', marketCap: 'Mid Cap' },
        { symbol: 'MATIC', name: 'Polygon', marketCap: 'Mid Cap' },
        { symbol: 'LINK', name: 'Chainlink', marketCap: 'Mid Cap' },
        { symbol: 'UNI', name: 'Uniswap', marketCap: 'Mid Cap' },
        { symbol: 'ATOM', name: 'Cosmos', marketCap: 'Mid Cap' },
        { symbol: 'LTC', name: 'Litecoin', marketCap: 'Mid Cap' },
        { symbol: 'BCH', name: 'Bitcoin Cash', marketCap: 'Mid Cap' },
        { symbol: 'SHIB', name: 'Shiba Inu', marketCap: 'Mid Cap' },
        { symbol: 'TRX', name: 'Tron', marketCap: 'Mid Cap' },
        { symbol: 'XLM', name: 'Stellar', marketCap: 'Mid Cap' },
        { symbol: 'ALGO', name: 'Algorand', marketCap: 'Mid Cap' },
        { symbol: 'FIL', name: 'Filecoin', marketCap: 'Mid Cap' },
      ]
    },
    bonds: {
      title: 'Bonds & Fixed Income',
      icon: <Building2 size={24} />,
      color: '#10b981',
      description: 'Treasury bonds, corporate bonds, and fixed income ETFs',
      items: [
        { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'ETF', yield: '~3.5%' },
        { symbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF', type: 'ETF', yield: '~3.2%' },
        { symbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF', type: 'ETF', yield: '~4.5%' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'ETF', yield: '~3.8%' },
        { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', type: 'ETF', yield: '~3.7%' },
        { symbol: 'LQD', name: 'iShares iBoxx Investment Grade Corporate Bond ETF', type: 'ETF', yield: '~4.2%' },
        { symbol: 'HYG', name: 'iShares iBoxx High Yield Corporate Bond ETF', type: 'ETF', yield: '~6.5%' },
        { symbol: 'TIP', name: 'iShares TIPS Bond ETF', type: 'ETF', yield: '~2.8%' },
        { symbol: 'US10Y', name: '10-Year Treasury Yield Index', type: 'Index', yield: '~4.2%' },
        { symbol: 'US30Y', name: '30-Year Treasury Yield Index', type: 'Index', yield: '~4.5%' },
        { symbol: 'US5Y', name: '5-Year Treasury Yield Index', type: 'Index', yield: '~4.0%' },
        { symbol: 'US2Y', name: '2-Year Treasury Yield Index', type: 'Index', yield: '~4.3%' },
      ]
    },
    commodities: {
      title: 'Commodities',
      icon: <Zap size={24} />,
      color: '#ef4444',
      description: 'Precious metals, energy, and commodity ETFs',
      items: [
        { symbol: 'GC', name: 'Gold (via GLD ETF)', type: 'Precious Metal', etf: 'GLD' },
        { symbol: 'SI', name: 'Silver (via SLV ETF)', type: 'Precious Metal', etf: 'SLV' },
        { symbol: 'CL', name: 'Crude Oil (via USO ETF)', type: 'Energy', etf: 'USO' },
        { symbol: 'NG', name: 'Natural Gas (via UNG ETF)', type: 'Energy', etf: 'UNG' },
        { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'Direct ETF' },
        { symbol: 'SLV', name: 'iShares Silver Trust', type: 'Direct ETF' },
        { symbol: 'USO', name: 'United States Oil Fund', type: 'Direct ETF' },
        { symbol: 'UNG', name: 'United States Natural Gas Fund', type: 'Direct ETF' },
        { symbol: 'DBA', name: 'Invesco DB Agriculture Fund', type: 'Direct ETF' },
        { symbol: 'PDBC', name: 'Invesco Optimum Yield Diversified Commodity Strategy', type: 'Direct ETF' },
      ]
    }
  };

  const filterAssets = (items, type) => {
    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderAssetCard = (type, data) => {
    const filteredItems = filterAssets(data.items, type);
    
    if (selectedType !== 'all' && selectedType !== type) return null;
    if (filteredItems.length === 0 && searchTerm) return null;

    return (
      <div key={type} className="asset-category">
        <div className="category-header" style={{ borderColor: data.color }}>
          <div className="category-title">
            <span className="category-icon" style={{ color: data.color }}>
              {data.icon}
            </span>
            <div>
              <h2>{data.title}</h2>
              <p className="category-description">{data.description}</p>
            </div>
          </div>
          <span className="asset-count">{filteredItems.length} examples</span>
        </div>

        {data.note && (
          <div className="category-note" style={{ borderLeftColor: data.color }}>
            {data.note}
          </div>
        )}

        <div className="assets-grid">
          {filteredItems.map((asset) => (
            <div key={asset.symbol} className="asset-card">
              <div className="asset-symbol" style={{ color: data.color }}>
                {asset.symbol}
              </div>
              <div className="asset-name">{asset.name}</div>
              {asset.sector && (
                <div className="asset-meta">
                  <span className="asset-badge">{asset.sector}</span>
                </div>
              )}
              {asset.marketCap && (
                <div className="asset-meta">
                  <span className="asset-badge">{asset.marketCap}</span>
                </div>
              )}
              {asset.type && (
                <div className="asset-meta">
                  <span className="asset-badge">{asset.type}</span>
                  {asset.yield && <span className="asset-yield">{asset.yield}</span>}
                  {asset.etf && <span className="asset-yield">→ {asset.etf}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="asset-reference">
      <div className="reference-header">
        <div className="header-content">
          <h1>
            <Book size={32} />
            Asset Reference
          </h1>
          <p>Explore available stocks, cryptocurrencies, bonds, and commodities for trading</p>
        </div>

        <div className="reference-controls">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              All Assets
            </button>
            <button
              className={`filter-tab ${selectedType === 'stocks' ? 'active' : ''}`}
              onClick={() => setSelectedType('stocks')}
            >
              Stocks
            </button>
            <button
              className={`filter-tab ${selectedType === 'crypto' ? 'active' : ''}`}
              onClick={() => setSelectedType('crypto')}
            >
              Crypto
            </button>
            <button
              className={`filter-tab ${selectedType === 'bonds' ? 'active' : ''}`}
              onClick={() => setSelectedType('bonds')}
            >
              Bonds
            </button>
            <button
              className={`filter-tab ${selectedType === 'commodities' ? 'active' : ''}`}
              onClick={() => setSelectedType('commodities')}
            >
              Commodities
            </button>
          </div>
        </div>
      </div>

      <div className="categories-container">
        {Object.entries(assets).map(([type, data]) => renderAssetCard(type, data))}
      </div>

      {searchTerm && Object.values(assets).every(data => filterAssets(data.items, '').length === 0) && (
        <div className="no-results">
          <Search size={48} />
          <h3>No assets found</h3>
          <p>Try searching with a different symbol or name</p>
        </div>
      )}
    </div>
  );
};

export default AssetReference;
