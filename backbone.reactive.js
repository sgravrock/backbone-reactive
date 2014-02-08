Backbone.ReactiveModel = function (attributes, options) {
	var that = this, reactive = {};

	if (attributes) {
		reactive = attributes.reactive;
		attributes = _.clone(attributes);
		delete attributes.reactive;
	}

	Backbone.Model.call(this, attributes, options);
	this._reactiveSpec = reactive;

	_.chain(reactive).keys().each(function (propName) {
		// Compute the initial for the dependency
		// TODO: allow dependencies to be on different model objects
		that._reactiveRecompute(propName);

		// When a dependency changes, recompute all properties that depend on it.
		_.each(reactive[propName].deps, function (dep) {
			dep = that._normalizeDependency(dep);
			that.listenTo(dep.source, "change:" + dep.name, function () {
				that._reactiveRecompute(propName);
			});
		});
	});
};

_.extend(Backbone.ReactiveModel.prototype, Backbone.Model.prototype, {
	stopListening: function () {
		Backbone.Model.prototype.stopListening.apply(this, arguments);
		// Drop references to the objects we depend on,
		// so we don't cause a memory leak.
		this._reactiveSpec = null;
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
