/**
 * Professional Signal Validation Engine
 * Implements quality gates to prevent untradeable signals
 */

const { VALIDATION_RULES } = require('./signalSchema');

class SignalValidator {
    constructor() {
        this.rules = VALIDATION_RULES;
    }

    /**
     * Master validation function - runs all quality gates
     */
    validateSignal(signal, marketSnapshot, portfolioState) {
        const results = {
            timeframe_rr_check: this.validateTimeframeRR(signal),
            options_executability_check: this.validateOptionsExecutability(signal, marketSnapshot),
            confluence_check: this.validateIndicatorConfluence(signal),
            risk_controls_check: this.validateRiskControls(signal, portfolioState),
            event_filter_check: this.validateEventFilter(signal),
            validation_errors: []
        };

        // Collect all errors
        Object.entries(results).forEach(([key, result]) => {
            if (key !== 'validation_errors' && result.status === 'FAIL') {
                results.validation_errors.push(`${key}: ${result.reason}`);
            }
        });

        // Calculate overall gate score
        const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
        const totalGates = Object.keys(results).length - 1; // Exclude validation_errors
        results.gate_score = Math.round((passCount / totalGates) * 100);

        // Update signal validation status
        signal.validation = {
            ...results,
            timeframe_rr_check: results.timeframe_rr_check.status,
            options_executability_check: results.options_executability_check.status,
            confluence_check: results.confluence_check.status,
            risk_controls_check: results.risk_controls_check.status,
            event_filter_check: results.event_filter_check.status
        };

        return {
            isValid: results.validation_errors.length === 0,
            score: results.gate_score,
            errors: results.validation_errors,
            details: results
        };
    }

    /**
     * Gate 1: Timeframe R:R Sanity Check
     */
    validateTimeframeRR(signal) {
        const timeframe = signal.timeframe.entry;
        const bounds = this.rules.TIMEFRAME_RR_BOUNDS[timeframe];

        if (!bounds) {
            return {
                status: 'FAIL',
                reason: `Unsupported timeframe: ${timeframe}`
            };
        }

        const { stop_loss, targets } = signal.risk;
        const atr = signal.risk.atr_value;

        // Check SL bounds
        if (stop_loss.atr_multiple < bounds.min_sl_atr || stop_loss.atr_multiple > bounds.max_sl_atr) {
            return {
                status: 'FAIL',
                reason: `SL ATR multiple ${stop_loss.atr_multiple} outside bounds [${bounds.min_sl_atr}, ${bounds.max_sl_atr}] for ${timeframe}`
            };
        }

        // Check target bounds
        const primaryTarget = targets[0];
        if (primaryTarget.atr_multiple < bounds.min_target_atr || primaryTarget.atr_multiple > bounds.max_target_atr) {
            return {
                status: 'FAIL',
                reason: `Target ATR multiple ${primaryTarget.atr_multiple} outside bounds [${bounds.min_target_atr}, ${bounds.max_target_atr}] for ${timeframe}`
            };
        }

        // Check R:R ratio
        if (signal.risk.risk_reward_ratio < bounds.min_rr) {
            return {
                status: 'FAIL',
                reason: `R:R ratio ${signal.risk.risk_reward_ratio} below minimum ${bounds.min_rr} for ${timeframe}`
            };
        }

        // Check hold time
        if (signal.management.max_hold_time > bounds.max_hold_minutes) {
            return {
                status: 'FAIL',
                reason: `Max hold time ${signal.management.max_hold_time}m exceeds limit ${bounds.max_hold_minutes}m for ${timeframe}`
            };
        }

        return {
            status: 'PASS',
            reason: 'Timeframe R:R parameters within acceptable bounds'
        };
    }

    /**
     * Gate 2: Options Executability Check
     */
    validateOptionsExecutability(signal, marketSnapshot) {
        const { pricing, execution } = signal.options;
        const thresholds = this.rules.OPTIONS_THRESHOLDS;

        // Check spread
        if (pricing.spread_pct > thresholds.max_spread_pct) {
            return {
                status: 'FAIL',
                reason: `Spread ${pricing.spread_pct}% exceeds maximum ${thresholds.max_spread_pct}%`
            };
        }

        // Check liquidity
        if (pricing.liquidity_score < thresholds.min_liquidity_score) {
            return {
                status: 'FAIL',
                reason: `Liquidity score ${pricing.liquidity_score} below minimum ${thresholds.min_liquidity_score}`
            };
        }

        // Check delta responsiveness
        if (Math.abs(pricing.delta) < thresholds.min_delta) {
            return {
                status: 'FAIL',
                reason: `Delta ${pricing.delta} below minimum responsiveness threshold ${thresholds.min_delta}`
            };
        }

        // Check theta decay (for short-term trades)
        if (pricing.theta < thresholds.max_theta_daily) {
            return {
                status: 'FAIL',
                reason: `Theta ${pricing.theta} indicates excessive time decay risk`
            };
        }

        // Check execution probability
        if (execution.execution_probability < thresholds.min_execution_probability) {
            return {
                status: 'FAIL',
                reason: `Execution probability ${execution.execution_probability}% below minimum ${thresholds.min_execution_probability}%`
            };
        }

        return {
            status: 'PASS',
            reason: 'Options execution parameters acceptable'
        };
    }

