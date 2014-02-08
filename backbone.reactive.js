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
		_.each(reactive[propName].deps, function (depName) {
			that.on("change:" + depName, function () {
				that._reactiveRecompute(propName);
			});
		});
	});
};

_.extend(Backbone.ReactiveModel.prototype, Backbone.Model.prototype, {
	_reactiveRecompute: function (propName) {
		var depValues = _.map(this._reactiveSpec[propName].deps,
				this.get.bind(this));
		var value = this._reactiveSpec[propName].compute.apply(null, depValues);
		this.set(propName, value);
	}
});
