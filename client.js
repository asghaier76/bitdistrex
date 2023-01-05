'use strict'

const Order = require("./order")
const Orderbook = require("./orderbook")
const { PeerRPCClient }  = require('grenache-nodejs-http')
const { PeerPub }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')
const readline = require('readline');
const { PeerSub }  = require('grenache-nodejs-ws')
const { v4: uuidv4 } = require('uuid');

const clientID = uuidv4()

const rl = readline.createInterface(process.stdin, process.stdout);

const orderBook = new Orderbook();
console.log(orderBook)

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()


function handleOrderRequest(order,action) {
  peer.request('rpc_trade', { msg: {order, action} }, { timeout: 10000 }, (err, data) => {
    if (err) {
      console.error(err)
      process.exit(-1)
    }
    console.log(data) 
  })
}

function parseOrder(order) {
  const args = order.split(' ');
  if(args.length == 5 && args[0] !== "removeOrder") {
    return {
      action: args[0],
      id: uuidv4(),
      isBuyOrder: args[1] == 'buy',
      asset: args[2],
      price: Number(args[3]),
      amount: Number(args[4]),
      clientID: clientID
    }
  } else if(args.length == 2 && args[0] === "removeOrder") {
    return {
      action: args[0],
      id: args[1]
    }
  } else if(args.length == 6 && args[0] === "updateOrder") {
    return {
      action: args[0],
      id: args[1],
      isBuyOrder: args[2] == 'buy',
      asset: args[3],
      price: Number(args[4]),
      amount: Number(args[5]),
      clientID: clientID
    }
  } else {
    return null;
  }
}

function handleOrderMessage(orderMessage) {
  console.log(orderMessage)
  let res;
  switch (orderMessage.action) {
    case "newOrder":
      const orderObj = new Order(orderMessage.order);
      res = orderBook.addOrder(orderObj);
      if(res.type === 'match') {
        // TO BE ADDED a mechanusm to propagate back the matched orders so that they can be ensured it is replicated across all instances
        // handleOrderRequest(res.data, 'reconcileOrders');
      }
      break;
    case "removeOrder": 
      orderBook.removeOrder(orderMessage.order.id);
      break;
    case "updateOrder": 
      res = orderBook.updateOrder(orderMessage.order);
      if(res.type === 'match') {
        // TO BE ADDED a mechanusm to propagate back the matched orders so that they can be ensured it is replicated across all instances
        // handleOrderRequest(res.data, 'reconcileOrders');
      }
      break;
  }
  console.log(orderBook)
}

const peerWS = new PeerSub(link, {})
peerWS.init()

peerWS.sub('rpc_trade_ws', { timeout: 10000 })

peerWS.on('connected', () => {
  console.log('connected')
})

peerWS.on('disconnected', () => {
  console.log('disconnected')
})

peerWS.on('message', (msg) => {
  console.log('msg')
  console.log(msg)
  const orderMessage = JSON.parse(msg);

  handleOrderMessage(orderMessage.msg)
})

rl.setPrompt(`Enter order details >>`);
rl.prompt();
rl.on('line', (order) => {
  const parsedOrder = parseOrder(order);
  if(!parsedOrder) {
    console.log('Error in order details, please re-enter order details >>')
  } else {
    console.log(JSON.stringify(parsedOrder))
    handleOrderRequest(parsedOrder, parsedOrder.action);
  }
});


