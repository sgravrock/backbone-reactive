Backbone.ReactiveModel = function (attributes, options) {
	var that = this, reactive = {};

	if (attributes) {
		reactive = attributes.reactive;
		attributes = _.clone(attributes);
		delete attributes.reactive;
	}

	Backbone.Model.call(this, attributes, options);
	this._reactiveSpec = reactive;
	this._reactiveProps = [];

	_.chain(reactive).keys().each(function (propName) {
		var propSpec = reactive[propName];

		if (propSpec.collection) {
			that._reactiveProps.push(new Backbone.ReactiveModel.CollectionPlucker(that, propName,
				propSpec));
		} else {
			// Compute the initial value for the dependency
			that._reactiveRecompute(propName);
	
			// When a dependency changes, recompute all properties that depend on it.
			_.each(propSpec.deps, function (dep) {
				dep = that._normalizeDependency(dep);
				that.listenTo(dep.source, "change:" + dep.name, function () {
					that._reactiveRecompute(propName);
				});
			});
		}
	});
};

Backbone.ReactiveModel.prototype = new Backbone.Model();
Backbone.ReactiveModel.prototype.constructor = Backbone.ReactiveModel;

_.extend(Backbone.ReactiveModel.prototype, {
	stopListening: function () {
		Backbone.Model.prototype.stopListening.apply(this, arguments);
		// Drop references to the objects we depend on,
		// so we don't cause a memory leak.
		_.each(this._reactiveProps, function (p) {
			p.stopListening();
		});
		this._reactiveProps = this._reactiveSpec = null;
	},
	_reactiveRecompute: function (propName) {
		var depValues = _.map(this._reactiveSpec[propName].deps,
				this._valueOfDependency.bind(this));
		var value = this._reactiveSpec[propName].compute.apply(null, depValues);
		console.log(propName + " => " + value);
		this.set(propName, value);
	},
	_normalizeDependency: function (dep) {
		if (typeof dep === "object") {
			return dep;
		} else {
			return {
				source: this,
				name: dep
			};
		}
	},
	_valueOfDependency: function (dep) {
		dep = this._normalizeDependency(dep);
		return dep.source.get(dep.name);
	}
});

Backbone.ReactiveModel.CollectionPlucker = function (target, targetProp, spec) {
	var that = this;
	this._target = target;
	this._targetProp = targetProp;
	this._spec = spec;

	// Compute the initial value.
	this._recompute();

	// When a dependency changes, recompute.
	this.listenTo(spec.collection, "add remove reset", this._recompute);
	spec.collection.each(function (m) {
		that.listenTo(m, "change:" + spec.pluck, that._recompute);
	});
};

_.extend(Backbone.ReactiveModel.CollectionPlucker.prototype, Backbone.Events, {
	_recompute: function () {
		var value = this._spec.compute.apply(null, this._spec.collection.pluck(this._spec.pluck));
		this._target.set(this._targetProp, value);
	}
});
