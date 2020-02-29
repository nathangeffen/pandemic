"use strict";

(function(simulation, undefined) {

    class Engine {

        constructor(dict) {
            this.currentIteration = 0;
            this.name = dict["name"];
            this.description = dict["description"];
            this.iterations = dict["iterations"] || 100;
            this.executeElem = document.getElementById(dict["executeElem"]);
            this.resultsElem = document.getElementById(dict["resultsElem"]);
            this.onExecute = dict["onExecute"];
            this.onStop = dict["onStop"];
            this.update = dict["update"];
            this.output = dict["output"];
            this.delay = dict["delay"] || 0;
            this.running = false;
        }

        loop() {
            this.update();
            this.output();
            this.currentIteration++;
            if (this.currentIteration < this.iterations) {
                if (this.running === true)
                    setTimeout(this.loop.bind(this), this.delay);
            } else {
                this.running = false;
                this.onStop(this.executeElem);
            }
        }

        run() {
            this.running = !this.running;
            if (this.running === true) {
                this.loop();
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

    let engines = [];

    simulation.create = function(dict) {
        let engine = new Engine(dict);
        engines.push(engine);
        return engine;
    }

} (window.Simulation = window.Simulation || {}))
