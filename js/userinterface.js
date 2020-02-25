"use strict";

let capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const iterations = 365;

let pandemic = undefined;
let simulation = undefined;

let regions = [
    {
        name: "china",
        stages: {
            unsusceptible: 0.0,
            susceptible: 1439000000.0,
            uncontagious: 10.0,
            contagious: 0.0,
            ill: 0.0,
            cured: 0.0,
            dead: 0.0
        }
    },
    {
        name: "india",
        stages: {
            unsusceptible: 1352000000.0,
            susceptible: 90000000.0,
            uncontagious: 0.0,
            contagious: 0.0,
            ill: 0.0,
            cured: 0.0,
            dead: 0.0
        }
    },
    {
        name: "south africa",
        stages: {
            unsusceptible: 20000000.0,
            susceptible: 35000000.0,
            uncontagious: 0.0,
            contagious: 0.0,
            ill: 0.0,
            cured: 0.0,
            dead: 0.0
        }
    }
];

let migrations = [
    {
        "from": "china",
        to: "india",
        rate: 0.00071,
        symmetrical: 0.9999,
        illCorrection: 0.1
    },
    {
        "from": "south africa",
        to: "india",
        actual: 1000,
        symmetrical: 1.0,
        illCorrection: 0.1
    },
    {
        "from": "south africa",
        to: "china",
        actual: 2000,
        symmetrical: 0.9999,
        illCorrection: 0.1
    }
];

let regionsString = JSON.stringify(regions, null, 4);
document.getElementById("parameter-regions").value = regionsString;

let initUserInterface = () => {
    const output_region = (html, region, description, stage) => {
        let val;
        html += `${description}: `;
        if (stage === "infections") {
            val = region.countInfected();
        } else {
            html = region.stages[stage];
        }
        html += new Intl.NumberFormat('en-US',
                                      {
                                          style: 'decimal',
                                          maximumFractionDigits: 0
                                      }).format(val) + "<br />";
        return html;
    }

    const output_stage = (html, stage, val) => {
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

    const output = () => {
        let html;
        html = `<p>${pandemic.iterationName}:
                 ${pandemic.iteration.toString()}<br/>`;

        for (let [name, region] of Object.entries(pandemic.regions)) {
            html += `<b>${capitalizeFirstLetter(name)}</b><br />`;
            html = output_region(html, region, "Infected", "infections");
        }

        html += "<b>World</b><br/>";
        html = output_stage(html, "Susceptible",
                            pandemic.count("susceptible"));
        html = output_stage(html, "Infected", pandemic.countInfected());
        html = output_stage(html, "Cured", pandemic.count("cured"));
        html = output_stage(html, "Dead", pandemic.countDeaths());
        html += "</p>";
        pandemic.resultsElem.innerHTML = html +
            pandemic.resultsElem.innerHTML;
        infectionChart.update();
        infectionMap.update();
    };

    pandemic = Pandemic.create({
        resultsElem: "results",
        iterations: iterations,
        iterationName: "Day",
        defaultInfectionRates: {
            incidence: 0.21,
            lockdown: 0.01,
            uncontagious_contagious: 0.3,
            contagious_ill: 0.4,
            ill_cured: 0.07,
            ill_dead: 0.00033,
            default_rate: 0.0
        },
        regions: regions,
        migrations: migrations
    });


    let infectionChart = InfectionChart.create({
        chartInfections: "chart",
        iterations: iterations,
        infectionTimeSeries: pandemic.infectionTimeSeries,
        deathTimeSeries: pandemic.deathTimeSeries
    });

    let mapRegions = {
        "CN": ["china"],
        "ZA": ["south africa"],
        "IN": ["india"]
    };


    let infectionMap = InfectionMap.create({
        container: "mapcontainer",
        name: "world_countries",
        regions: mapRegions,
        pandemic: pandemic
    });


    simulation = Simulation.create({
        name: "toy-covid-19",
        description: "Very over-simplified attempt to model \
             Covid-19 outbreak. Note: This model has serious limitations.",
        executeElem: "simulate-button",
        iterations: iterations,
        onExecute: (elem) => {
            elem.innerHTML = "Stop";
            elem.classList.remove("btn-primary");
            elem.classList.add("btn-danger");
        },
        onStop: (elem) => {
            elem.innerHTML = "Simulate";
            elem.classList.add("btn-primary");
            elem.classList.remove("btn-danger");
        },
        update: pandemic.update,
        output: output
    });

}

initUserInterface();

document.getElementById("simulate-button").
    addEventListener("click", function(e) {
        let elem = e.target;
        if (simulation.running === false) {
            let s = document.getElementById("parameter-regions").value;
            if (s !== regionsString) {
                try {
                    const r = JSON.parse(s);
                    regions = r;
                } catch(ex) {
                    console.log("Error in regions");
                }
                initUserInterface();
            }
            elem.innerHTML = "Stop";
            elem.classList.remove("btn-primary");
            elem.classList.add("btn-danger");
        } else {
            elem.innerHTML = "Simulate";
            elem.classList.add("btn-primary");
            elem.classList.remove("btn-danger");
        }
        simulation.run();
});
