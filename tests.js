describe("Reactive Backbone properties", function () {
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
