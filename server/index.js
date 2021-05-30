require("dotenv").config()
require('./socketio')
const server = require("./server")


server.run()

