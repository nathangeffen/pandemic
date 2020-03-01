# Pandemic Simulator

This Javascript program executes simple mathematical simulations of
epidemics. To see it in action go to the [Pandemic website](https://pandemic.simhub.online/).

This is the respository for the website, so if you clone it, you'll be making an
exact copy of the website. Just simply load index.html in your modern
browser (i.e. not IE or something very old).

## Getting started

A good way to learn how this works is to go to the [Pandemic
website](https://pandemic.simhub.online/), read what it has to say, and fiddle
with the default model implemented on it.

If you want to use the pandemic simulator on your own site, simply download
pandemics.js in the js folder and include it on your webpage. E.g. ::

     <script src="pandemic.js"></script>

To create a pandemic object, you can do this: ::

    pandemic = Pandemic.create();

And then execute the model like this: ::

    pandemic.update();

There are quite a few options you can set when you create the pandemic
object. Check out the [Pandemic website](https://pandemic.simhub.online/) for
more details.

E.g. ::

        pandemic = Pandemic.create({
            defaultStageChangeRates: {
                incidence: 0.18,
                vaccinate: 0.0,
                lockdown: 0.02,
                uncontagious_contagious: 0.3,
                contagious_ill: 0.4,
                ill_cured: 0.07,
                ill_dead: 0.00085,
                default_rate: 0.0
            },
            regions: [
                {
                    name: "China",
                    stages: {
                        susceptible: 90000000.0,
                    }
                },
                {
                    name: "India",
                    stages: {
                        susceptible: 80000000.0,
                    }
                }
            ],
            migrations: [
                {
                    from: "China",
                    to: "India",
                    actual: 1000.0,
                    symmetrical: 1.0,
                    illCorrection: 0.1,
                    screening: 0.5
                },
            ]
        });


For it to be more useful, you'll probably want to also download and include
simulation.js: ::

     <script src="simulation.js"></script>

And then do something like this: ::

            simulation = Simulation.create({
                name: "My model",
                description: "My model is cool",
                delay: 0, // Time between iterations
                executeElem: "simulate-button", // DOM ID of button to run this
                iterations: 100,
                update: pandemic.update,
                output: output // A function you write to display results
        });
