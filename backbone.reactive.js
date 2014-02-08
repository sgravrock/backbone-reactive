Backbone.ReactiveModel = function (attributes, options) {
	var that = this, reactive = {};

	if (attributes) {
		reactive = attributes.reactive;
		attributes = _.clone(attributes);
		delete attributes.reactive;
	}

	Backbone.Model.call(this, attributes, options);

	_.chain(reactive).keys().each(function (propName) {
		// Get the value for each dependency
		// TODO: allow dependencies to be on different model objects
		var depValues = _.map(reactive[propName].deps, that.get.bind(that));
		var value = reactive[propName].compute.apply(null, depValues);
		that.set(propName, value);
	});
};

_.extend(Backbone.ReactiveModel.prototype, Backbone.Model.prototype);
