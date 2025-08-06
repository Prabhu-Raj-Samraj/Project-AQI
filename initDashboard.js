// ===================================
// AIRSIGHT PROJECT - DASHBOARD MODULE
// Professional redesigned recommendations
// ===================================

let currentDate = window.AirSightDate.getCurrentDate();
let dashboardChart = null;

async function initDashboard() {
    try {
        showLoadingState();
        
        // Use centralized date
        const apiDate = window.AirSightDate.getCurrentDate();
        const response = await fetch(`${API_BASE_URL}/dashboard?date=${apiDate}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch dashboard data');
        }
        
        console.log('Dashboard data received for date:', apiDate, data);
        
        updateDashboardCards(data);
        updateAQIBanner(data);
        updateAirQualityChart(data.chart_aqi);
        await updateProfessionalRecommendations();
        
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState(error.message);
    }
}

function updateDashboardCards(data) {
    const aqiCard = document.querySelector('.card.green');
    if (aqiCard) {
        aqiCard.querySelector('.card-value').textContent = data.current_aqi;
        aqiCard.querySelector('.card-label').textContent = data.current_category;
        updateCardColor(aqiCard, data.current_aqi);
    }
    
    const pollutantCard = document.querySelector('.card.blue');
    if (pollutantCard) {
        const shortName = getShortPollutantName(data.main_pollutant);
        pollutantCard.querySelector('.card-value').innerHTML = shortName;
    }
    
    const predictionCards = document.querySelectorAll('.card');
    const predictionCard = predictionCards[2];
    if (predictionCard) {
        predictionCard.querySelector('.card-value').textContent = data.next_day_aqi;
        predictionCard.querySelector('.card-label').textContent = data.next_day_category;
        updateCardColor(predictionCard, data.next_day_aqi);
    }
}

function updateCardColor(card, aqi) {
    card.classList.remove('green', 'blue', 'yellow', 'orange', 'red');
    
    if (aqi <= 50) {
        card.classList.add('green');
    } else if (aqi <= 100) {
        card.classList.add('yellow');
    } else if (aqi <= 150) {
        card.classList.add('orange');
    } else {
        card.classList.add('red');
    }
}

function getShortPollutantName(pollutant) {
    const mapping = {
        'PM2.5 - Local Conditions': 'PM<sub>2.5</sub>',
        'PM10 Total 0-10um STP': 'PM<sub>10</sub>',
        'Ozone': 'O<sub>3</sub>',
        'Nitrogen dioxide (NO2)': 'NO<sub>2</sub>',
        'Carbon monoxide': 'CO',
        'Sulfur dioxide': 'SO<sub>2</sub>'
    };
    return mapping[pollutant] || pollutant;
}

function updateAQIBanner(data) {
    const aqiMessage = document.getElementById("aqi-message");
    if (!aqiMessage) return;
    
    const aqi = data.current_aqi;
    let icon, headline, description, bannerClass;
    
    if (aqi <= 50) {
        icon = '<img src="./images/happy-ezgif.com-gif-maker.gif" alt="Good AQI" class="aqi-icon" />';
        headline = "Great News! The air quality is good.";
        description = "It's a perfect day to be outside. Enjoy the fresh air!";
        bannerClass = "good";
    } else if (aqi <= 100) {
        icon = '<img src="./images/neutral-ezgif.com-gif-maker.gif" alt="Moderate AQI" class="aqi-icon" />';
        headline = "Air Quality is Moderate.";
        description = "Consider limiting prolonged outdoor exertion if sensitive.";
        bannerClass = "moderate";
    } else if (aqi <= 150) {
        icon = '<img src="./images/sad-ezgif.com-gif-maker.gif" alt="Unhealthy AQI" class="aqi-icon" />';
        headline = "Unhealthy for Sensitive Groups!";
        description = "Sensitive individuals should avoid outdoor activities.";
        bannerClass = "unhealthy";
    } else {
        icon = '<img src="./images/mask-ezgif.com-gif-maker.gif" alt="Dangerous AQI" class="aqi-icon" />';
        headline = "Unhealthy Air Quality!";
        description = "Avoid outdoor activities. Use air purifiers indoors.";
        bannerClass = "unhealthy";
    }
    
    aqiMessage.className = `aqi-banner ${bannerClass}`;
    aqiMessage.innerHTML = `
        <div class="icon">${icon}</div>
        <div class="text">
            <div class="headline">${headline}</div>
            <div class="description">${description}</div>
        </div>
    `;
    
    // Force GIF size after DOM update
    setTimeout(() => {
        const gifElement = aqiMessage.querySelector('.aqi-icon');
        if (gifElement) {
            gifElement.style.width = '40px';
            gifElement.style.height = '40px';
            gifElement.style.minWidth = '40px';
            gifElement.style.minHeight = '40px';
            gifElement.style.maxWidth = '40px';
            gifElement.style.maxHeight = '40px';
            gifElement.setAttribute('width', '50');
            gifElement.setAttribute('height', '50');
            
            console.log('🔧 Forced GIF size to 50x50px');
        }
    }, 100);
}

// Air Quality Chart
function updateAirQualityChart(chartData) {
    const ctx = document.getElementById("airQualityChart")?.getContext("2d");
    const stepSize = 20;
    const rawMax = Math.max(...chartData);
    const roundedMax = Math.ceil(rawMax / stepSize) * stepSize;
    if (!ctx) return;

    if (dashboardChart) {
        dashboardChart.destroy();
    }

    function getAQIColor(aqi) {
        if (aqi <= 50) return "#50cd89";       // Green
        else if (aqi <= 100) return "#fbbf24"; // Yellow
        else if (aqi <= 150) return "#f97316"; // Orange
        else return "#ef4444";                 // Red
    }

    dashboardChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
                label: "Predicted AQI",
                data: chartData,
                borderColor: "rgba(0,0,0,0)",
                backgroundColor: "rgba(0,0,0,0)",
                pointRadius: 0,
                pointHoverRadius: 8,
                pointBackgroundColor: "#ffffff",
                pointBorderColor: (ctx) => getAQIColor(chartData[ctx.dataIndex]),
                pointBorderWidth: 3,
                pointHoverBackgroundColor: "#ffffff",
                pointHoverBorderWidth: 4,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuad'
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'AI-Predicted Air Quality Index - 12 Month Trend',
                    font: { size: 13, weight: 'bold' },
                    color: '#374151',
                    padding: {top: 5, bottom: 8}
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return `${context[0].label} 2025`;
                        },
                        label: function(context) {
                            const aqi = context.parsed.y;
                            let category, emoji;
                            if (aqi <= 50) {
                                category = "Good";
                                emoji = "🟢";
                            } else if (aqi <= 100) {
                                category = "Moderate";
                                emoji = "🟡";
                            } else if (aqi <= 150) {
                                category = "Unhealthy for Sensitive";
                                emoji = "🟠";
                            } else {
                                category = "Unhealthy";
                                emoji = "🔴";
                            }
                            return [
                                `${emoji} AQI: ${Math.round(aqi)}`,
                                `Category: ${category}`,
                                `AI Prediction Confidence: High`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: "#374151",
                        padding: 10,
                        font: { size: 12, weight: '500' }
                    },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: 130,
                    ticks: {
                        stepSize: stepSize,
                        color: "#374151",
                        padding: 10,
                        font: { size: 12, weight: '500' },
                        callback: value => `${value} AQI`
                    },
                    grid: {
                        display: false,
                        borderDash: (ctx) => {
                            const value = ctx.tick.value;
                            return (value === 50 || value === 100 || value === 150) ? [] : [3, 3];
                        },
                        drawBorder: false
                    },
                    border: { display: false }
                }
            },
            layout: {
                padding: { top: 12, bottom: 20, left: 10, right: 10 }
            }
        },
        plugins: [
            {
                id: 'aqiGradientFill',
                beforeDatasetDraw(chart) {
                    const { ctx, chartArea: { bottom, left, right } } = chart;
                    const dataset = chart.data.datasets[0];
                    const meta = chart.getDatasetMeta(0);
                    if (!meta || !meta.data || meta.data.length < 2) return;

                    const horizontalGradient = ctx.createLinearGradient(left, 0, right, 0);
                    horizontalGradient.addColorStop(0, "#50cd89" + "22");
                    horizontalGradient.addColorStop(0.33, "#fbbf24" + "22");
                    horizontalGradient.addColorStop(0.66, "#f97316" + "22");
                    horizontalGradient.addColorStop(1, "#ef4444" + "22");

                    ctx.save();
                    ctx.beginPath();

                    const first = meta.data[0];
                    ctx.moveTo(first.x, bottom);
                    ctx.lineTo(first.x, first.y);

                    for (let i = 0; i < meta.data.length - 1; i++) {
                        const p0 = meta.data[i];
                        const p1 = meta.data[i + 1];
                        const cpX = (p0.x + p1.x) / 2;
                        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
                    }

                    const last = meta.data[meta.data.length - 1];
                    ctx.lineTo(last.x, bottom);
                    ctx.closePath();

                    ctx.fillStyle = horizontalGradient;
                    ctx.fill();
                    ctx.restore();
                }
            },
            {
                id: 'aqiGradientLine',
                afterDatasetDraw(chart) {
                    const { ctx } = chart;
                    const dataset = chart.data.datasets[0];
                    const meta = chart.getDatasetMeta(0);
                    if (!meta || !meta.data || meta.data.length < 2) return;

                    ctx.save();
                    ctx.lineWidth = 3;

                    for (let i = 0; i < meta.data.length - 1; i++) {
                        const p0 = meta.data[i];
                        const p1 = meta.data[i + 1];
                        const aqi0 = dataset.data[i];
                        const aqi1 = dataset.data[i + 1];

                        const gradient = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
                        gradient.addColorStop(0, getAQIColor(aqi0));
                        gradient.addColorStop(1, getAQIColor(aqi1));

                        const cpX = (p0.x + p1.x) / 2;

                        ctx.beginPath();
                        ctx.strokeStyle = gradient;
                        ctx.moveTo(p0.x, p0.y);
                        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            }
        ]
    });

    createCustomLegend();
}

function createCustomLegend() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    const existingLegend = chartContainer.querySelector('.custom-aqi-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    const legendHTML = `
        <div class="custom-aqi-legend">
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color good"></div>
                    <span class="legend-text">Good (0-50)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color moderate"></div>
                    <span class="legend-text">Moderate (51-100)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color unhealthy"></div>
                    <span class="legend-text">Unhealthy (101-150)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color very-unhealthy"></div>
                    <span class="legend-text">Very Unhealthy (151+)</span>
                </div>
            </div>
        </div>
    `;
    
    chartContainer.insertAdjacentHTML('beforeend', legendHTML);
}

// PROFESSIONAL RECOMMENDATIONS UPDATE
async function updateProfessionalRecommendations() {
    try {
        console.log('🔄 Starting professional recommendations update...');
        
        // Use centralized date
        const apiDate = window.AirSightDate.getCurrentDate();
        const response = await fetch(`${API_BASE_URL}/recommendations?date=${apiDate}`);
        const data = await response.json();
        
        console.log('✅ Recommendations API response:', data);
        
        const recommendationList = document.getElementById("recommendation-list");
        if (!recommendationList) {
            console.error('❌ Recommendation list element not found');
            return;
        }
        
        // Clear existing content
        recommendationList.innerHTML = '';
        
        // Get recommendations based on AQI
        const recommendations = getProfessionalRecommendations(data.aqi, data.category);
        
        console.log(`📋 Generated ${recommendations.length} professional recommendations for AQI ${data.aqi}`);
        
        // Create status card
        const statusCard = createStatusCard(data.aqi, data.category);
        
        let recommendationsHTML = statusCard;
        
        recommendations.forEach((rec, index) => {
            recommendationsHTML += `
                <div class="rec-card ${rec.priority}" style="animation-delay: ${index * 0.1}s">
                    <div class="rec-left">
                        <div class="rec-mini-icon ${rec.iconType}">
                            <i class="fa-solid ${rec.icon}"></i>
                        </div>
                        <div class="rec-border ${rec.priority}"></div>
                    </div>
                    <div class="rec-text">
                        <h4>${rec.title}</h4>
                        <p>${rec.description}</p>
                    </div>
                </div>
            `;
        });
        
        recommendationList.innerHTML = recommendationsHTML;
        
        console.log('✅ Professional recommendations rendered successfully');
        
    } catch (error) {
        console.error('❌ Error updating recommendations:', error);
        
        // Fallback recommendations
        const recommendationList = document.getElementById("recommendation-list");
        if (recommendationList) {
            recommendationList.innerHTML = `
                <div class="aqi-status-card">
                    <div class="status-indicator loading"></div>
                    <div class="status-content">
                        <span class="status-title">Loading AQI Data...</span>
                        <span class="status-value">Please wait</span>
                    </div>
                </div>
                <div class="rec-card medium">
                    <div class="rec-left">
                        <div class="rec-mini-icon medium">
                            <i class="fa-solid fa-info-circle"></i>
                        </div>
                        <div class="rec-border medium"></div>
                    </div>
                    <div class="rec-text">
                        <h4>Stay Informed</h4>
                        <p>Monitor air quality updates regularly for health guidance.</p>
                    </div>
                </div>
            `;
        }
    }
}

function createStatusCard(aqi, category) {
    let statusClass = 'moderate';
    let statusTitle = 'Moderate Air Quality';
    let aqiLevel = 'moderate';
    
    if (aqi <= 50) {
        statusClass = 'good';
        statusTitle = 'Good Air Quality';
        aqiLevel = 'good';
    } else if (aqi <= 100) {
        statusClass = 'moderate';
        statusTitle = 'Moderate Air Quality';
        aqiLevel = 'moderate';
    } else if (aqi <= 150) {
        statusClass = 'unhealthy';
        statusTitle = 'Unhealthy for Sensitive';
        aqiLevel = 'unhealthy';
    } else {
        statusClass = 'dangerous';
        statusTitle = 'Unhealthy Air Quality';
        aqiLevel = 'dangerous';
    }
    
    return `
        <div class="aqi-status-card ${statusClass}">
            <div class="status-indicator ${statusClass}"></div>
            <div class="status-content">
                <span class="status-title">${statusTitle}</span>
                <span class="status-value">AQI: ${aqi}</span>
            </div>
        </div>
        <script>
            document.querySelector('.recommendations-wrapper').setAttribute('data-aqi-level', '${aqiLevel}');
        </script>
    `;
}

function getProfessionalRecommendations(aqi, category) {
    const recommendations = [];
    
    if (aqi <= 50) {
        recommendations.push({
            icon: 'fa-person-hiking',
            iconType: 'good',
            title: 'Perfect for Outdoor Activities',
            description: 'Great time for jogging, cycling, or visiting parks',
            priority: 'good'
        });
        
        recommendations.push({
            icon: 'fa-wind',
            iconType: 'good',
            title: 'Fresh Air Advantage',
            description: 'Open windows for natural ventilation',
            priority: 'good'
        });
        
        recommendations.push({
            icon: 'fa-heart',
            iconType: 'good',
            title: 'Cardio Exercise Time',
            description: 'Perfect for heart-healthy workouts',
            priority: 'good'
        });

        recommendations.push({
            icon: 'fa-sun',
            iconType: 'good',
            title: 'Enjoy the Outdoors',
            description: 'Take advantage of clean air',
            priority: 'good'
        });
        
    } else if (aqi <= 100) {
        recommendations.push({
            icon: 'fa-triangle-exclamation',
            iconType: 'warning',
            title: 'Limit Long Outdoor Time',
            description: 'Sensitive individuals should be cautious',
            priority: 'warning'
        });
        
        recommendations.push({
            icon: 'fa-clock',
            iconType: 'warning',
            title: 'Time Your Activities',
            description: 'Plan outdoor activities for morning/evening',
            priority: 'warning'
        });
        
        recommendations.push({
            icon: 'fa-house',
            iconType: 'medium',
            title: 'Close Windows at Peak',
            description: 'Keep indoor air clean during high pollution',
            priority: 'medium'
        });
        
        recommendations.push({
            icon: 'fa-stethoscope',
            iconType: 'medium',
            title: 'Health Monitoring',
            description: 'Extra care for asthma and heart conditions',
            priority: 'medium'
        });
        
    } else if (aqi <= 150) {
        recommendations.push({
            icon: 'fa-head-side-mask',
            iconType: 'danger',
            title: 'Wear N95 Masks',
            description: 'Essential protection when outside',
            priority: 'critical'
        });
        
        recommendations.push({
            icon: 'fa-ban',
            iconType: 'danger',
            title: 'Avoid Outdoor Exercise',
            description: 'Move all workouts indoors immediately',
            priority: 'critical'
        });
        
        recommendations.push({
            icon: 'fa-fan',
            iconType: 'warning',
            title: 'Use Air Purifiers',
            description: 'Run on high setting for clean air',
            priority: 'warning'
        });
        
        recommendations.push({
            icon: 'fa-baby',
            iconType: 'danger',
            title: 'Protect Vulnerable',
            description: 'Keep children and elderly indoors',
            priority: 'critical'
        });
        
    } else {
        recommendations.push({
            icon: 'fa-circle-exclamation',
            iconType: 'danger',
            title: 'HEALTH EMERGENCY',
            description: 'Avoid ALL outdoor activities',
            priority: 'emergency'
        });
        
        recommendations.push({
            icon: 'fa-house-lock',
            iconType: 'danger',
            title: 'Stay Indoors & Seal',
            description: 'Minimize exposure to outdoor air',
            priority: 'emergency'
        });
        
        recommendations.push({
            icon: 'fa-phone-medical',
            iconType: 'danger',
            title: 'Seek Medical Help',
            description: 'Contact healthcare for breathing issues',
            priority: 'emergency'
        });
        
        recommendations.push({
            icon: 'fa-air-freshener',
            iconType: 'danger',
            title: 'Max Air Filtration',
            description: 'Run all purifiers on maximum',
            priority: 'emergency'
        });
    }
    
    return recommendations.slice(0, 4);
}

function showLoadingState() {
    const container = document.querySelector('.dashboard-content');
    if (container) {
        container.style.opacity = '0.7';
        container.style.pointerEvents = 'none';
    }
}

function hideLoadingState() {
    const container = document.querySelector('.dashboard-content');
    if (container) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }
}

function showErrorState(message) {
    const container = document.querySelector('.dashboard-content');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <h2>⚠️ Error Loading Dashboard</h2>
                <p>${message}</p>
                <button onclick="initDashboard()">🔄 Retry</button>
            </div>
        `;
    }
}

// Date picker functionality for dashboard
function addDatePicker() {
    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('dashboard-date-picker')) {
        const datePickerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <label for="dashboard-date-picker" style="font-weight: 500;">Select Date:</label>
                <input 
                    type="date" 
                    id="dashboard-date-picker" 
                    value="${currentDate}"
                    style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;"
                />
                <button 
                    onclick="updateDashboardDate()" 
                    style="
                        padding: 8px 16px; 
                        background: #e1fddc; 
                        border: none; 
                        border-radius: 5px; 
                        cursor: pointer;
                        font-weight: 500;
                    "
                >
                    Predict
                </button>
            </div>
        `;
        
        topbar.insertAdjacentHTML('beforeend', datePickerHTML);
    }
}

async function updateDashboardDate() {
    const datePicker = document.getElementById('dashboard-date-picker');
    if (datePicker) {
        // Update both local and global date
        currentDate = datePicker.value;
        window.AirSightDate.getCurrentDate = function() { return currentDate; };
        console.log('🗓️ Updating dashboard for date:', currentDate);
        await initDashboard();
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.dashboard-content')) {
        addDatePicker();
        initDashboard();
    }
});

// Export for global access
window.updateDashboardDate = updateDashboardDate;
window.initDashboard = initDashboard;