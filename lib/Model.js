var util  = require('util'),
    _     = require('underscore'),
    EE    = require('events').EventEmitter;


/**
* Super simple lightweight model class where 
* the attribute get / set and 
* evented nature is heavily inspired 
* by a backbone model
*/
function Model(attr, options) {

  EE.call(this);
  this.options = options || {};

  //private(ish) model not to be accessed or changed
  this._attributes = {};
  this.set(attr || {});
}

util.inherits(Model, EE);

Model.prototype.get = function get(name) {
  return this._attributes[name];
};


Model.prototype.set = function modelSet(name, value) {
  if (value === undefined && _.isObject(name)) {
    _.each(name, function(val, key) {
      this.set(key, val);
    }, this);
    return;
  }
 
  var oldVal = this.get(name);
  this._attributes[name] = value;

  if (!_.isEqual(oldVal, value)) {
    if (_.isString(value)) this.emit('change:'+name+':'+value, oldVal);
    this.emit('change:'+name, value, oldVal);
    this.emit('change', name, value, oldVal);
  }
};

module.exports = Model;