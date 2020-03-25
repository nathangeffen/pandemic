"use strict";

$(document).ready(function() {

    const iterations = 365;
    const delay = 0;
    const name = "Contagion";
    const description =
          `Very simple attempt to model a worldwide pandemic.
Very loosely based on Covid-19 but nothing about Covid-19
should be inferred from it.`;
    const mapRegions = {
        "AU": ["Australia",],
        "BR": ["Brazil",],
        "CN": ["China Wuhan", "China (rest)"],
        "DE": ["Germany",],
        "ES": ["Spain",],
        "FR": ["France",],
        "GB": ["United Kingdom",],
        "IN": ["India"],
        "IR": ["Iran",],
        "IT": ["Italy Milan", "Italy (rest)", ],
        "JP": ["Japan",],
        "KR": ["South Korea"],
        "MY": ["Malaysia"],
        "NG": ["Nigeria",],
        "SG": ["Singapore",],
        "TH": ["Thailand",],
        "US": ["United States",],
        "VN": ["Vietnam",],
        "ZA": ["South Africa"],
    };

    const mapName = "world_countries";
    const mapColors = [
        [0.00001, "no-infections"],
        [0.00001 * 10, "low-infection-rate"],
        [0.00001 * 100, "moderate-infection-rate"],
        [0.00001 * 1000, "serious-infection-rate"],
        [0.00001 * 10000, "very-serious-infection-rate"],
        [1.0, "extremely-serious-infection-rate"]
    ]

    const defaultTransitionRates =  {
        avgContacts: 10,
        probInfection: 0.025,
        lockdownContactMult: 0.5,
        lockdownAfter: 100.0,
        lockdownIterations: 21,
        lockdownMinBetween: 21,
        lockdownMaxTimes: 1000000,
        probInfectionSummer: 0.02,
        summerStart: 120,
        summerDuration: 180,
        vaccinate: 0.0,
        uncontagious_contagious: 0.5,
        contagious_ill: 0.5,
        ill_recovered: 0.06,
        ill_dead: 0.0008,
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

    /* Susceptible population rates, based on CDC flu
       https://www.cdc.gov/flu/about/keyfacts.htm
    */
    const lowSusceptibility = 1.0;
    /* For countries with weak health systems */
    const highSusceptibility = 1.0;

    /* Percentage of infections that will be blocked at ports
       of a country. This is just a guess. */
    const strongScreen = 0.9;
    const weakScreen = 0.1;

    let worldResults = document.getElementById("world-results");
    let regionResults = document.getElementById("region-results");

    let pandemic = undefined;
    let simulation = undefined;
    let infectionChart = undefined;

    let regions = [
        {
            name: "Australia",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 25203198.0,
                susceptible: lowSusceptibility * 25203198.0,
            },
            transitionRates: {
                summerStart: 0,
            }
        },
        {
            name: "Brazil",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 211049527.0,
                susceptible: lowSusceptibility * 211049527.0,
            },
            transitionRates: {
                summerStart: 0,
            }
        },
        {
            name: "China Wuhan",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 90000000,
                susceptible: lowSusceptibility * 90000000.0,
                uncontagious: 10.0,
            }
        },
        {
            name: "China (rest)",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 1337647786.0,
                susceptible: lowSusceptibility * 1337647786.0,
            }
        },
        {
            name: "France",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 65129728.0,
                susceptible: lowSusceptibility * 65129728.0
            }
        },
        {
            name: "Germany",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 83517045.0,
                susceptible: lowSusceptibility * 83517045.0
            }
        },
        {
            name: "India",
            stages: {
                unsusceptible: (1 - highSusceptibility) * 1352642280.0,
                susceptible: highSusceptibility * 1352642280.0
            }
        },
        {
            name: "Iran",
            stages: {
                unsusceptible: (1 - highSusceptibility)  * 81800188.0,
                susceptible: highSusceptibility * 81800188.0,
            },
        },
        {
            name: "Italy Milan",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 3259835.0,
                susceptible: lowSusceptibility * 3259835.0,
            }
        },
        {
            name: "Italy (rest)",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * (60627291.0-3259835.0),
                susceptible: lowSusceptibility * (60627291.0-3259835.0),
            }
        },
        {
            name: "Malaysia",
            stages: {
                unsusceptible: (1 - highSusceptibility) * 31949777.0,
                susceptible: highSusceptibility * 31949777.0
            }
        },
        {
            name: "Nigeria",
            stages: {
                unsusceptible: (1 - highSusceptibility) * 195874683.0,
                susceptible: highSusceptibility * 195874683.0
            }
        },
        {
            name: "Japan",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 126476461.0,
                susceptible: lowSusceptibility * 126476461.0
            }
        },
        {
            name: "Singapore",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 5804337.0,
                susceptible: lowSusceptibility * 5804337.0,
            }
        },
        {
            name: "South Africa",
            stages: {
                unsusceptible: (1 - highSusceptibility) * 57792518.0,
                susceptible: highSusceptibility * 57792518.0,
            },
            transitionRates: {
                summerStart: 0,
            }
        },
        {
            name: "South Korea",
            stages: {
                unsusceptible:  (1 - lowSusceptibility) * 51171706.0,
                susceptible: lowSusceptibility * 51171706.0
            }
        },
        {
            name: "Spain",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 46736776.0,
                susceptible: lowSusceptibility * 46736776.0,
            }
        },
        {
            name: "Thailand",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 68863514.0,
                susceptible: lowSusceptibility * 68863514.0,
            }
        },
        {
            name: "United Kingdom",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 67530172.0,
                susceptible: lowSusceptibility * 67530172.0
            }
        },
        {
            name: "United States",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 327096265.0,
                susceptible: lowSusceptibility * 327096265.0
            }
        },
        {
            name: "Vietnam",
            stages: {
                unsusceptible: (1 - lowSusceptibility) * 96462106.0,
                susceptible: lowSusceptibility * 96462106.0
            }
        },
    ];

    let defaultMigration = {
        illCorrection: 0.1,
        screening: strongScreen,
        toDetected: 100,
        fromDetected: 100,
        reducedFromTravel: 0.5,
        reducedToTravel: 0.5,
        symmetrical: 1.0
    };

    let migrations = [
        {
            "from": "Australia",
            to: "Singapore",
            actual: (1107215.0 + 407000.0) / 365.0,
        },
        {
            "from": "Australia",
            to: "China (rest)",
            actual: 1323000.0 / 365.0,
        },
        {
            "from": "Brazil",
            to: "United States",
            actual: (570350.0 + 2209372) / 365.0,
        },
        {
            "from": "China Wuhan",
            to: "China (rest)",
            actual: 10000.0, // This is a completely ignorant guess
            screening: weakScreen
        },
        {
            "from": "China (rest)",
            to: "India",
            actual: (281768.0 / 365.0),
        },
        {
            "from": "China (rest)",
            to: "Iran",
            actual: 50000.0/365.0,
            screening: weakScreen
        },
        {
            // I couldn't find any reliable info on Italian tourists to China
            // So this is just Chinese tourists to Italy, which is very large
            "from": "China (rest)",
            to: "Italy Milan",
            actual: (3259835.0/60627291.0) *  (3200847.0 / 365.0),
            screening: weakScreen,
        },
        {
            "from": "China (rest)",
            to: "Italy (rest)",
            actual: ((60627291.0-3259835.0)/60627291.0) *  (3200847.0/365.0),
            screening: weakScreen,
        },
        {
            "from": "China (rest)",
            to: "Nigeria",
            // https://www.premiumtimesng.com/news/more-news/229234-nigeria-records-highest-chinese-outbound-visitors-africa.html
            actual: 200000.0 / 365.0,
            screening: weakScreen,
        },
        {
            "from": "China (rest)",
            to: "Japan",
            actual: (2590700+8380034)/365.0,
        },
        {
            "from": "China (rest)",
            to: "Singapore",
            actual: 3416475 / 365.0,
        },
        {
            "from": "China (rest)",
            to: "South Africa",
            actual: 84691 / 365.0,
        },
        {
            "from": "China (rest)",
            to: "South Korea",
            actual:  (4775000.0 + 4775000) / 365.0,
        },
        {
            "from": "China (rest)",
            to: "Thailand",
            actual: 10994721.0/365.0,
            symmetrical: 1.0,
            illCorrection: 0.1,
            screening: 0.5
        },
        {
            "from": "China (rest)",
            to: "United States",
            actual: (2991813.0 + 2250000.0) / 365.0,
        },
        {
            "from": "China (rest)",
            to: "Malaysia",
            actual: 1791423.0 / 365.0,
        },
        {
            "from": "China (rest)",
            to: "Vietnam",
            actual: 5806425.0 / 365.0,
        },
        {
            "from": "Italy (rest)",
            to: "France",
            actual: 4737464.0 / 365.0,
        },
        {
            "from": "Italy (rest)",
            to: "Germany",
            actual: (12184502.0 + 1651933.0) / 365.0,
        },
        {
            "from": "Italy (rest)",
            to: "Spain",
            actual: (2175267.0 + 4382503.0) / 365.0,
        },
        {
            "from": "Italy (rest)",
            to: "United Kingdom",
            actual: 3781882.0 / 365.0,
        },
        {
            "from": "Italy (rest)",
            to: "Brazil",
            actual: 181493.0 / 365.0,
        },
        {
            "from": "Malaysia",
            to: "Singapore",
            actual: (13178774.0 + 1253992.0) / 365.0,
        },
    ];


    document.getElementById("parameter-name").value = name;
    document.getElementById("parameter-description").value = description;
    document.getElementById("parameter-iterations").value = iterations;
    document.getElementById("parameter-delay").value = delay;
    document.getElementById("parameter-regions").value =
        JSON.stringify(regions, null, 4);
    document.getElementById("parameter-migrations").value =
        JSON.stringify(migrations, null, 4);
    document.getElementById("parameter-default-migration").value =
        JSON.stringify(defaultMigration, null, 4);
    document.getElementById("parameter-transition-rates").value =
        JSON.stringify(defaultTransitionRates, null, 4);
    document.getElementById("parameter-map-name").value = mapName;
    document.getElementById("parameter-map-regions").value =
        JSON.stringify(mapRegions, null, 4);
    document.getElementById("parameter-map-colors").value =
        JSON.stringify(mapColors, null, 4);

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
                html = outputRegion(html, region, "Recovered", "recovered");
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
            html = outputStage(html, "Recovered", pandemic.count("recovered"));
            html = outputStage(html, "Dead", pandemic.countDeaths());
            const cumInf = pandemic.countInfected() + pandemic.count("recovered") +
                  pandemic.countDeaths();
            html +="Cum. infections: " +
                new Intl.NumberFormat('en-US',
                                          {
                                              style: 'decimal',
                                              maximumFractionDigits: 0
                                          }).format(cumInf);
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
            transitionRates: parse("transition-rates"),
            defaultMigration: parse("default-migration"),
            regions: parse("regions"),
            migrations: parse("migrations")
        });

        if (infectionChart) {
            infectionChart.infectionChart.destroy();
        }

        infectionChart = InfectionChart.create({
            chartInfections: "chart",
            iterations: Number(document.getElementById("parameter-iterations").
                               value),
            infectionTimeSeries: pandemic.infectionTimeSeries,
            deathTimeSeries: pandemic.deathTimeSeries
        });

        let infectionMap = InfectionMap.create({
            container: "mapcontainer",
            name: document.getElementById("parameter-map-name").value,
            regions: parse("map-regions"),
            pandemic: pandemic,
            mapColors: parse("map-colors")
        });

        const ratePer100k = (n) => {
            return n * 100000;
        }

        const setLegend = (desc, from, to) => {
            if (to !== undefined) {
                document.getElementById(desc).innerHTML =
                    ratePer100k(mapColors[from][0]) + " - " +
                    ratePer100k(mapColors[to][0]) + " infections per 100k people";
            } else {
                document.getElementById(desc).innerHTML =
                    " > " + ratePer100k(mapColors[from][0]) + " infections per 100k people";
            }
        }

        setLegend("low", 0, 1);
        setLegend("moderate", 1, 2);
        setLegend("serious", 2, 3);
        setLegend("very-serious", 3, 4);
        setLegend("extremely-serious", 4);

        simulation = Simulation.create({
            name: document.getElementById("parameter-name").value,
            description: document.getElementById("parameter-description").
                value,
            delay: document.getElementById("parameter-delay").value,
            executeElem: "simulate-button",
            iterations: Number(document.
                               getElementById("parameter-iterations").value),
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
        document.getElementById("world-results").innerHTML = "";
        document.getElementById("region-results").innerHTML = "";
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

    const ver = "20200322";

    const uploadJSON = (obj) => {
        document.getElementById("parameter-name").value = obj["name"],
        document.getElementById("parameter-description").value =
            obj["description"];
        document.getElementById("parameter-iterations").value =
            obj["iterations"];
        document.getElementById("parameter-delay").value = obj["delay"];
        document.getElementById("parameter-regions").value =
            JSON.stringify(obj["regions"], null, 4);
        document.getElementById("parameter-migrations").value =
            JSON.stringify(obj["migrations"], null, 4);
        document.getElementById("parameter-default-migration").value =
            JSON.stringify(obj["defaultMigration"], null, 4);
        document.getElementById("parameter-transition-rates").value =
            JSON.stringify(obj["defaultTransitionRates"], null, 4);
        document.getElementById("parameter-map-name").value =
            obj["mapName"];
        document.getElementById("parameter-map-regions").value =
            JSON.stringify(obj["mapRegions"], null, 4);
        document.getElementById("parameter-map-colors").value =
            JSON.stringify(obj["mapColors"], null, 4);
    }

    const uploadModel = (str) => {
        try {
            const obj = JSON.parse(str);
            uploadJSON(obj);
        } catch (err) {
            alert("Error processing file: " + err);
            throw("Error processing file: " + err);
        }
    };

    const downloadModel = () => {
        const obj = {
            "ver": ver,
            "name": document.getElementById(
                "parameter-name").value,
            description: document.getElementById(
                "parameter-description").value,
            iterations: document.getElementById(
                "parameter-iterations").value,
            delay: document.getElementById("parameter-delay").value,
            regions: JSON.parse(
                document.getElementById("parameter-regions").value),
            migrations: JSON.parse(document.getElementById(
                "parameter-migrations").value),
            defaultMigration: JSON.parse(document.getElementById(
                "parameter-default-migration").value),
            defaultTransitionRates: JSON.parse(document.getElementById(
                "parameter-transition-rates").value),
            mapName: document.getElementById("parameter-map-name").value,
            mapRegions: JSON.parse(document.getElementById(
                "parameter-map-regions").value),
            mapColors: JSON.parse(document.getElementById(
                "parameter-map-colors").value)
        }

        const data = "data:text/json;charset=utf-8," +
              encodeURIComponent(JSON.stringify(obj, null, 4));
        document.getElementById("hidden-download").setAttribute("href", data);
        document.getElementById("hidden-download").
            setAttribute("download", obj.name + ".json");
        document.getElementById("hidden-download").click();
    }

    document.getElementById("download-button").
        addEventListener("click", downloadModel);
    document.getElementById("upload-button").
        addEventListener("click", () => {
            document.getElementById("hidden-upload").click();
        });

    document.getElementById("hidden-upload").
        addEventListener('change', function(e) {
            let file = this.files[0];
            let reader = new FileReader();
            reader.onload = function(e) {
                uploadModel(reader.result);
                document.getElementById("reset-button").click();
            }
            reader.readAsText(file);
        })

    document.getElementById("rsa-nothing-seasonal").
        addEventListener('click', function(e) {
            uploadJSON(modelSouthAfricaDoNothingSeasonal);
            document.getElementById("reset-button").click();
            alert("RSA Do nothing with seasonal infectiousness differences model loaded");
        });

    document.getElementById("rsa-nothing-noseasons").
        addEventListener('click', function(e) {
            uploadJSON(modelSouthAfricaDoNothingNoSeasons);
            document.getElementById("reset-button").click();
            alert("RSA Do nothing and no seasonal infectiousness differences model loaded");
        });

    document.getElementById("rsa-lockdown").
        addEventListener('click', function(e) {
            uploadJSON(modelSouthAfricaLockdown);
            document.getElementById("reset-button").click();
            alert("RSA Lockdown model loaded");
        });

});
