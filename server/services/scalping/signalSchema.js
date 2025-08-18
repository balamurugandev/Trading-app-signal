/**
 * Professional Intraday Scalping Signal Schema
 * Designed for NIFTY/BANKNIFTY options trading with realistic execution modeling
 */

const SIGNAL_SCHEMA = {
  // Core Signal Identity
  id: "string", // Unique signal identifier
  timestamp: "ISO8601", // Signal generation time
  symbol: "NIFTY|BANKNIFTY", // Underlying instrument
  
  // Timeframe Structure
  timeframe: {
    entry: "1m|5m", // Entry timeframe (execution level)
    bias: ["15m", "5m"], // Higher timeframe bias (trend confirmation)
    alignment: "string" // Description of timeframe alignment
  },
  
  // Market Context
  market: {
    spot_price: "number", // Current underlying price
    session: "MORNING|MIDDAY|AFTERNOON", // Trading session
    volatility_regime: "LOW|NORMAL|HIGH", // Current VIX/volatility state
    event_filter: {
      status: "CLEAR|CAUTION|BLOCKED", // Event-based filter
      reason: "string|null", // If blocked/caution, why
      next_event: "string|null" // Next major event
    }
  },
  
  // Entry Logic
  entry: {
    condition: "string", // Human-readable entry condition
    trigger_price: "number", // Exact trigger level
    confluence: {
      htf_trend: "UP|DOWN|NEUTRAL", // Higher timeframe trend
      ltf_setup: "string", // Lower timeframe setup description
      indicators: {
        ema_alignment: "boolean", // EMA 9 > 21 (bull) or < (bear)
        rsi_reset: "boolean", // RSI pullback and reset
        vwap_position: "ABOVE|BELOW|AT", // Price vs VWAP
        structure_break: "boolean" // Key level break
      }
    }
  },
  
  // Risk Management (ATR-based)
  risk: {
    atr_period: "number", // ATR calculation period
    atr_value: "number", // Current ATR value
    stop_loss: {
      price: "number", // SL price level
      distance_points: "number", // Distance from entry in points
      atr_multiple: "number", // SL as multiple of ATR
      basis: "string" // SL calculation basis (e.g., "ATR(14)*1.5")
    },
    targets: [
      {
        level: 1,
        price: "number",
        distance_points: "number",
        atr_multiple: "number",
        probability: "number", // Historical hit rate %
        partial_exit: "number" // % of position to exit (e.g., 50)
      }
    ],
    risk_reward_ratio: "number", // Calculated R:R
    position_size: "number", // Recommended position size
    max_risk_per_trade: "number" // Max risk in ₹
  },
  
  // Options Execution Model
  options: {
    selection: {
      strike: "number", // Selected strike price
      type: "CE|PE", // Call or Put
      expiry: "string", // Expiry date (YYYY-MM-DD)
      moneyness: "ATM|ITM1|OTM1", // Strike selection logic
      selection_reason: "string" // Why this strike was chosen
    },
    pricing: {
      premium: "number", // Option premium
      bid: "number", // Bid price
      ask: "number", // Ask price
      spread: "number", // Bid-ask spread
      spread_pct: "number", // Spread as % of mid price
      iv: "number", // Implied volatility
      delta: "number", // Option delta
      theta: "number", // Time decay
      liquidity_score: "number" // 0-100 liquidity assessment
    },
    execution: {
      min_liquidity: "number", // Minimum acceptable liquidity
      max_spread_pct: "number", // Maximum acceptable spread %
      slippage_assumption: "number", // Expected slippage in ₹
      order_type: "LIMIT|MARKET", // Recommended order type
      execution_probability: "number" // Likelihood of clean execution %
    }
  },
  
  // Trade Management
  management: {
    max_hold_time: "number", // Maximum hold time in minutes
    trailing_stop: {
      enabled: "boolean",
      method: "EMA|SUPERTREND|FIXED", // Trailing method
      trigger_profit: "number" // Profit % to activate trailing
    },
    time_exits: [
      {
        time: "string", // Time-based exit (e.g., "15:20")
        action: "CLOSE|REDUCE", // Action to take
        percentage: "number" // % of position
      }
    ],
    invalidation: [
      "string" // List of invalidation conditions
    ]
  },
  
  // Quality Metrics (Auditable)
  quality: {
    backtest_stats: {
      sample_size: "number", // Number of similar trades
      win_rate: "number", // Win rate %
      profit_factor: "number", // Gross profit / Gross loss
      avg_win: "number", // Average winning trade ₹
      avg_loss: "number", // Average losing trade ₹
      expectancy: "number", // Expected value per trade ₹
      max_drawdown: "number", // Maximum drawdown %
      avg_hold_time: "number", // Average hold time in minutes
      backtest_period: "string", // Data period used
      last_updated: "ISO8601" // When stats were last calculated
    },
    confidence_factors: {
      technical_score: "number", // 0-100 technical setup strength
      execution_score: "number", // 0-100 execution feasibility
      risk_score: "number", // 0-100 risk management quality
      overall_score: "number" // Weighted average
    }
  },
  
  // Validation Gates
  validation: {
    timeframe_rr_check: "PASS|FAIL",
    options_executability_check: "PASS|FAIL",
    confluence_check: "PASS|FAIL",
    risk_controls_check: "PASS|FAIL",
    event_filter_check: "PASS|FAIL",
    validation_errors: ["string"], // List of any validation failures
    gate_score: "number" // Overall validation score 0-100
  },
  
  // Signal Status
  status: "PENDING|ACTIVE|FILLED|STOPPED|TARGET_HIT|EXPIRED|CANCELLED",
  
  // Real-time Updates
  live_data: {
    current_pnl: "number", // Current P&L in ₹
    current_premium: "number", // Current option premium
    time_elapsed: "number", // Minutes since signal
    next_action: "string|null" // Next recommended action
  }
};

