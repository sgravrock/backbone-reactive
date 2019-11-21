*Note: These days, there are much better choices than Backbone and much better
choices than this library if you want to do reactive work. This is provided
for historical interest and should probably not be used for anything new.*

# backbone-reactive
Reactive models for Backbone.js

This is a small add-on to Backbone.js that allows models to have reactive
properties:

```
var source = new Backbone.Model({ a: 1 });
var target = new Backbone.ReactiveModel({
  b: 2,
  reactive: {
    "c": {
      deps: [{name: "a", source: source}, "b"],
      compute: function (a, b) { return a + b; }
    }
  }
});
```

Reactive properties recompute automatically when the properties that they
depend on change. They are otherwise like normal model properties. In
particular, they generate change events just like normal properties.
