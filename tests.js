describe("Reactive Backbone properties", function () {
	it("should have the value returned by the compute function", function () {
		var target = new Backbone.ReactiveModel({
			a: 1,
			b: 2,
			reactive: {
				"c": { deps: ["a", "b"], compute: function (a, b) { return a + b; } }
			}
		});

		expect(target.get("c")).toEqual(3);
	});
});
