// charts.js - Gráficos de signos vitales
const tokenChart = localStorage.getItem('safewatch_token');
const userDataChart = JSON.parse(localStorage.getItem('safewatch_user') || '{}');

let chartCardiaco = null;
let chartOxigeno = null;
let chartTemperatura = null;

async function cargarGraficos() {
    try {
        const response = await fetch(`https://safewatch-backend-9rq6.onrender.com/api/signos/${userDataChart.id}`, {
            headers: { 'Authorization': `Bearer ${tokenChart}` }
        });
        const signos = await response.json();

        if (signos.length === 0) {
            console.log('No hay datos de signos');
            return;
        }

        signos.reverse();

        const labels = signos.map(s => {
            const fecha = new Date(s.timestamp);
            return fecha.toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        });

        const ritmoCardiaco = signos.map(s => s.ritmo_cardiaco);
        const oxigeno = signos.map(s => s.oxigeno_sangre);
        const temperatura = signos.map(s => s.temperatura);

        const gridColor = 'rgba(255,255,255,0.1)';

        if (chartCardiaco) chartCardiaco.destroy();
        if (chartOxigeno) chartOxigeno.destroy();
        if (chartTemperatura) chartTemperatura.destroy();

        const ctx1 = document.getElementById('chartCardiaco')?.getContext('2d');
        if (ctx1) {
            chartCardiaco = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ritmo Cardíaco (lpm)',
                        data: ritmoCardiaco,
                        borderColor: '#00bfa5',
                        backgroundColor: 'rgba(0, 191, 165, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#00bfa5'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#fff' } } },
                    scales: {
                        x: { ticks: { color: '#aaa' }, grid: { color: gridColor } },
                        y: { ticks: { color: '#aaa' }, grid: { color: gridColor }, min: 40, max: 130 }
                    }
                }
            });
        }

        const ctx2 = document.getElementById('chartOxigeno')?.getContext('2d');
        if (ctx2) {
            chartOxigeno = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Oxígeno (%)',
                        data: oxigeno,
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#1a73e8'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#fff' } } },
                    scales: {
                        x: { ticks: { color: '#aaa' }, grid: { color: gridColor } },
                        y: { ticks: { color: '#aaa' }, grid: { color: gridColor }, min: 80, max: 100 }
                    }
                }
            });
        }

        const ctx3 = document.getElementById('chartTemperatura')?.getContext('2d');
        if (ctx3) {
            chartTemperatura = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Temperatura (°C)',
                        data: temperatura,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#ff9800'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#fff' } } },
                    scales: {
                        x: { ticks: { color: '#aaa' }, grid: { color: gridColor } },
                        y: { ticks: { color: '#aaa' }, grid: { color: gridColor }, min: 35, max: 39 }
                    }
                }
            });
        }

        console.log('📊 Gráficos cargados:', signos.length, 'registros');

    } catch (error) {
        console.error('Error gráficos:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarGraficos, 1000);
});