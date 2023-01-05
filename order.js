'use strict'

class Order {
    constructor(order) {
      this.id = order.id
      this.isBuyOrder = order.isBuyOrder;
      this.asset = order.asset;
      this.price = order.price;
      this.amount = order.amount;
      this.clientID = order.clientID;
    }
}

module.exports = Order