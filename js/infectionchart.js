"use strict";

(function(infectionchart, undefined) {

    infectionchart.create = (dict) => {

        let labels = [];

        const setupChartInfections = () => {
            for (let i = 0; i < parms.iterations; i++) {
                labels.push(i);
            }
            parms.chartLabels = labels;
            parms.infectionChart = new Chart(
                document.getElementById(parms.chartInfections),
                {
                    type: "line",
                    data: {
                        labels: labels,
                        labelString: "Days",
                        datasets: [
                            {
                                label: "Infections",
                                data: parms.infectionTimeSeries,
                                fill: false,
                                "borderColor":"rgb(75, 192, 192)",
                                lineTension:0.1,
                            },
                            {
                                label: "Cumulative deaths",
                                data: parms.deathTimeSeries,
                                fill: false,
                                "borderColor":"red",
                                lineTension:0.1,
                            }
                        ]
                    },
		    options: {
		        title: {
                            display: true,
			    text: 'Infections and deaths'
		        },
		        scales: {
                            xAxes: [{
                                ticks: {
                                    fontSize: 10,
                                    beginAtZero: true,
                                },
                                display: true,
			        scaleLabel: {
				    display: true,
				    labelString: 'Day'
			        }
                            }],
                            yAxes: [{
                                ticks: {
                                    fontSize: 10,
                                    beginAtZero: true,
                                    callback: function(value, index, values) {
                                        // if (value >= 1000000) {
                                        //     return Math.round(value / 1000000)
                                        //         + "M";
                                        // } else {
                                            const s = new Intl.NumberFormat(
                                                'en-US',
                                                {
                                                    style: 'decimal',
                                                    maximumFractionDigits: 0
                                                }).format(value);
                                            return s;
                                        // }
                                    }
                                },
                                display: true,
			        scaleLabel: {
				    display: true,
				    labelString: '# People'
			        }
                            }],
		        },
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    const label = Number(tooltipItem.yLabel).
                                          toFixed(0);
                                    return label;
                                }
                            }
                        },
		    }
                }
            );
        }


        let parms = {
            chartInfections: dict["chartInfections"],
            iterations: dict["iterations"],
            infectionTimeSeries: dict["infectionTimeSeries"],
            deathTimeSeries: dict["deathTimeSeries"]
        };
        setupChartInfections(parms);
        parms.update = () => {
            if (labels.length < parms.infectionTimeSeries.length) {
                labels.push(labels[labels.length - 1] + 1);
            }
            parms.infectionChart.update(
                {
                    labels: labels,
                    series: [parms.infectionTimeSeries, parms.deathTimeSeries]
                }
            );
        }
        return parms;
    };

} (window.InfectionChart = window.InfectionChart || {}))
