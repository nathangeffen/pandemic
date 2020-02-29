"use strict";

$(document).ready(function() {

    const iterations = 365;
    const delay = 0;
    const name = "Contagion";
    const description = "Very simple attempt to model a worldwide pandemic";
    const mapRegions = {
        "CN": ["China Wuhan", "China (rest)"],
        "ZA": ["South Africa"],
        "IN": ["India"],
        "KR": ["South Korea"],
        "JP": ["Japan",],
        "IT": ["Italy",],
        "US": ["United States",],
        "IR": ["Iran",],
        "NG": ["Nigeria",],
        "TH": ["Thailand",],
    };

    const  defaultStageChangeRates =  {
        incidence: 0.18,
        vaccinate: 0.0,
        lockdown: 0.02,
        uncontagious_contagious: 0.3,
        contagious_ill: 0.4,
        ill_cured: 0.07,
        ill_dead: 0.00085,
        default_rate: 0.0
    };

    const parse = (desc) => {
        const id = "parameter-" + desc;
        let j;
        try {
            j = JSON.parse(document.getElementById(id).value);
        } catch(error) {
            const errMsg = "Error parsing " + desc + ": " + error;
            alert(errMsg);
            throw("Please fix " + desc);
        }
        return j;
    }

    let worldResults = document.getElementById("world-results");
    let regionResults = document.getElementById("region-results");

    let pandemic = undefined;
    let simulation = undefined;
    let infectionChart = undefined;

    let regions = [
        {
            name: "China Wuhan",
            stages: {
                susceptible: 90000000.0,
                uncontagious: 10.0,
            }
        },
        {
            name: "China (rest)",
            stages: {
                susceptible: 1337647786.0,
            }
        },
        {
            name: "India",
            stages: {
                susceptible: 1352642280.0,
            }
        },
        {
            name: "Iran",
            stages: {
                susceptible: 81800188.0,
            },
            infectionRates: {
                lockdown: 0.01
            }
        },
        {
            name: "Italy",
            stages: {
                susceptible: 60627291.0,
            }
        },
        {
            name: "Nigeria",
            stages: {
                susceptible: 195874683.0,
            },
            infectionRates: {
                lockdown: 0.01
            }
        },
        {
            name: "Japan",
            stages: {
                susceptible: 127202192.0
            }
        },
        {
            name: "South Africa",
            stages: {
                susceptible: 57792518.0,
            }
        },
        {
            name: "South Korea",
            stages: {
                susceptible: 51171706.0,
            }
        },
        {
            name: "Thailand",
            stages: {
                susceptible: 68863514.0,
            }
        },
        {
            name: "United States",
            stages: {
                susceptible: 327096265.0,
            }
        },

    ];

    let migrations = [
        {
            "from": "China Wuhan",
            to: "China (rest)",
            actual: 10000.0,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.01
        },
        {
            "from": "China (rest)",
            to: "India",
            actual: 1000.0,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.5
        },
        {
            "from": "South Africa",
            to: "India",
            actual: 200,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.5
        },
        {
            "from": "South Africa",
            to: "China (rest)",
            actual: 410,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.8
        },
        {
            "from": "China (rest)",
            to: "South Korea",
            actual: 16400,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.5
        },
        {
            "from": "China (rest)",
            to: "Japan",
            actual: 22000,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.5
        },
        {
            "from": "Japan",
            to: "South Korea",
            actual: 10500,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.5
        },
        {
            "from": "China (rest)",
            to: "Italy",
            actual: 8700,
            symmetrical: 1.0,
            illCorrection: 0,
            screening: 0.0
        },
        {
            "from": "China (rest)",
            to: "United States",
            actual: 15000,
            symmetrical: 1.0,
            illCorrection: 0.01,
            screening: 0.95
        },
        {
            "from": "China (rest)",
            to: "Iran",
            actual: 1000,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.1
        },
        {
            "from": "China (rest)",
            to: "Nigeria",
            actual: 100,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.1
        },
        {
            "from": "China (rest)",
            to: "Thailand",
            actual: 30000,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.8
        }
    ];


    document.getElementById("parameter-name").value = name;
    document.getElementById("parameter-description").value = description;
    document.getElementById("parameter-iterations").value = iterations;
    document.getElementById("parameter-delay").value = delay;
    document.getElementById("parameter-regions").value =
        JSON.stringify(regions, null, 4);
    document.getElementById("parameter-migrations").value =
        JSON.stringify(migrations, null, 4);
    document.getElementById("parameter-stage-change-rates").value =
        JSON.stringify(defaultStageChangeRates, null, 4);
    document.getElementById("parameter-map-regions").value =
        JSON.stringify(mapRegions, null, 4);

    let initUserInterface = () => {


        const outputRegion = (html, region, description, stage) => {
            let val;
            html += `${description}: `;
            if (stage === "infections") {
                val = region.countInfected();
            } else {
                val = region.stages[stage];
            }
            html += new Intl.NumberFormat('en-US',
                                          {
                                              style: 'decimal',
                                              maximumFractionDigits: 0
                                          }).format(val) + "<br />";
            return html;
        }

        const outputStage = (html, stage, val) => {
            let output_val = new Intl.NumberFormat(
                'en-US',
                {
                    style: 'decimal',
                    maximumFractionDigits: 0
                }).format(val);
            html += stage + ": " + output_val;
            html += "<br /> "
            return html;
        }

        const outputRegions = () => {
            let html = `<h3>${pandemic.iterationName}:
                 ${pandemic.iteration.toString()}</h3>`;
            for (let [name, region] of Object.entries(pandemic.regions)) {
                html += `<h4>${name}</h4>`;
                html = outputRegion(html, region, "Infected", "infections");
                html = outputRegion(html, region, "Cured", "cured");
                html = outputRegion(html, region, "Dead", "dead");
            }
            regionResults.insertAdjacentHTML("afterbegin", html);
        }

        const outputWorld = () => {
            let html = `<h3>${pandemic.iterationName}:
                 ${pandemic.iteration.toString()}</h3>`;
            html = outputStage(html, "Susceptible",
                                pandemic.count("susceptible"));
            html = outputStage(html, "Infected", pandemic.countInfected());
            html = outputStage(html, "Cured", pandemic.count("cured"));
            html = outputStage(html, "Dead", pandemic.countDeaths());
            html += "</p>";
            worldResults.insertAdjacentHTML("afterbegin", html);
        }
        const output = () => {
            outputRegions();
            outputWorld();
            infectionChart.update();
            infectionMap.update();
        };

        pandemic = Pandemic.create({
            iterationName: "Day",
            defaultStageChangeRates: parse("stage-change-rates"),
            regions: parse("regions"),
            migrations: parse("migrations")
        });


        infectionChart = InfectionChart.create({
            chartInfections: "chart",
            iterations: Number(document.getElementById("parameter-iterations").
                               value),
            infectionTimeSeries: pandemic.infectionTimeSeries,
            deathTimeSeries: pandemic.deathTimeSeries
        });


        let infectionMap = InfectionMap.create({
            container: "mapcontainer",
            name: "world_countries",
            regions: parse("map-regions"),
            pandemic: pandemic
        });


        simulation = Simulation.create({
            name: document.getElementById("parameter-name").value,
            description: document.getElementById("parameter-description").value,
            delay: document.getElementById("parameter-delay").value,
            executeElem: "simulate-button",
            iterations: Number(document.getElementById("parameter-iterations").
                               value),
            onExecute: (elem) => {
                elem.innerHTML = "Stop";
                elem.classList.remove("btn-primary");
                elem.classList.add("btn-danger");
            },
            onStop: (elem) => {
                elem.innerHTML = "Continue";
                elem.classList.add("btn-primary");
                elem.classList.remove("btn-danger");
            },
            update: pandemic.update,
            output: output
        });

    }

    initUserInterface();

    let formChanged = false;

    document.getElementById("parameter-form").
        addEventListener("input", function () {
        document.getElementById("simulate-button").innerHTML = "Simulate";
        formChanged = true;
    });

    document.getElementById("simulate-button").
        addEventListener("click", function(e) {
            let elem = e.target;

            if (simulation.running === false) {
                if (formChanged) {
                    initUserInterface();
                    formChanged = false;
                } else {
                    if (simulation.currentIteration === simulation.iterations) {
                        simulation.iterations += Number(document.getElementById(
                            "parameter-iterations").value);
                        infectionChart.iterations = simulation.iterations;
                    }
                }
                elem.innerHTML = "Stop";
                elem.classList.remove("btn-primary");
                elem.classList.add("btn-danger");
                document.getElementById("reset-button").classList.
                    add("disabled");
            } else {
                elem.innerHTML = "Continue";
                elem.classList.add("btn-primary");
                elem.classList.remove("btn-danger");
                document.getElementById("reset-button").classList.
                    remove("disabled");
            }
            simulation.run();
        });

    document.getElementById("reset-button").
        addEventListener("click", function(e) {
            initUserInterface();
            document.getElementById("simulate-button").innerHTML = "Simulate";
            document.getElementById("reset-button").classList.add("disabled");
        });
});
