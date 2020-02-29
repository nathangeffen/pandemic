"use strict";

(function(pandemic, undefined) {

    const living = ["unsusceptible", "susceptible", "uncontagious",
                    "contagious", "ill", "cured"];

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

        countInfected(stages) {
            return stages["uncontagious"] + stages["contagious"] + stages["ill"];
        }

        countPopulation(stages) {
            let total = 0.0;
            for (let stage of living) {
                total += stages[stage];
            }
            return total;
        }

        setNewInfections(stages) {
            let incidence = this.rates["incidence"];
            let X = stages["susceptible"];
            let Y = this.countInfected(stages) - stages["uncontagious"];
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
            if (stages["ill"] > 1.0 && this.rates["lockdown"] > 0.0) {
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

        countInfected() {
            return this.infection.countInfected(this.stages);
        }

        countPopulation() {
            return this.infection.countPopulation(this.stages);
        }

        update() {
            this.infection.transition(this.stages);
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
                    migration.screening = obj["screening"] || 0.0;
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

                const allowedIn = 1.0 - migration.screening;
                for (let stage of living) {
                    let delta = actual * (region_from.stages[stage] / total);
                    if (stage === "uncontagious" ||
                        stage === "contagious" ||
                        stage === "ill") {
                        delta *= allowedIn;
                        if (stage === "ill") {
                            delta *= migration.illCorrection;
                        }
                    }
                    region_from.stages[stage] -= delta;
                    region_to.stages[stage] += delta;
                }
            }
        }
    }

    pandemic.create = (dict) => {
        let parms = {
            infectionTimeSeries: [],
            deathTimeSeries: [],
            iteration: 0,
            iterationName: dict["iterationName"] || "Iteration",
            infectionRates: dict["defaultStageChangeRates"],
            regions: {},
            migrations: []
        };

        parms.addRegion = (dict) => {
            const name = dict["name"];
            const stages = dict["stages"];
            let infectionRates = dict["infectionRates"];
            if (parms.infectionRates !== undefined) {
                if (infectionRates === undefined) {
                    infectionRates = parms.infectionRates;
                } else {
                    for (let [key, value] of
                         Object.entries(parms.infectionRates)) {
                        if (! (key in infectionRates) ) {
                            infectionRates[key] = value;
                        }
                    }
                }
            }
            const region = new Region(stages, infectionRates);
            parms.regions[name] = region;
            return region;
        }

        parms.addRegions = (arr) => {
            for (const region of arr) {
                parms.addRegion(region);
            }
        }

        parms.addMigrations = (arr) => {
            parms.migrations = new Migrations(arr);
        }

        parms.countInfected = () => {
            if (parms.infectionTimeSeries.length > parms.iteration) {
                return parms.infectionTimeSeries[parms.infectionTimeSeries.length
                                                 - 1];
            } else {
                let arr = Object.keys(parms.regions).
                    map(function (key) { return parms.regions[key]; });
                const y = arr.reduce(
                    (accumulator, currentValue) =>
                        accumulator + currentValue.countInfected(), 0);
                parms.infectionTimeSeries.push(y);
                return y;
            }
        }

        parms.count = (stage) => {
            let arr = Object.keys(parms.regions).
                map(function (key) { return parms.regions[key]; });
            const x = arr.reduce(
                (accumulator, currentValue) =>
                    accumulator + currentValue.stages[stage], 0);
            return x;
        }

        parms.countDeaths = () => {
            if (parms.deathTimeSeries.length > parms.iteration) {
                return parms.deathTimeSeries[parms.deathTimeSeries.length - 1];
            } else {
                const d = parms.count("dead");
                parms.deathTimeSeries.push(d);
                return d;
            }
        }

        parms.update = () => {
            parms.iteration++;
            for (let [name, region] of Object.entries(parms.regions)) {
                region.update();
            }
            parms.migrations.update(parms.regions);
        }


        if (dict !== undefined) {
            if ("regions" in dict) {
                parms.addRegions(dict["regions"]);
            }
        }

        if ("migrations" in dict) {
            parms.addMigrations(dict["migrations"]);
        }

        return parms;
    }
} (window.Pandemic = window.Pandemic || {}))
