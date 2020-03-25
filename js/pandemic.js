"use strict";


(function(pandemic, undefined) {

    const living = ["unsusceptible", "susceptible", "uncontagious",
                    "contagious", "ill", "cured"];

    class Infection {

        constructor(rates) {
            this.rates = {
                avgContacts: 0.0,
                probInfection: 0.0,
                lockdownContactMult: 1.0,
                lockdownAfter: 100.0,
                lockdownIterations: 21,
                lockdownMinBetween: 21,
                lockdownMaxTimes: 1000000,
                probInfectionSummer: undefined,
                summerStart: 0,
                summerDuration: 180,
                vaccinate: 0.0,
                uncontagious_contagious: 0.0,
                contagious_ill: 0.0,
                ill_cured: 0.0,
                ill_dead: 0.0,
                default_rate: 0.0
            };

            this.lockdown = false;
            this.lockdownDays = 0;
            this.lockdownBetween = this.rates["lockdownMinBetween"];
            this.lockdownCount = 0;

            if (rates !== undefined) {
                this.setRates(rates);
            };
        }

        setRate(key, value) {
            if (key in this.rates) {
                this.rates[key] = value;
            } else {
                console.log("Unknown rate: " + key);
                throw "Unknown rate: " + key;
            }
        }

        setRates(dict) {
            for (const [key, value] of Object.entries(dict)) {
                this.setRate(key, value);
            }
            if (this.rates["probInfectionSummer"] === undefined) {
                this.rates["probInfectionSummer"] = this.rates["probInfection"];
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

        setLockdown(stages) {
            const rates = this.rates;

            if (this.lockdown === false &&
                this.lockdownCount >= rates.lockdownMaxTimes) {
                return;
            }

            if (this.lockdown === false && this.lockdownBetween > 0) {
                --this.lockdownBetween;
                return;
            }

            if (this.lockdown === false &&
                stages["ill"] > this.rates["lockdownAfter"]) {
                this.lockdownDays = 0;
                this.lockdown = true;
                ++this.lockdownCount;
            }

            if (this.lockdown === true &&
                this.lockdownDays >= rates.lockdownIterations) {
                this.lockdown = false;
                this.lockdownBetween = rates.lockdownMinBetween;
                return;
            }

            if (this.lockdown === true) {
                ++this.lockdownDays;
                return;
            }
        }

        setNewInfections(stages, iteration) {
            let beta;
            let probInfection;
            let season = 0;

            if (this.rates["summerDuration"] > 0) {
                let day = iteration % 365;
                let start = this.rates["summerStart"];
                let end = (start + this.rates["summerDuration"]) % 365;

                if (end > start) {
                    if (day >= start && day < end) {
                        season = 1;
                    }
                } else {
                    if (day >= start || day < end) {
                        season = 1;
                    }
                }
            }
            if (season === 0) {
                probInfection = this.rates["probInfection"];
            } else {
                probInfection = this.rates["probInfectionSummer"];
            }

            // Are we in lockdown?

            this.setLockdown(stages);
            if (this.lockdown) {
                beta = this.rates["avgContacts"] *
                    this.rates["lockdownContactMult"] * probInfection;
            } else {
                beta = this.rates["avgContacts"] * probInfection;
            }

            const N = this.countPopulation(stages);
            const s_t = stages["susceptible"] / N;
            let delta = beta * s_t * (stages["contagious"] + stages["ill"]);
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
            } else {
                console.log("Unknown transition rate: ", stage_key);
                throw "Unknown transition rate " + stage_key;
            }
            this.setStages(stages, stage_from, stage_to, rate);
        }

        transition(stages, iteration) {
            this.setNewInfections(stages, iteration);
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

        constructor(stages, transitionRates) {
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
            this.infection = new Infection(transitionRates);
        }

        setStage(key, value) {
            if (key in this.stages) {
                this.stages[key] = value;
            } else {
                console.log("Unknown stage: " + key);
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

        update(iteration) {
            this.infection.transition(this.stages, iteration);
        }

    }

    class Migrations {

        constructor(regions, arr, defaultMigration) {
            if (defaultMigration === undefined) {
                defaultMigration = {};
                defaultMigration["illCorrection"] = 0.0;
                defaultMigration["rate"] = undefined;
                defaultMigration["actual"] = undefined;
                defaultMigration["screening"] = 0.0;
                defaultMigration["toDetected"] = 0.0;
                defaultMigration["fromDetected"] = 0.0;
                defaultMigration["reducedToTravel"] = 1.0;
                defaultMigration["reducedFromTravel"] = 1.0;
                defaultMigration["symmetrical"] = 0.0;
            }
            this.migrations = [];
            for (let obj of arr) {
                let n = 1;
                let symmetrical = obj["symmetrical"] |
                    defaultMigration["symmetrical"];
                if (symmetrical > 0.0) n = 2;
                for (let i = 0; i < n; i++) {
                    let migration = {};
                    migration.illCorrection = obj["illCorrection"] ||
                        defaultMigration["illCorrection"];
                    migration.rate = obj["rate"] || defaultMigration["rate"];
                    migration.actual = obj["actual"] ||
                        defaultMigration["actual"];
                    migration.screening = obj["screening"] ||
                        defaultMigration["screening"];
                    migration.toDetected = obj["toDetected"] ||
                        defaultMigration["toDetected"];
                    migration.fromDetected = obj["fromDetected"] ||
                        defaultMigration["fromDetected"];
                    migration.reducedToTravel = obj["reducedToTravel"] ||
                        defaultMigration["reducedToTravel"];
                    migration.reducedFromTravel = obj["reducedFromTravel"] ||
                        defaultMigration["reducedFromTravel"];

                    if (! (obj["from"] in regions) ) {
                        throw "Unknown region in migration " + obj["from"];
                    }

                    if (! (obj["to"] in regions) ) {
                        throw "Unknown region in migration " + obj["to"];
                    }

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
                let regionFrom = regions[migration.from];
                let regionTo = regions[migration.to];
                let actual = 0.0;
                let total = 0.0;
                for (let stage of living) {
                    total += regionFrom.stages[stage];
                }

                if (migration.actual === undefined) {
                    actual = migration.rate * total;
                } else {
                    actual = migration.actual;
                }

                if (regionTo.stages["ill"] > migration.toDetected &&
                    regionFrom.stages["ill"] > migration.fromDetected) {
                    const reducedTravel = Math.max(migration.reducedToTravel,
                                                   migration.reducedFromTravel);
                    actual *= reducedTravel;
                } else if (regionTo.stages["ill"] > migration.toDetected) {
                    actual *= migration.reducedToTravel;
                } else if (regionFrom.stages["ill"] > migration.fromDetected) {
                    actual *= migration.reducedFromTravel;
                }

                const allowedIn = 1.0 - migration.screening;
                for (let stage of living) {
                    let delta = actual * (regionFrom.stages[stage] / total);
                    if (stage === "uncontagious" ||
                        stage === "contagious" ||
                        stage === "ill") {
                        delta *= allowedIn;
                        if (stage === "ill") {
                            delta *= migration.illCorrection;
                        }
                    }
                    regionFrom.stages[stage] -= delta;
                    regionTo.stages[stage] += delta;
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
            transitionRates: dict["transitionRates"],
            defaultMigration: dict["defaultMigration"],
            regions: {},
            migrations: []
        };

        parms.addRegion = (dict) => {
            const name = dict["name"];
            const stages = dict["stages"];
            let transitionRates = dict["transitionRates"];
            if (parms.transitionRates !== undefined) {
                if (transitionRates === undefined) {
                    transitionRates = parms.transitionRates;
                } else {
                    for (let [key, value] of
                         Object.entries(parms.transitionRates)) {
                        if (! (key in transitionRates) ) {
                            transitionRates[key] = value;
                        }
                    }
                }
            }
            const region = new Region(stages, transitionRates);
            parms.regions[name] = region;
            return region;
        }

        parms.addRegions = (arr) => {
            for (const region of arr) {
                parms.addRegion(region);
            }
        }

        parms.addMigrations = (arr, defaultMigration) => {
            parms.migrations = new Migrations(parms.regions, arr,
                                              parms.defaultMigration);
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
            for (let [name, region] of Object.entries(parms.regions)) {
                region.update(parms.iteration);
            }
            parms.migrations.update(parms.regions);
            parms.iteration++;
        }


        if (dict !== undefined) {
            if ("regions" in dict) {
                parms.addRegions(dict["regions"]);
            }
        }

        if ("migrations" in dict) {
            parms.addMigrations(dict["migrations"], dict["defaultMigrations"]);
        }

        return parms;
    }
} (window.Pandemic = window.Pandemic || {}))
