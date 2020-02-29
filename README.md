<p>
This is a simple mathematical simulation
(or model) of a
<a href="https://en.wikipedia.org/wiki/Pandemic">pandemic</a> or <a href="https://en.wikipedia.org/wiki/Infection">contagion</a>.</p>
<p>
Click the <em>Simulate</em> button to
start the simulation. The graph shows
the number of infections and deaths
globally. The countries on the world map
change colour to darker orange as the
number of infections in them exceeds a
percentage of the population. The
results panel provides the number of
infections and deaths per country, and
worldwide.
</p>

<p class="bg-warning">
Please note: The data used to set the
model's parameters should be considered
fictitious. Don't infer anything about
Covid-19 from it.
</p>

<h2>
Technical details of the model
</h2>

<p>
This is a deterministic macro, or
compartmental, model that simulates
daily changes as a pathogen spreads
throughout a region and then between
regions. It divides part of the world up
into regions (usually no more
fine-grained than by country) and has
the following <em>stages</em> (or
compartments) per region:
</p>
<dl>
<dt>
unsusceptible
</dt>
<dd>
The number of people who will not
contract the pathogen. (This increases
as the model progresses.)
</dd>
<dt>
susceptible
</dt>
<dd>
The number of people who can
contract the pathogen. (This decreases
as the model progresses.)
</dd>
<dt>
uncontagious
</dt>
<dd>
The number of infected people who
are not ill and do not transmit the
pathogen.
</dd>
<dt>
contagious
</dt>
<dd>
The number of people who are not yet
ill but can transmit the pathogen.
</dd>
<dt>
ill
</dt>
<dd>
The number of people the pathogen
has made sick. They can also
transmit the pathogen.
</dd>
<dt>
cured
</dt>
<dd>
The number of people who were once
infected who are now no longer
infected. They cannot transmit the
pathogen.
</dd>
<dt>
dead
</dt>
<dd>
The number of people who have died
from the pathogen.
</dd>
</dl>
<p>
Each region also has a set of daily
transition <em>rates</em> that determine
the changes in compartments. These are:
</p>
<dl>
<dt>
incidence
</dt>
<dd>
The rate at which contagious
infected people (i.e. people in the
contagious or ill stages) transmit
to susceptible people. This moves
people from the Susceptible
compartment to the Uncontagious one.
</dd>
<dt>
vaccinate
</dt>
<dd>
The rate at which people become
vaccinated. This moves people from
the susceptible stage to the
unsusceptible one. (Set to 0.0 in
this particular model but you can
change it.)
</dd>
<dt>
lockdown
</dt>
<dd>
This rate represents
isolation/quarantining/lockdown of
the susceptible population once
infections start in a region. This
moves people from the susceptible to
unsusceptible stages, only
once infections in the region are
greater than 1.0.
</dd>
<dt>
uncontagious_contagious
</dt>
<dd>
The rate at which uncontagious
people move to the contagious
stage.
</dd>
<dt>
contagious_ill
</dt>
<dd>
The rate at which people in the
contagious stage move to the ill
one. (Note that people in the ill
stage remain as contagious as the
people in the contagious stage.) If
people who are not ill are not
contagious in your model, set this
to 1.0 so that everyone who is
contagious is immediately made ill.
</dd>
<dt>
ill_cured
</dt>
</dd>
The rate at which people in the ill
stage become cured. Cured people are
neither susceptible to infection
again nor contagious.
</dd>
<dt>
ill_dead
</dt>
<dd>
The rate at which people who are ill
from the pathogen die.
</dd>
</dl>
<p>
The model also accounts for daily
migration between regions. A migration
route is specified with these
parameters:
</p>
<dl>
<dt>
from
</dt>
<dd>
The region from which people
are travelling.
</dd>
<dt>
to
</dt>
<dd>
The region to which people are
travelling.
</dd>
<dt>
rate
</dt>
<dd>
The proportion of the population
that migrates this way daily. (But
see <em>actual</em> which
may make more sense to use than
this.)
</dd>
<dt>
actual
</dt>
<dd>
Instead of a rate, which may be tiny
relative to the size of a region, an
absolute or actual number of people
who migrate in this direction daily
can be specified.<br/>
Specify <em>actual</em> or
<em>rate</em>, not both.
</dd>
<dt>
screening
</dt>
<dd>
This is a measure of how effective
the <em>to</em> country is at
preventing infected people from
entering it. A value of 1.0 means it
is 100% effective. 0 means it is
taking no effective measures against
allowing infected people in.
</dd>
<dt>
illCorrection
</dt>
<dd>
Ill people are presumably less
likely to travel. This is a rate
between 0.0 and 1.0 to multiply the
calculated number of ill people
scheduled to travel by. So, for
example, if it is set to 1.0, the
number of ill people who travel this
migration route is proportional to
their share of the population
travelling. But if set to 0.0, then
no ill people travel. In the default
model we've set this to 0.1,
i.e. 10% of ill people who would
have travelled, actually do so.
</dd>
<dt>
symmetrical
</dt>
<dd>
This is an optional shortcut for
specifying the migration route in
reverse (e.g. from the <em>to</em>
region back to the <em>from</em>
region). If you set this to 1.0 then
the migration route is perfectly
symmetrical between the two
regions. If less than 1.0 more
people travel from the <em>from</em>
region to the <em>to</em> region. If
greater than 1.0, more people travel
the other way. By default this is
0.0 and a separate migration entry
would need to be specified for the
reverse direction. Either set
symmetrical to a non-zero value or
create a separate entry for the
reverse direction. Don't do
both. For most models it would make
sense to set symmetrical to 1.0,
unless you happen to have good data
showing this not to be the case.
</li>
</ul>
