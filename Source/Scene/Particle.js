/*global define*/
define([
        '../Core/defaultValue',
        '../Core/Cartesian3'
    ],function(
        defaultValue,
        Cartesian3) {
    "use strict";

    var Particle = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        this.mass = defaultValue(options.mass, 1.0);
        this.position = Cartesian3.clone(defaultValue(options.position, Cartesian3.ZERO));
        this.velocity = Cartesian3.clone(defaultValue(options.velocity, Cartesian3.ZERO));
        this.life = defaultValue(options.life, Number.MAX_VALUE);
    };

    Particle.prototype.update = function(forces) {
        Cartesian3.add(this.position, this.velocity, this.position);

        var length = forces.length;
        for (var i = 0; i < length; ++i) {
            Cartesian3.add(forces[i], this.velocity, this.velocity);
        }

        return --this.life > 0.0;
    };

    return Particle;
});