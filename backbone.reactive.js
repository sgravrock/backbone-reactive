Backbone.ReactiveModel = Backbone.Model.extend({
	constructor: function (attributes, options) {
		var reactiveAttr;
	
		if (attributes) {
			reactiveAttr = attributes.reactive;
			attributes = _.clone(attributes);
			delete attributes.reactive;
		}
	
		Backbone.Model.call(this, attributes, options);
		// We may get our reactive spec from ctor arguments or inherit them from a prototype.
		// TODO eliminate this member
		this.reactive = reactiveAttr || this.reactive || {};
		this._reactiveProps = [];
	
		_.chain(this.reactive).keys().each(function (propName) {
			var propSpec = this.reactive[propName];
			var PropCtor;
	
			if (propSpec.collection) {
				PropCtor = Backbone.ReactiveModel.CollectionProperty;
			} else {
				PropCtor = Backbone.ReactiveModel.BasicProperty;
			}

			this._reactiveProps.push(new PropCtor(this, propName, propSpec));
		}, this);
	},
	stopListening: function () {
		Backbone.Model.prototype.stopListening.apply(this, arguments);
		// Drop references to the objects we depend on,
		// so we don't cause a memory leak.
		_.each(this._reactiveProps, function (p) {
			p.stopListening();
		});
		this._reactiveProps = this.reactive = null;
	},
});

Backbone.ReactiveModel.extend = Backbone.Model.extend;

Backbone.ReactiveModel.BasicProperty = function (target, targetProp, spec) {
	this._target = target;
	this._targetProp = targetProp;
	this._spec = spec;

	// Compute the initial value
	this._recompute();

	// Recompute when any dependency changes
	_.each(spec.deps, function (dep) {
		dep = this._normalizeDependency(dep);
		this.listenTo(dep.source, "change:" + dep.name, function () {
			this._recompute();
		});
	}, this);
};

_.extend(Backbone.ReactiveModel.BasicProperty.prototype, Backbone.Events, {
	_recompute: function () {
		var depValues = _.map(this._spec.deps, this._valueOfDependency.bind(this));
		var value = this._spec.compute.apply(null, depValues);
		this._target.set(this._targetProp, value);
	},
	_normalizeDependency: function (dep) {
		if (typeof dep === "object") {
			return dep;
		} else {
			return {
				source: this._target,
				name: dep
			};
		}
	},
	_valueOfDependency: function (dep) {
		dep = this._normalizeDependency(dep);
		return dep.source.get(dep.name);
	}
});

Backbone.ReactiveModel.CollectionProperty = function (target, targetProp, spec) {
	this._target = target;
	this._targetProp = targetProp;
	this._spec = spec;
	// The source collection may have been specified either with a direct object reference
	// or a string naming a property on the model. The latter is useful for situations where
	// the collection doesn't exist yet at the time the property spec is created,
	// such as when the model's constructor creates the collection when inheriting from a
	// prototype that specifies reactive properties.
	if (typeof spec.collection === "string") {
		this._source = target.get(spec.collection);
	} else {
		this._source = spec.collection;
	}

	// Compute the initial value.
	this._recompute();

	// When a dependency changes, recompute.
	this._source.each(function (m) {
		this.listenTo(m, "change:" + spec.pluck, this._recompute);
	}, this);

	// Update our subscriptions when dependencies are added or removed.
	this.listenTo(this._source, "add", this._onAdd);
	this.listenTo(this._source, "remove", this._onRemove);
	this.listenTo(this._source, "reset", this._onReset);
};

_.extend(Backbone.ReactiveModel.CollectionProperty.prototype, Backbone.Events, {
	_onAdd: function (added) {
		this.listenTo(added, "change:" + this._spec.pluck, this._recompute);
		this._recompute();
	},
	_onRemove: function (removed) {
		this.stopListening(removed);
		this._recompute();
	},
	_onReset: function () {
		this.stopListening();
		this._source.each(function (m) {
			this.listenTo(m, "change:" + this._spec.pluck, this._recompute);
		}, this);
		this._recompute();
	},
	_recompute: function () {
		var value = this._spec.compute.apply(null, this._source.pluck(this._spec.pluck));
		this._target.set(this._targetProp, value);
	}
});
