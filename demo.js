(function () {
	var sum = function () {
		var i, total = 0;

		for (i = 0; i < arguments.length; i++) {
			total += arguments[i];
		}

		return total;
	};

	var CartItem = Backbone.ReactiveModel.extend({
		reactive: {
			totalPrice: {
				deps: ["unitPrice", "qty"],
				compute: function (unitPrice, qty) {
					return unitPrice * qty;
				}
			}
		}
	});

	var CartItemList = Backbone.Collection.extend({
		model: CartItem
	});

	var Cart = Backbone.ReactiveModel.extend({
		constructor: function () {
			Backbone.ReactiveModel.call(this, {
				items: new CartItemList()
			});
		},
		reactive: {
			grandTotalPrice: {
				collection: "items",
				pluck: "totalPrice",
				compute: sum
			}
		}
	});

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
		var cart = new Cart();
		cart.get("items").reset([
			{ name: "Case of dynamite", unitPrice: 60, qty: 1 },
			{ name: "Anvil", unitPrice: 50, qty: 2 },
			{ name: "Paint-on tunnel", unitPrice: 20, qty: 1 },
			{ name: "Earthquake pills", unitPrice: 5, qty: 1 }
		]);
		app.root.show(new CartView({
			model: cart,
			collection: cart.get("items")
		}));
	});

	app.root = new Marionette.Region({ el: "#root" });
	app.start();
}());
