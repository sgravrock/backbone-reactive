describe("Reactive Backbone properties", function () {
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

		it("should not update after stopListening has been called", function () {
			var listener = jasmine.createSpy("change listener");
			target.on("change:c", listener);
			target.stopListening();
			source.set("a", 3);
			expect(listener).not.toHaveBeenCalled();
		});
	});
});
