'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')
const { PeerPub }  = require('grenache-nodejs-ws')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peerWS = new PeerPub(link, {})
peerWS.init()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

const portWS = port+1
const serviceWS = peerWS.transport('server')
serviceWS.listen(portWS)

console.log(service)
console.log(serviceWS)

setInterval(function () {
  link.announce('rpc_trade', service.port, {})
  link.announce('rpc_trade_ws', serviceWS.port, {})
}, 1000)

service.on('request', (rid, key, payload, handler) => {
  console.log(payload) //  { msg: 'hello' }
  // const res = matchOrder(payload);
  handler.reply(null, payload )
  serviceWS.pub(JSON.stringify(payload))
})
