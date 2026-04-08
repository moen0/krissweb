fetch('data/trading-journal.csv')
    .then(function(response) { return response.text(); })
    .then(function(csv) {
        var results = Papa.parse(csv, { header: false, skipEmptyLines: true });
        var rows = results.data;
        var trades = rows.slice(1).map(function(r) {
            return {
                type: r[2],
                volume: parseFloat(r[3]),
                symbol: r[4],
                entryPrice: parseFloat(r[5]),
                sl: parseFloat(r[6]),
                tp: parseFloat(r[7]),
                closePrice: parseFloat(r[9]),
                swap: parseFloat(r[10]),
                commissions: parseFloat(r[11]),
                profit: parseFloat(r[12]),
                pips: parseFloat(r[13])
            };
        });
        calculate(trades);
    });

function calculate(trades) {
    var total = trades.length;
    var wins = trades.filter(function(t) { return t.profit > 0; });
    var losses = trades.filter(function(t) { return t.profit <= 0; });

    // Win rate
    var winRate = (wins.length / total) * 100;

    // Average profit and average loss
    var avgProfit = wins.length > 0
        ? wins.reduce(function(s, t) { return s + t.profit; }, 0) / wins.length
        : 0;
    var avgLoss = losses.length > 0
        ? losses.reduce(function(s, t) { return s + t.profit; }, 0) / losses.length
        : 0;

    // Total P&L
    var totalPnL = trades.reduce(function(s, t) { return s + t.profit; }, 0);

    // Profit factor = gross profit / |gross loss|
    var grossProfit = wins.reduce(function(s, t) { return s + t.profit; }, 0);
    var grossLoss = Math.abs(losses.reduce(function(s, t) { return s + t.profit; }, 0));
    var profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Expectancy = (winRate * avgWin) - (lossRate * |avgLoss|)
    var expectancy = ((wins.length / total) * avgProfit) + ((losses.length / total) * avgLoss);

    // Average RRR — based on entry, SL, TP
    var rrrTrades = trades.filter(function(t) { return t.sl > 0 && t.tp > 0; });
    var avgRRR = 0;
    if (rrrTrades.length > 0) {
        var rrrSum = rrrTrades.reduce(function(s, t) {
            var risk = Math.abs(t.entryPrice - t.sl);
            var reward = Math.abs(t.tp - t.entryPrice);
            return s + (risk > 0 ? reward / risk : 0);
        }, 0);
        avgRRR = rrrSum / rrrTrades.length;
    }

    // Max drawdown — peak to trough on cumulative equity
    var equity = 0;
    var peak = 0;
    var maxDD = 0;
    trades.forEach(function(t) {
        equity += t.profit;
        if (equity > peak) peak = equity;
        var dd = peak - equity;
        if (dd > maxDD) maxDD = dd;
    });

    // Sharpe Ratio — mean return / std deviation of returns
    var returns = trades.map(function(t) { return t.profit; });
    var mean = totalPnL / total;
    var variance = returns.reduce(function(s, r) {
        return s + Math.pow(r - mean, 2);
    }, 0) / total;
    var stdDev = Math.sqrt(variance);
    var sharpe = stdDev > 0 ? mean / stdDev : 0;

    // Starting balance assumption: 50000 (FTMO standard)
    var startBalance = 50000;
    var balance = startBalance + totalPnL;

    // Populate DOM
    setText('equity', '$' + balance.toFixed(2));
    setText('balance', '$' + balance.toFixed(2));
    setText('win-rate', winRate.toFixed(2) + ' %');
    setText('avg-profit', '$' + avgProfit.toFixed(2));
    setText('avg-loss', '$' + avgLoss.toFixed(2));
    setText('num-trades', total);
    setText('sharpe', sharpe.toFixed(2));
    setText('profit-factor', profitFactor.toFixed(2));
    setText('avg-rrr', avgRRR.toFixed(2));
    setText('expectancy', '$' + expectancy.toFixed(2));
    setText('max-dd', '$' + maxDD.toFixed(2));

    // Color the win rate based on value
    var winEl = document.getElementById('win-rate');
    if (winEl) {
        winEl.classList.add(winRate >= 50 ? 'profit' : 'loss');
    }
}

function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
}