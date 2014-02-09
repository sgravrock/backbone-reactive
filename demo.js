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

	var CartView = Marionette.CompositeView.extend({
		template: "#template-cartView",
		itemViewContainer: ".items",
		itemView: CartItemView,
		onRender: function () {
			this.listenTo(this.model, "change:grandTotalPrice", this.grandTotalPriceChanged);
		},
		grandTotalPriceChanged: function () {
			this.$el.find(".grandTotalPrice").text(this.model.get("grandTotalPrice"));
		}
	});

	var app = new Marionette.Application();

	app.addInitializer(function () {
		var items = new Backbone.Collection(_.map([
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
		}));

		var cart = new Backbone.ReactiveModel({
			reactive: {
				grandTotalPrice: {
					collection: items,
					pluck: "totalPrice",
					compute: function () {
						var i, sum = 0;

						for (i = 0; i < arguments.length; i++) {
							sum += arguments[i];
						}

						return sum;
					}
				}
			}
		});
		app.root.show(new CartView({
			model: cart,
			collection: items
		}));
	});

	app.root = new Marionette.Region({ el: "#root" });
	app.start();
}());
