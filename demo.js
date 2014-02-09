(function () {
	var CartItemView = Marionette.ItemView.extend({
		template: "#template-cartItemView",
		tagName: "tr",
		events: {
			"change .qty": "qtyChanged"
		},
		onRender: function () {
			this.listenTo(this.model, "change:totalPrice", this.totalPriceChanged);
		},
		qtyChanged: function (event) {
			var newQty = parseInt($(event.target).val(), 10);

			if (newQty) {
				this.model.set("qty", newQty);
			}
		},
		totalPriceChanged: function () {
			this.$el.find(".totalPrice").text(this.model.get("totalPrice"));
		}
	});

	var CartListView = Marionette.CompositeView.extend({
		template: "#template-cartListView",
		itemViewContainer: "tbody",
		itemView: CartItemView
	});

	var app = new Marionette.Application();

	app.addInitializer(function () {
		var items = _.map([
			{ name: "Case of dynamite", unitPrice: 60, qty: 1 },
			{ name: "Anvil", unitPrice: 50, qty: 2 },
			{ name: "Paint-on tunnel", unitPrice: 20, qty: 1 }
		], function (spec) {
			spec.reactive = {
				totalPrice: {	
					deps: ["unitPrice", "qty"],
					compute: function (unitPrice, qty) {
						return unitPrice * qty;
					}
				}
			};
			return new Backbone.ReactiveModel(spec);
		});

		var cart = new Backbone.Collection(items);
		app.root.show(new CartListView({
			collection: cart
		}));
	});

	app.root = new Marionette.Region({ el: "#root" });
	app.start();
}());
