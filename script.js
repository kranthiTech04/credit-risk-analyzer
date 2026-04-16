document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assessment-form');
    
    // Result sections
    const emptyState = document.getElementById('empty-state');
    const resultContent = document.getElementById('result-content');
    const riskBadge = document.getElementById('risk-badge');
    const scoreCircle = document.getElementById('score-circle');
    const riskEmoji = document.getElementById('risk-emoji');
    const explanationBox = document.getElementById('explanation-box');
    const dtiDisplay = document.getElementById('dti-display');
    const lateDisplay = document.getElementById('late-display');
    
    // History
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Load history from localStorage
    let assessments = JSON.parse(localStorage.getItem('credit_assessments') || '[]');
    renderHistory();

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const income = parseFloat(document.getElementById('monthly-income').value);
        const debt = parseFloat(document.getElementById('existing-debt').value);
        const latePayments = parseInt(document.getElementById('late-payments').value);
        const utilization = parseFloat(document.getElementById('credit-utilization').value);

        // Validation
        if (income <= 0) {
            alert("Monthly income must be greater than 0");
            return;
        }

        // Calculate metrics
        const dti = (debt / income) * 100;
        
        // Analyze logic
        // If Debt-to-Income > 40% OR > 2 late payments => High Risk
        const isHighRisk = dti > 40 || latePayments > 2;

        const result = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            income,
            debt,
            latePayments,
            utilization,
            dti: dti.toFixed(1),
            isHighRisk
        };

        // Update UI
        updateResultUI(result);

        // Save History
        assessments.unshift(result);
        if (assessments.length > 20) assessments.pop(); // Keep last 20
        localStorage.setItem('credit_assessments', JSON.stringify(assessments));
        
        renderHistory();
    });

    clearHistoryBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to clear all assessment history?")) {
            assessments = [];
            localStorage.setItem('credit_assessments', JSON.stringify(assessments));
            renderHistory();
        }
    });

    function updateResultUI(result) {
        // Toggle visibility
        emptyState.classList.add('hidden');
        resultContent.classList.remove('hidden');

        // Animation reset hack
        resultContent.style.animation = 'none';
        resultContent.offsetHeight; /* trigger reflow */
        resultContent.style.animation = null;

        // Populate metrics
        dtiDisplay.textContent = `${result.dti}%`;
        lateDisplay.textContent = result.latePayments;

        // Apply styles based on risk
        if (result.isHighRisk) {
            // High Risk Styling
            riskBadge.textContent = 'High Risk';
            riskBadge.className = 'badge risky';
            
            scoreCircle.className = 'score-circle risky';
            riskEmoji.textContent = '🔴';
            
            explanationBox.style.borderLeftColor = 'var(--danger)';
            
            // Generate explanation
            let reasons = [];
            if (result.dti > 40) reasons.push(`High Debt-to-Income ratio (${result.dti}%) exceeds the 40% safe threshold`);
            if (result.latePayments > 2) reasons.push(`History of consecutive late payments (${result.latePayments} in last year) implies lower reliability`);
            
            explanationBox.innerHTML = `<strong>Assessment:</strong> This profile is flagged as <em>High Risk</em>. Factors contributing to this assessment: <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--danger);"><li>${reasons.join('</li><li>')}</li></ul>`;
        } else {
            // Low Risk Styling
            riskBadge.textContent = 'Low Risk';
            riskBadge.className = 'badge safe';
            
            scoreCircle.className = 'score-circle safe';
            riskEmoji.textContent = '🟢';
            
            explanationBox.style.borderLeftColor = 'var(--success)';
            
            explanationBox.innerHTML = `<strong>Assessment:</strong> This profile is assessed as <em>Low Risk</em>. The Debt-to-Income ratio (${result.dti}%) is within healthy limits, and payment history is solid.`;
        }
    }

    function renderHistory() {
        historyList.innerHTML = '';
        
        if (assessments.length === 0) {
            historyList.innerHTML = '<div style="text-align:center; color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">No history available</div>';
            return;
        }

        assessments.forEach(item => {
            const div = document.createElement('div');
            div.className = `history-item ${item.isHighRisk ? 'risky' : 'safe'}`;
            
            const statusLabel = item.isHighRisk ? 'High Risk' : 'Low Risk';
            const badgeClass = item.isHighRisk ? 'risky' : 'safe';
            
            div.innerHTML = `
                <div class="history-info">
                    <span class="history-details">$${item.income}/mo | DTI: ${item.dti}%</span>
                    <span class="history-date">${item.date}</span>
                </div>
                <div class="history-badge ${badgeClass}">${statusLabel}</div>
            `;
            
            historyList.appendChild(div);
        });
    }
});
