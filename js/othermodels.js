"use strict";

var modelSouthAfricaDoNothingSeasonal = {
    "ver": "20200322",
    "name": "SA_do_nothing_seasons",
    "description": "Attempt to model Covid-19 in South Africa. Initial contagous infections per province as of 21 March. Undiagnosed infections per province = 3 x contagious, or 3, whichever is greater. Lower infection rate in summer.",
    "iterations": "365",
    "delay": "0",
    "regions": [
        {
	    "name": "EC",
	    "stages": {
	        "unsusceptible": 0,
	        "susceptible": 6712276,
	        "uncontagious": 3,
	        "contagious": 1
	    }
        },
	{
	    "name": "FS",
	    "stages": {
		"susceptible": 2745590,
		"uncontagious": 42,
		"contagious": 7
	    }
	},
	{
	    "name": "GP",
	    "stages": {
		"susceptible": 12272263,
		"uncontagious": 375,
		"contagious": 125
	    }
	},
	{
	    "name": "LP",
	    "stages": {
		"susceptible": 5404868,
		"uncontagious": 3,
		"contagious": 1
	    }
	},
	{
	    "name": "MP",
	    "stages": {
		"susceptible": 4039939,
		"uncontagious": 15,
		"contagious": 5
	    }
	},
	{
	    "name": "NC",
	    "stages": {
		"susceptible": 1145861,
		"uncontagious": 3,
		"contagious": 0
	    }
	},
	{
	    "name": "KZN",
	    "stages": {
		"susceptible": 10267300,
		"uncontagious": 81,
		"contagious": 27
	    }
	},
	{
	    "name": "NW",
	    "stages": {
		"susceptible": 3509953,
		"uncontagious": 3,
		"contagious": 0
	    }
	},
	{
	    "name": "WC",
	    "stages": {
		"susceptible": 5822734,
		"uncontagious": 222,
		"contagious": 74
	    }
	}
    ],
    "migrations": [{
	"from": "WC",
	"to": "GP",
	"actual": 6000
    },
		   {
		       "from": "WC",
		       "to": "EC",
		       "actual": 750
		   },
		   {
		       "from": "GP",
		       "to": "EC",
		       "actual": 450
		   },
		   {
		       "from": "GP",
		       "to": "MP",
		       "actual": 1000
		   },
		   {
		       "from": "GP",
		       "to": "LP",
		       "actual": 1000
		   },
		   {
		       "from": "GP",
		       "to": "LP",
		       "actual": 1000
		   },
		   {
		       "from": "GP",
		       "to": "NC",
		       "actual": 300
		   },
		   {
		       "from": "GP",
		       "to": "KZN",
		       "actual": 3000
		   },
		   {
		       "from": "GP",
		       "to": "NW",
		       "actual": 300
		   },
		   {
		       "from": "WC",
		       "to": "NC",
		       "actual": 300
		   },
		   {
		       "from": "WC",
		       "to": "KZN",
		       "actual": 1500
		   }
	          ],
    "defaultMigration": {
	"illCorrection": 0.1,
	"screening": 0.0,
	"toDetected": 100,
	"fromDetected": 100,
	"reducedFromTravel": 0,
	"reducedToTravel": 0,
	"symmetrical": 1
    },
    "defaultTransitionRates": {
        "avgContacts": 10,
        "probInfection": 0.04,
        "lockdownContactMult": 1,
        "lockdownAfter": 1000,
        "lockdownIterations": 21,
        "lockdownMinBetween": 21,
        "lockdownMaxTimes": 1000000,
        "probInfectionSummer": 0.02,
        "summerStart": 270,
        "summerDuration": 180,
        "vaccinate": 0,
        "uncontagious_contagious": 0.18,
        "contagious_ill": 0.9,
        "ill_recovered": 0.14,
        "ill_dead": 0.001,
        "default_rate": 0
    },
    "mapName": "south_africa",
    "mapRegions": {
	"ZA-EC": [
	    "EC"
	],
	"ZA-FS": [
	    "FS"
	],
	"ZA-GT": [
	    "GP"
	],
	"ZA-LP": [
	    "LP"
	],
	"ZA-MP": [
	    "MP"
	],
	"ZA-NC": [
	    "NC"
	],
	"ZA-NL": [
	    "KZN"
	],
	"ZA-NW": [
	    "NW"
	],
	"ZA-WC": [
	    "WC"
	]
    },
    "mapColors": [
	[
	    0.00001,
	    "no-infections"
	],
	[
	    0.0001,
	    "low-infection-rate"
	],
	[
	    0.001,
	    "moderate-infection-rate"
	],
	[
	    0.01,
	    "serious-infection-rate"
	],
	[
	    0.1,
	    "very-serious-infection-rate"
	],
	[
	    1,
	    "extremely-serious-infection-rate"
	]
    ]
}

var modelSouthAfricaDoNothingNoSeasons = JSON.parse(
    JSON.stringify(modelSouthAfricaDoNothingSeasonal));

modelSouthAfricaDoNothingNoSeasons.defaultTransitionRates.probInfectionSummer =
    modelSouthAfricaDoNothingNoSeasons.defaultTransitionRates.probInfection;

modelSouthAfricaDoNothingNoSeasons.name = "SA_do_nothing_no_seasons";
modelSouthAfricaDoNothingNoSeasons.description = "Attempt to model Covid-19 in South Africa. Initial contagous infections per province as of 21 March. Undiagnosed infections per province = 3 x contagious, or 3, whichever is greater. No seasonal differences."


var modelSouthAfricaLockdown = JSON.parse(
    JSON.stringify(modelSouthAfricaDoNothingNoSeasons));

modelSouthAfricaLockdown.name = "SA_lockdowns";

modelSouthAfricaLockdown.description = "Attempt to model Covid-19 in South Africa. Initial contagous infections per province as of 21 March. Undiagnosed infections per province = 3 x contagious, or 3, whichever is greater. No seasonal differences. First lockdown for 21 days when 5000 infections, then every 21 subsequent days if more than 10k infections."


modelSouthAfricaLockdown.defaultTransitionRates.lockdownContactMult = 0.1;