// Validation Rules
const VALIDATION_RULES = {
  // Timeframe-specific R:R bounds
  TIMEFRAME_RR_BOUNDS: {
    "1m": {
      min_sl_atr: 0.5, // Minimum SL as ATR multiple
      max_sl_atr: 2.0, // Maximum SL as ATR multiple
      min_target_atr: 0.8, // Minimum target as ATR multiple
      max_target_atr: 3.0, // Maximum target as ATR multiple
      min_rr: 1.2, // Minimum risk-reward ratio
      max_hold_minutes: 15 // Maximum hold time
    },
    "5m": {
      min_sl_atr: 0.8,
      max_sl_atr: 3.0,
      min_target_atr: 1.2,
      max_target_atr: 5.0,
      min_rr: 1.5,
      max_hold_minutes: 45
    }
  },
  
  // Options execution thresholds
  OPTIONS_THRESHOLDS: {
    max_spread_pct: 2.0, // Maximum 2% spread
    min_liquidity_score: 60, // Minimum liquidity score
    min_delta: 0.3, // Minimum delta for responsiveness
    max_theta_daily: -50, // Maximum daily theta decay
    min_execution_probability: 75 // Minimum execution probability %
  },
  
  // Risk control limits
  RISK_LIMITS: {
    max_risk_per_trade_pct: 2.0, // Max 2% of capital per trade
    max_daily_loss_pct: 6.0, // Max 6% daily loss
    max_trades_per_day: 8, // Maximum trades per day
    max_open_positions: 3 // Maximum concurrent positions
  },
  
  // Event filter rules
  EVENT_FILTERS: {
    HIGH_IMPACT_EVENTS: [
      "RBI_POLICY", "CPI_DATA", "GDP_DATA", "FII_DII_DATA",
      "MAJOR_EARNINGS", "GLOBAL_EVENTS"
    ],
    BLOCK_WINDOWS: {
      "RBI_POLICY": { before: 30, after: 60 }, // Minutes before/after
      "CPI_DATA": { before: 15, after: 30 },
      "GDP_DATA": { before: 15, after: 30 }
    }
  }
};

module.exports = {
  SIGNAL_SCHEMA,
  VALIDATION_RULES
};