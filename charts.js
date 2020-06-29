const buildChartData = (data) => {
    let chartData = [];
    for(let date in data.cases){
        let newDataPoint = {
            x: date,
            y: data.cases[date]
        }
        chartData.push(newDataPoint);
    }
    return chartData;
}

const buildChart = (chartData) => {
    console.log("All if good");
    var timeFormat = 'MM/DD/YY';
    var ctx = document.getElementById('myChart').getContext('2d');
    var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            datasets: [{
                label: 'Total Cases',
                backgroundColor: '#1d2c4d',
                borderColor: '#1d2c4d',
                data: chartData
            }]
        },

        // Configuration options go here
        options: {
            maintainAspectRatio: false,
            tooltips: {
                mode: 'index',
                intersect: false
            },
            scales:     {
                xAxes: [{
                    type: "time",
                    time: {
                        format: timeFormat,
                        tooltipFormat: 'll'
                    }
                }],
                yAxes: [{
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: function(value, index, values) {
                            return numeral(value).format('0,0');
                        }
                    }
                }]
            }
        }
    });
}

const buildPieChart = (data) => {
    var ctx = document.getElementById('myPieChart').getContext('2d');
    var myPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    data.active, 
                    data.recovered, 
                    data.deaths
                ],
                backgroundColor: [
                    '#9d80fe',
                    '#7dd71d',
                    '#fb4443'
                ]
            }],
        
            // These labels appear in the legend and in the tooltips when hovering different arcs
            labels: [
                'Active',
                'Recovered',
                'Deaths'
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}
