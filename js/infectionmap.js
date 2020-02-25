"use strict";

(function(infectionmap, undefined) {

    infectionmap.create = (dict) => {

        let parms = {
            container: "#" + dict["container"],
            name: dict["name"],
            regions: dict["regions"],
            pandemic: dict["pandemic"],
            areas: {},
            cssDivisions: dict["cssDivisions"] || [
                [0.0001, "no-infections"],
                [0.0003, "mild-infections"],
                [0.0005, "serious-infections"],
                [1.0, "very-serious-infections"]
            ]
        };

        const setArea = (key, value) => {
            parms.areas[key].tooltip.content = "";
            let infected = 0.0;
            let population = 0.0;
            let desc = "";
            for (let i = 0; i < value.length; i++) {
                infected += parms.pandemic.regions[value[i]].countInfected();
                population += parms.pandemic.regions[value[i]].countPopulation();
                desc += value[i];
                if (i < value.length - 1) {
                    desc += ", ";
                }
            }
            parms.areas[key].tooltip.content = desc + " " +
                        new Intl.NumberFormat('en-US',
                                  {
                                      style: 'decimal',
                                      maximumFractionDigits: 0
                                  }).format(infected);
            parms.areas[key].value = infected;
            const prev = infected / population;
            for (let i = 0; i < parms.cssDivisions.length; i++) {
                if (prev <= parms.cssDivisions[i][0]) {
                    parms.areas[key].cssClass = parms.cssDivisions[i][1];
                    break;
                }
            }
        }

        const setAreas = () => {
            for (let [key, value] of Object.entries(parms.regions)) {
                setArea(key, value);
            }
        }

        const initMapAreas = () => {
            for (let [key, value] of Object.entries(parms.regions)) {
                parms.areas[key] = {
                    "cssClass": "no-infections",
                    "value": 0,
                    "tooltip": {
                        "content" : ""
                    }
                }
                setArea(key, value);
            }
        }

        const initMap = () => {
            initMapAreas();
            $(parms.container).mapael({
                map: {
                    name: parms.name,
                      defaultArea: {
                        attrs: {
                            fill: "#fff",
                            stroke: "#232323",
                            "stroke-width": 0.3
                        }
                      },
                },
                areas: parms.areas
            });
        };


        parms.update = () => {
            setAreas();
            $(parms.container).trigger('update', [
                {
                    mapOptions:{
                        "areas": parms.areas
                    }
                }
            ]);
        }

        initMapAreas();
        initMap();
        return parms;
    }


} (window.InfectionMap = window.InfectionMap || {}))
