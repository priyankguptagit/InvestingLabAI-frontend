export const generateStudentReportPDF = (
    studentName: string,
    studentEmail: string,
    generatedAt: string,
    rawAnalysis: string,
    teacherReview?: {
        factor1Rating: number;
        factor2Rating: number;
        factor3Rating: number;
        aggregateScore: number;
        suggestions: string;
    }
) => {
    const reportDate = new Date(generatedAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Parse the AI analysis into sections
    const sections = rawAnalysis.split(/\d+\.\s+/).filter(Boolean);
    const defaultTitles = [
        "Portfolio Health", "Diversification", "Risk Assessment",
        "Strengths", "Weaknesses", "Short-term Recommendations", "Long-term Strategy"
    ];

    const parsedSections = sections.map((section: string, index: number) => {
        const lines = section.split('\n');
        let title = defaultTitles[index] || `Section ${index + 1}`;
        let content = section;

        if (lines.length > 1 && lines[0].length < 100) {
            title = lines[0].trim().replace(/[*:]/g, '');
            content = lines.slice(1).join('\n').trim();
        }

        return { title, content: content.replace(/[*#]/g, '') };
    });

    const aiInsightsHTML = parsedSections.map((section: { title: string; content: string }) => `
        <div class="insight-card">
            <div class="insight-title">${section.title}</div>
            <div class="insight-content">${section.content.replace(/\n/g, '<br/>')}</div>
        </div>
    `).join('');

    let evaluationHTML = '';

    if (teacherReview && teacherReview.aggregateScore !== undefined) {
        evaluationHTML = `
            <div class="section-title" style="margin-top: 40px; border-bottom-color: #10b981; color: #047857;">Coordinator Evaluation & Remarks</div>
            <div class="evaluation-container">
                <div class="score-card">
                    <div class="score-label">Final Aggregate Score</div>
                    <div class="score-value ${teacherReview.aggregateScore >= 60 ? 'good' : 'bad'}">${teacherReview.aggregateScore}<span style="font-size:18px; color: #94a3b8">/100</span></div>
                </div>
                
                <div class="ratings-grid">
                    <div class="rating-item">
                        <div class="rating-label">Portfolio Health</div>
                        <div class="rating-stars">${'★'.repeat(teacherReview.factor1Rating)}${'☆'.repeat(5 - teacherReview.factor1Rating)} (${teacherReview.factor1Rating}/5)</div>
                    </div>
                    <div class="rating-item">
                        <div class="rating-label">Diversification Target</div>
                        <div class="rating-stars">${'★'.repeat(teacherReview.factor2Rating)}${'☆'.repeat(5 - teacherReview.factor2Rating)} (${teacherReview.factor2Rating}/5)</div>
                    </div>
                    <div class="rating-item">
                        <div class="rating-label">Risk Management</div>
                        <div class="rating-stars">${'★'.repeat(teacherReview.factor3Rating)}${'☆'.repeat(5 - teacherReview.factor3Rating)} (${teacherReview.factor3Rating}/5)</div>
                    </div>
                </div>
                
                <div class="remarks-box">
                    <div class="remarks-title">Coordinator Remarks & Suggestions:</div>
                    <div class="remarks-content">${teacherReview.suggestions || 'No specific remarks provided.'}</div>
                </div>
            </div>
        `;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Analysis Report - ${studentName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; background: #fff; color: #0f172a; padding: 60px; line-height: 1.6; }
                
                /* Header Area */
                .header { border-bottom: 4px solid #4f46e5; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end;}
                .header-titles h1 { font-size: 32px; font-weight: 800; color: #1e1b4b; margin-bottom: 6px; letter-spacing: -0.5px;}
                .header-titles .subtitle { font-size: 15px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;}
                .brand { font-size: 24px; font-weight: 800; color: #4f46e5; display: flex; align-items: center; gap: 8px;}
                
                /* Meta Info */
                .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; padding: 20px 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
                .meta-item { display: flex; flex-direction: column; gap: 4px; }
                .meta-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;}
                .meta-value { font-size: 16px; font-weight: 700; color: #0f172a; }
                
                /* Sections */
                .section-title { font-size: 20px; font-weight: 700; color: #312e81; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #e0e7ff; display: flex; align-items: center; gap: 10px;}
                
                /* AI Insights Grid */
                .insights-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 40px;}
                .insight-card { padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.02);}
                .insight-title { font-size: 15px; font-weight: 700; color: #4338ca; margin-bottom: 8px;}
                .insight-content { font-size: 14px; color: #475569; line-height: 1.7;}
                
                /* Evaluation Styles */
                .evaluation-container { border: 1px solid #d1fae5; background: #ecfdf5; border-radius: 16px; padding: 32px; margin-bottom: 40px;}
                .score-card { text-align: center; margin-bottom: 32px;}
                .score-label { font-size: 14px; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;}
                .score-value { font-size: 48px; font-weight: 800; line-height: 1;}
                .score-value.good { color: #10b981; }
                .score-value.bad { color: #ef4444; }
                
                .ratings-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #a7f3d0;}
                .rating-item { display: flex; flex-direction: column; align-items: center; gap: 8px;}
                .rating-label { font-size: 13px; font-weight: 700; color: #065f46;}
                .rating-stars { font-size: 20px; color: #fbbf24; font-weight: 600; letter-spacing: 2px;}
                
                .remarks-box { padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #a7f3d0;}
                .remarks-title { font-size: 14px; font-weight: 700; color: #065f46; margin-bottom: 12px;}
                .remarks-content { font-size: 15px; color: #374151; font-style: italic; line-height: 1.7;}
                
                /* Footer */
                .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; font-weight: 500; color: #94a3b8; text-align: center; display: flex; justify-content: space-between;}
                
                @media print { 
                    body { padding: 0; } 
                    .insight-card { break-inside: avoid; }
                    .evaluation-container { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-titles">
                    <h1>Student Analysis Report</h1>
                    <div class="subtitle">Detailed Performance & Assessment Document</div>
                </div>
                <div class="brand">
                    <span>Praedico</span>
                </div>
            </div>

            <div class="meta">
                <div class="meta-item">
                    <span class="meta-label">Student Name</span>
                    <span class="meta-value">${studentName}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Email Address</span>
                    <span class="meta-value">${studentEmail}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Report Generated Date</span>
                    <span class="meta-value">${reportDate}</span>
                </div>
            </div>

            ${evaluationHTML}

            <div class="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #4f46e5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                AI Portfolio Analysis & 7-Factor Insights
            </div>
            
            <div class="insights-grid">
                ${aiInsightsHTML}
            </div>
            
            <div class="footer">
                <span>CONFIDENTIAL - Praedico Internal Document</span>
                <span>Auto-generated by Praedico AI Engine on ${reportDate}</span>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        // Wait for resources to load if any, then print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    }
};
