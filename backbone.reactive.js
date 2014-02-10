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
		this.reactive = reactiveAttr || this.reactive || {};
		this._reactiveProps = [];
	
		_.chain(this.reactive).keys().each(function (propName) {
			var propSpec = this.reactive[propName];
	
			if (propSpec.collection) {
				this._reactiveProps.push(new Backbone.ReactiveModel.CollectionPlucker(this, propName,
					propSpec));
			} else {
				// Compute the initial value for the dependency
				this._reactiveRecompute(propName);
		
				// When a dependency changes, recompute all properties that depend on it.
				_.each(propSpec.deps, function (dep) {
					dep = this._normalizeDependency(dep);
					this.listenTo(dep.source, "change:" + dep.name, function () {
						this._reactiveRecompute(propName);
					});
				}, this);
			}
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
	_reactiveRecompute: function (propName) {
		var depValues = _.map(this.reactive[propName].deps,
				this._valueOfDependency.bind(this));
		var value = this.reactive[propName].compute.apply(null, depValues);
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

Backbone.ReactiveModel.extend = Backbone.Model.extend;

Backbone.ReactiveModel.CollectionPlucker = function (target, targetProp, spec) {
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

_.extend(Backbone.ReactiveModel.CollectionPlucker.prototype, Backbone.Events, {
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
