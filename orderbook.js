'use strict'

class Orderbook {

    constructor() {
      this.buyOrders = [];
      this.sellOrders = [];
    }
  
    addOrder(order) {
        if(!this.orderExists(order)) {
            if (order.isBuyOrder) {
                this.buyOrders.push(order);
                return this.matchOrder(order)
            } else {
                this.sellOrders.push(order);
                return this.matchOrder(order)
            }
        } else {
            throw Error('Order exists')
        }
    }

    updateOrder(order) {
        if(this.orderExists(order)) {
            if (order.isBuyOrder) {
                const orderIdx = this.buyOrders.indexOf(item => item.id === order.id);
                this.buyOrders.splice(orderIdx, 1, order);
                return this.matchOrder(order);
            } else {
                const orderIdx = this.sellOrders.indexOf(item => item.id === order.id);
                this.sellOrders.splice(orderIdx, 1, order);
                return this.matchOrder(order);
            }
        } else {
            throw Error('Order does not exist')
        }
    }

    orderExists(order) {
        if (order.isBuyOrder) {
            return this.buyOrders.some(item=> item.id === order.id && item.clientID === order.clientID);
        } else {
            return this.sellOrders.some(item=> item.id === order.id && item.clientID === order.clientID);
        } 
    }
  
    removeOrder(orderId) {
      for (let i = 0; i < this.buyOrders.length; i++) {
        if (this.buyOrders[i].id === orderId) {
          this.buyOrders.splice(i, 1);
          return;
        }
      }
      for (let i = 0; i < this.sellOrders.length; i++) {
        if (this.sellOrders[i].id === orderId) {
          this.sellOrders.splice(i, 1);
          return;
        }
      }
    }

    matchOrder(order) {
        if(!order.isBuyOrder) {
          const match = this.buyOrders.find(item => item.price == order.price && item.amount >= order.amount)
          if(match) {
            if(match.amount == order.amount) {
                this.removeOrder(order.id)
                this.removeOrder(match.id)  
            } else {
                this.removeOrder(order.id)
                let updatedOrder = match;
                updatedOrder.amount = match.amount - order.amount;
                this.addOrder(updatedOrder)
            }
            return {
              type: 'match',
              message: 'Order matched',
              data: {
                matchedAt: Date.now(),
                submittedOrder: order,
                matchedOrder: match,
              }
            }
          } else {
            return {
                type: 'queued',
                message: 'Order created',
                data: {
                  createdAt: Date.now(),
                  submittedOrder: order,
                }
              } 
          }
        } else {
            const match = this.sellOrders.find(item => item.price == order.price && item.amount <= order.amount)
            if(match) {
                if(match.amount == order.amount) {
                    this.removeOrder(order.id)
                    this.removeOrder(match.id)  
                } else {
                    this.removeOrder(match.id)
                    let updatedOrder = order;
                    updatedOrder.amount = order.amount - match.amount;
                    this.addOrder(updatedOrder)
                }
              return {
                type: 'match',
                message: 'Order matched',
                data: {
                  matchedAt: Date.now(),
                  submittedOrder: order,
                  matchedOrder: item,
                }
              }
            } else {
                return {
                    type: 'queued',
                    message: 'Order created',
                    data: {
                      createdAt: Date.now(),
                      submittedOrder: order,
                    }
                  } 
            }
        }
      }
}

module.exports = Orderbook;