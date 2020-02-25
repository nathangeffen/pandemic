"use strict";

(function(pandemic, undefined) {

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const living = ["unsusceptible", "susceptible", "uncontagious",
                    "contagious", "ill"];

    class Infection {

        constructor(rates) {
            this.rates = {
                incidence: 0.0,
                vaccinate: 0.0,
                lockdown: 0.0,
                uncontagious_contagious: 0.0,
                contagious_ill: 0.0,
                ill_cured: 0.0,
                ill_dead: 0.0,
                default_rate: 0.0
            };

            if (rates !== undefined) {
                this.setRates(rates);
            };
        }

        setRate(key, value) {
            if (key in this.rates) {
                this.rates[key] = value;
            } else {
                throw "Unknown rate: " + key;
            }
        }

        setRates(dict) {
            for (const [key, value] of Object.entries(dict)) {
                this.setRate(key, value);
            }
        }

        getNumInfected(stages) {
            return stages["uncontagious"] + stages["contagious"] + stages["ill"];
        }

        setNewInfections(stages) {
            let incidence = this.rates["incidence"];
            let X = stages["susceptible"];
            let Y = this.getNumInfected(stages) - stages["uncontagious"];
            let N = X + Y;
            let delta = X * incidence * ( Y / N );
            stages["susceptible"] -= delta;
            stages["uncontagious"] += delta;
        }

        setStages(stages, stage_from, stage_to, rate) {
            let delta = rate * stages[stage_from];
            stages[stage_from] -= delta;
            stages[stage_to] += delta;
        }

        stageToStage(stages, stage_from, stage_to) {
            let rate = this.rates["default_rate"];
            let stage_key = stage_from + "_" + stage_to;
            if (stage_key in this.rates) {
                rate = this.rates[stage_key];
            }
            this.setStages(stages, stage_from, stage_to, rate);
        }

        transition(stages) {
            this.setNewInfections(stages);
            if (stages["ill"] > 0.0 && this.rates["lockdown"] > 0.0) {
                this.setStages(stages, "susceptible", "unsusceptible",
                               this.rates["lockdown"]);
            }
            if (this.rates["vaccinate"] > 0.0) {
                this.setStages(stages, "susceptible", "unsusceptible",
                               this.rates["vaccinate"]);
            }
            this.stageToStage(stages, "uncontagious", "contagious");
            this.stageToStage(stages, "contagious", "ill");
            this.stageToStage(stages, "ill", "cured");
            this.stageToStage(stages, "ill", "dead");
        }
    }


    class Region {

        constructor(stages, infectionRates) {
            this.stages = {
                unsusceptible: 0,
                susceptible: 0,
                uncontagious: 0,
                contagious: 0,
                ill: 0,
                cured: 0,
                dead: 0
            };
            if (stages !== undefined) {
                this.setStages(stages);
            }
            this.infection = new Infection(infectionRates);
        }

        setStage(key, value) {
            if (key in this.stages) {
                this.stages[key] = value;
            } else {
                throw "Unknown stage: " + key;
            }
        }

        setStages(dict) {
            for (const [key, value] of Object.entries(dict)) {
                this.setStage(key, value);
            }
        }

        getNumInfected() {
            return this.infection.getNumInfected(this.stages);
        }

        update() {
            this.infection.transition(this.stages);
        }

        output(html, description, stage) {
            let val;
            html += `${description}: `;
            if (stage === "infections") {
                val = this.getNumInfected();
            } else {
                html = this.stages[stage];
            }
            html += new Intl.NumberFormat('en-US',
                                          {
                                              style: 'decimal',
                                              maximumFractionDigits: 0
                                          }).format(val) + "<br />";
            return html;
        }
    }

    class Migrations {

        constructor(arr) {
            this.migrations = [];
            for (let obj of arr) {
                let n = 1;
                let symmetrical = obj["symmetrical"] | 0.0;
                if (symmetrical > 0.0) n = 2;
                for (let i = 0; i < n; i++) {
                    let migration = {};
                    migration.illCorrection = obj["illCorrection"] || 1.0;
                    migration.rate = obj["rate"];
                    migration.actual = obj["actual"];
                    if (i == 0) {
                        migration.from = obj["from"];
                        migration.to = obj["to"];

                    } else {
                        migration.from = obj["to"];
                        migration.to = obj["from"];
                        if (migration.rate !== undefined) {
                            migration.rate *= symmetrical;
                        }
                        if (migration.actual !== undefined) {
                            migration.actual *= symmetrical;
                        }
                    }
                    this.migrations.push(migration);
                }
            }
        }

        update(regions) {
            for (let migration of this.migrations) {
                let region_from = regions[migration.from];
                let region_to = regions[migration.to];
                let actual = 0.0;
                let total = 0.0;
                for (let stage of living) {
                    total += region_from.stages[stage];
                }

                if (migration.actual === undefined) {
                    actual = migration.rate * total;
                } else {
                    actual = migration.actual;
                }

                for (let stage of living) {
                    let delta = actual * (region_from.stages[stage] / total);
                    if (stage === "ill") {
                        delta *= migration.illCorrection;
                    }
                    region_from.stages[stage] -= delta;
                    region_to.stages[stage] += delta;
                }
            }
        }
    }

    class Model {

        constructor(dict) {

            this.name = document.getElementById(dict["name"]);
            this.description = document.getElementById(dict["description"]);
            this.executeElem = document.getElementById(dict["executeElem"]);
            this.resultsElem = document.getElementById(dict["resultsElem"]);
            this.iterations = dict["iterations"] || 100;
            this.chartInfections = dict["chartInfections"];
            this.infectionTimeSeries = [];
            this.deathTimeSeries = [];
            this.mapElem = document.getElementById(dict["mapElem"]);
            this.onExecute = dict["onExecute"];
            this.onStop = dict["onStop"];

            this.iterationName = dict["iterationName"] || "Iteration";
            this.running = false;
            this.iteration = 0;
            this.regions = {};
            this.infectionRates = dict["defaultInfectionRates"];

            if (dict !== undefined) {
                if ("regions" in dict) {
                    this.addRegions(dict["regions"]);
                }
                if ("migrations" in dict) {
                    this.addMigrations(dict["migrations"]);
                }
            }

            if (this.chartInfections) {
                this.setupChartInfections();
            }
        }

        setupChartInfections() {
            let labels = [];
            for (let i = 0; i < this.iterations; i++) {
                labels.push(i);
            }
            this.chartLabels = labels;
            this.infectionChart = new Chart(
                document.getElementById(this.chartInfections),
                {
                    type: "line",
                    data: {
                        labels: labels,
                        labelString: "Days",
                        datasets: [
                            {
                                label: "Infections",
                                data: this.infectionTimeSeries,
                                fill: false,
                                "borderColor":"rgb(75, 192, 192)",
                                lineTension:0.1,
                            },
                            {
                                label: "Cumulative deaths",
                                data: this.deathTimeSeries,
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
                                    beginAtZero: true,
                                    callback: function(value, index, values) {
                                        const s = new Intl.NumberFormat('en-US',
                                          {
                                              style: 'decimal',
                                              maximumFractionDigits: 0
                                          }).format(value);
                                        return s;
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

        addRegion(dict)
        {
            const name = dict["name"];
            const stages = dict["stages"];
            let infectionRates = dict["infectionRates"];
            if (this.infectionRates !== undefined) {
                if (infectionRates === undefined) {
                    infectionRates = this.infectionRates;
                } else {
                    for (let [key, value] of
                         Object.entries(this.infectionRates)) {
                        if (! (key in infectionRates) ) {
                            infectionRates[key] = value;
                        }
                    }
                }
            }
            const region = new Region(stages, infectionRates);
            this.regions[name] = region;
            return region;
        }

        addRegions(arr) {
            for (const region of arr) {
                this.addRegion(region);
            }
        }

        addMigrations(arr)
        {
            this.migrations = new Migrations(arr);
        }

        countInfected() {
            if (this.infectionTimeSeries.length > this.iteration) {
                return this.infectionTimeSeries[this.infectionTimeSeries.length
                                                - 1];
            } else {
                const regions = this.regions;
                let arr = Object.keys(regions).
                    map(function (key) { return regions[key]; });
                const y = arr.reduce(
                    (accumulator, currentValue) =>
                        accumulator + currentValue.getNumInfected(), 0);
                this.infectionTimeSeries.push(y);
                return y;
            }
        }

        count(stage) {
            const regions = this.regions;
            let arr = Object.keys(regions).
                map(function (key) { return regions[key]; });
            const x = arr.reduce(
                (accumulator, currentValue) =>
                    accumulator + currentValue.stages[stage], 0);
            return x;
        }

        countDeaths() {
            if (this.deathTimeSeries.length > this.iteration) {
                return this.deathTimeSeries[this.deathTimeSeries.length - 1];
            } else {
                const d = this.count("dead");
                this.deathTimeSeries.push(d);
                return d;
            }
        }

        updateChartInfections() {
            this.infectionChart.update(
                {
                    // labels: this.infectionChartlabels,
                    series: [this.infectionTimeSeries, this.deathTimeSeries]
                }
            );
        }

        updateMap() {
            $("#mapcontainer").trigger('update', [
                {
                    mapOptions: data,
                }]);
        }

        update() {
            for (let [name, region] of Object.entries(this.regions)) {
                region.update();
            }
            this.migrations.update(this.regions);
            if (this.chartInfections !== undefined) {
                this.updateChartInfections();
            }
        }

        output_stage(html, stage, val) {
            let output_val = new Intl.NumberFormat('en-US',
                                                   {
                                                       style: 'decimal',
                                                       maximumFractionDigits: 0
                                                   }).format(val);
            html += stage + ": " + output_val;
            html += "<br /> "
            return html;
        }

        output() {
            let html;
            html = `<p>${this.iterationName}: ${this.iteration.toString()}<br/>`;

            for (let [name, region] of Object.entries(this.regions)) {
                html += `<b>${capitalizeFirstLetter(name)}</b><br />`;
                html = region.output(html, "Infected", "infections");
            }

            html += "<b>World</b><br/>";
            html = this.output_stage(html, "Susceptible",
                                     this.count("susceptible"));
            html = this.output_stage(html, "Infected", this.countInfected());
            html = this.output_stage(html, "Cured", this.count("cured"));
            html = this.output_stage(html, "Dead", this.countDeaths());
            html += "</p>";
            this.resultsElem.innerHTML = html + this.resultsElem.innerHTML;
        }

        loop() {
            this.update();
            this.output();
            this.iteration++;
            if (this.iteration < this.iterations) {
                if (this.running === true)
                    window.requestAnimationFrame(this.loop.bind(this));
            } else {
                this.onStop(this.executeElem);
            }
        }

        run() {
            this.running = !this.running;
            if (this.running === true) {
                if (this.onExecute !== undefined) {
                    this.onExecute(this.executeElem);
                }
                this.loop();
            } else {
                if (this.onStop !== undefined) {
                    this.onStop(this.executeElem);
                }
            }
        }

        setExecElem(name) {
            this.executeElem = document.getElementById(name);
            return this;
        }

        setResultsElem(name) {
            this.resultsElem = document.getElementById(name);
            return this;
        }

        setIterationName(name) {
            this.iterationName = name;
            return this;
        }
    }

    let models = [];

    pandemic.createModel = function(dict) {
        let model = new Model(dict);
        if (model.executeElem !== undefined) {
            model.executeElem.addEventListener("click", function() {
                model.run();
            });
        }

        models.push(model);
        return model;
    }

} (window.Pandemic = window.Pandemic || {}))
