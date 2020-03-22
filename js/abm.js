"use strict";

(function(abm, undefined) {

    abm.randNormal = () => {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    abm.randBoundedNormal = (min, max, skew) => {
        let n = randNormal();

        n = n / 10.0 + 0.5; // Translate to 0 -> 1
        if (n > 1 || n < 0) n = randBoundedNormal(min, max, skew)
        n = Math.pow(n, skew); // Skew
        n *= (max - min); // Stretch to fill range
        n += min; // offset to min
        return n;
    }

    abm.shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    abm.ageEvent = (agent) => agent.age += 1;
    abm.reportEvent = (agent) => console.log(agent);

    abm.updateAgentBefore = (agent) =>
        for (let event in this.beforeEvents()) event(this, simulation);

    abm.updateDuring = (agent) =>
        for (let event in this.duringEvents()) event(this, simulation);

    abm.updateAfter = (agent) =>
        for (let event in this.afterEvents()) event(this, simulation);

    let id = -1;
    abm.parameters = {
        agentProperties: [
            {
                from: 0,
                to: 100,
                attributes {
                    id: () => {
                        id++;
                        return id;
                    }
                    age: () =>  return abm.randBoundedNormal(15, 49, 0.7),
                },
                duringEvents: [abm.events.age,
                               abm.events.report],
            }
        ],
    };

    abm.create = (dict) => {
        for(let [key, value] of Object.entries(dict)) {
            if (key in abm.parameters) {
                abm.parameters[key] = value;
            } else {
                throw 'Unknown parameter creating abm: ' + key;
            }
        }
    }

    abm.agents = [];

    abm.createAgents = () => {
        for (let p in abm.parameters.agentProperties) {
            for (let i = p.from; i < p.to; i++) {
                let agent = {}
                for (let [key, value] of Object.entries(p.attributes))
                    agent[key] = value();
                agent["duringEvents"] = p.duringEvents;
                abm.agents.push(agent);
            }
        }
    }

    abm.run() = () => {
        abm.shuffleArray(abm.agents);
        for (let agent in agents) {
            for (let event in agent.duringEvents) {
                event(agent, abm);
            }
        }
    }

} (window.Abm = window.Abm || {}))