    /**
     * Gate 3: Indicator Confluence Check
     */
    validateIndicatorConfluence(signal) {
        const { confluence } = signal.entry;
        const { indicators } = confluence;

        // Check HTF-LTF alignment
        if (confluence.htf_trend === 'NEUTRAL') {
            return {
                status: 'FAIL',
                reason: 'No clear higher timeframe trend bias'
            };
        }

        // Count confluence factors
        const confluenceFactors = [
            indicators.ema_alignment,
            indicators.rsi_reset,
            indicators.structure_break,
            indicators.vwap_position !== 'AT'
        ];

        const confluenceCount = confluenceFactors.filter(Boolean).length;

        if (confluenceCount < 3) {
            return {
                status: 'FAIL',
                reason: `Insufficient confluence: only ${confluenceCount}/4 factors aligned`
            };
        }

        // Check for contradictory signals
        const isBullish = confluence.htf_trend === 'UP';
        const vwapBullish = indicators.vwap_position === 'ABOVE';

        if (isBullish !== vwapBullish && indicators.vwap_position !== 'AT') {
            return {
                status: 'FAIL',
                reason: 'HTF trend and VWAP position contradictory'
            };
        }

        return {
            status: 'PASS',
            reason: `Strong confluence: ${confluenceCount}/4 factors aligned`
        };
    }

    /**
     * Gate 4: Risk Controls Check
     */
    validateRiskControls(signal, portfolioState) {
        const limits = this.rules.RISK_LIMITS;
        const { max_risk_per_trade, position_size } = signal.risk;

        // Check per-trade risk
        const riskPct = (max_risk_per_trade / portfolioState.totalCapital) * 100;
        if (riskPct > limits.max_risk_per_trade_pct) {
            return {
                status: 'FAIL',
                reason: `Per-trade risk ${riskPct.toFixed(2)}% exceeds limit ${limits.max_risk_per_trade_pct}%`
            };
        }

        // Check daily loss limit
        if (portfolioState.dailyLossPct >= limits.max_daily_loss_pct) {
            return {
                status: 'FAIL',
                reason: `Daily loss limit ${limits.max_daily_loss_pct}% already reached`
            };
        }

        // Check trade count
        if (portfolioState.tradesCount >= limits.max_trades_per_day) {
            return {
                status: 'FAIL',
                reason: `Daily trade limit ${limits.max_trades_per_day} already reached`
            };
        }

        // Check open positions
        if (portfolioState.openPositions >= limits.max_open_positions) {
            return {
                status: 'FAIL',
                reason: `Maximum open positions ${limits.max_open_positions} already reached`
            };
        }

        return {
            status: 'PASS',
            reason: 'Risk controls within acceptable limits'
        };
    }

    /**
     * Gate 5: Event Filter Check
     */
    validateEventFilter(signal) {
        const eventStatus = signal.market.event_filter.status;

        if (eventStatus === 'BLOCKED') {
            return {
                status: 'FAIL',
                reason: `Trading blocked due to: ${signal.market.event_filter.reason}`
            };
        }

        if (eventStatus === 'CAUTION') {
            // Allow but flag for wider stops or reduced size
            return {
                status: 'PASS',
                reason: `Caution mode: ${signal.market.event_filter.reason}`,
                warning: true
            };
        }

        return {
            status: 'PASS',
            reason: 'No event-based restrictions'
        };
    }

    /**
     * Auto-correction for common issues
     */
    autoCorrectSignal(signal, validationResult) {
        if (validationResult.isValid) return signal;

        const correctedSignal = { ...signal };
        let corrections = [];

        // Auto-correct timeframe R:R issues
        if (validationResult.details.timeframe_rr_check.status === 'FAIL') {
            const timeframe = signal.timeframe.entry;
            const bounds = this.rules.TIMEFRAME_RR_BOUNDS[timeframe];
            const atr = signal.risk.atr_value;

            // Adjust SL if too wide/tight
            if (signal.risk.stop_loss.atr_multiple > bounds.max_sl_atr) {
                correctedSignal.risk.stop_loss.atr_multiple = bounds.max_sl_atr;
                correctedSignal.risk.stop_loss.distance_points = atr * bounds.max_sl_atr;
                corrections.push(`Reduced SL to ${bounds.max_sl_atr} ATR`);
            }

            // Adjust target if unrealistic
            if (signal.risk.targets[0].atr_multiple > bounds.max_target_atr) {
                correctedSignal.risk.targets[0].atr_multiple = bounds.max_target_atr;
                correctedSignal.risk.targets[0].distance_points = atr * bounds.max_target_atr;
                corrections.push(`Reduced target to ${bounds.max_target_atr} ATR`);
            }

            // Recalculate R:R
            const slPoints = correctedSignal.risk.stop_loss.distance_points;
            const targetPoints = correctedSignal.risk.targets[0].distance_points;
            correctedSignal.risk.risk_reward_ratio = targetPoints / slPoints;
        }

        // Auto-correct position size for risk limits
        if (validationResult.details.risk_controls_check.status === 'FAIL') {
            const maxRisk = signal.risk.max_risk_per_trade;
            const limits = this.rules.RISK_LIMITS;
            // Reduce position size to meet risk limits
            const maxAllowedRisk = (limits.max_risk_per_trade_pct / 100) * 1000000; // Assuming 10L capital
            if (maxRisk > maxAllowedRisk) {
                const reductionFactor = maxAllowedRisk / maxRisk;
                correctedSignal.risk.position_size *= reductionFactor;
                correctedSignal.risk.max_risk_per_trade = maxAllowedRisk;
                corrections.push(`Reduced position size by ${((1 - reductionFactor) * 100).toFixed(1)}%`);
            }
        }

        correctedSignal.corrections = corrections;
        return correctedSignal;
    }
}

module.exports = SignalValidator;