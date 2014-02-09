describe("Reactive Backbone properties", function () {
	var isReachable = function (source, dest, visited) {
		var k;

		if (source === dest) {
			return true;
		}

		if (!visited) {
			visited = [];
		}

		visited.push(source);

		for (k in source) {
			if (typeof source[k] === "object" &&
					visited.indexOf(source[k]) === -1 &&
					isReachable(source[k], dest, visited)) {
				console.log("reachable via " + k);
				return true;
			}
		}

		return false;
	};

	describe("that depend on propreties of the same model", function () {
		var target;
	
		beforeEach(function () {
			target = new Backbone.ReactiveModel({
				a: 1,
				b: 2,
				reactive: {
					"c": {
						deps: ["a", "b"],
						compute: function (a, b) { return a + b; }
					}
				}
			});
		});
	
		it("should have the value returned by the compute function", function () {
			expect(target.get("c")).toEqual(3);
		});
	
		it("should recompute when any dependency changes", function () {
			var listener = jasmine.createSpy("change listener");
			target.on("change:c", listener);
			target.set("a", 3);
			expect(target.get("c")).toEqual(5, "Wrong value");
			expect(listener).toHaveBeenCalledWith(target, 5, {});
		});
	});

	describe("that depend on propreties of other models", function () {
		var source, target;
	
		beforeEach(function () {
			source = new Backbone.Model({ a: 1 });
			target = new Backbone.ReactiveModel({
				b: 2,
				reactive: {
					"c": {
						deps: [{name: "a", source: source}, "b"],
						compute: function (a, b) { return a + b; }
					}
				}
			});
		});
	
		it("should have the value returned by the compute function", function () {
			expect(target.get("c")).toEqual(3);
		});
	
		it("should recompute when any dependency changes", function () {
			var listener = jasmine.createSpy("change listener");
			target.on("change:c", listener);
			source.set("a", 3);
			expect(target.get("c")).toEqual(5, "Wrong value");
			expect(listener).toHaveBeenCalledWith(target, 5, {});
		});

		it("should not leak memory", function () {
			var listener = jasmine.createSpy("change listener");
			target.on("change:c", listener);
			expect(isReachable(target, source)).toEqual(true, "Bug in isReachable");
			target.stopListening();
			expect(isReachable(target, source)).toEqual(false);
			source.set("a", 3);
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("that pluck from a colletion", function () {
		var source, target, listener;

		var computeSum = function () {
			var i, sum = 0;

			for (i = 0; i < arguments.length; i++) {
				sum += arguments[i];
			}

			return sum;
		};

		beforeEach(function () {
			source = new Backbone.Collection([
				{ value: 1 },
				{ value: 2 }
			]);
			target = new Backbone.ReactiveModel({
				reactive: {
					sum: {
						collection: source,
						pluck: "value",
						compute: computeSum
					}
				}
			});
			listener = jasmine.createSpy("change listener");
			target.on("change:sum", listener);
		});

		it("should have the value returned by the compute function", function () {
			expect(target.get("sum")).toEqual(3);
		});

		it("should recompute when any dependency changes", function () {
			source.at(1).set("value", 3);
			expect(target.get("sum")).toEqual(4, "Wrong value");
			expect(listener).toHaveBeenCalledWith(target, 4, {});
		});

		it("should recompute when a dependency is added", function () {
			source.add({ value: 3 });
			expect(target.get("sum")).toEqual(6, "Wrong value");
			expect(listener).toHaveBeenCalledWith(target, 6, {});
		});

		it("should recompute when a dependency is removed", function () {
			source.remove(source.at(0));
			expect(target.get("sum")).toEqual(2, "Wrong value");
			expect(listener).toHaveBeenCalledWith(target, 2, {});
		});

		describe("that is named by a string", function () {
			it("should bind to the named collection on the same model", function () {
				var namedSource = new Backbone.Collection([
					{ value: 3 },
					{ value: 4 }
				]);
				target = new Backbone.ReactiveModel({
					items: namedSource,
					reactive: {
						sum: {
							collection: "items",
							pluck: "value",
							compute: computeSum
						}
					}
				});
				expect(target.get("sum")).toEqual(7, "Wrong value");
				listener = jasmine.createSpy("change listener");
				target.on("change:sum", listener);
				namedSource.at(0).set("value", 2);
				expect(listener).toHaveBeenCalledWith(target, 6, {});
			});
		});

		describe("When the collection is reset", function () {
			it("should recompute", function () {
				source.reset([
					{ value: 5 },
					{ value: 10 }
				]);
				expect(target.get("sum")).toEqual(15, "Wrong value");
				expect(listener).toHaveBeenCalledWith(target, 15, {});
			});

			it("should stop listening to the old contents", function () {
				var old = source.at(0);
				source.reset([]);
				listener.calls.reset();
				old.set("value", 3);
				expect(listener).not.toHaveBeenCalled();
			});
		});

		it("should not leak memory", function () {
			target.on("change:sum", listener);
			expect(isReachable(target, source)).toEqual(true, "Bug in isReachable");
			target.stopListening();
			expect(isReachable(target, source)).toEqual(false);
			source.at(1).set("value", 3);
			expect(listener).not.toHaveBeenCalled();
		});
	});

	it("should inherit from the object's prototype", function () {
		var DerivedModel = Backbone.ReactiveModel.extend({
			reactive: {
				c: {
					deps: ["a", "b"],
					compute: function (a, b) { return a + b; }
				}
			}
		});
		var target = new DerivedModel({
			a: 1,
			b: 2
		});
		expect(target.get("c")).toEqual(3);
	});
});
