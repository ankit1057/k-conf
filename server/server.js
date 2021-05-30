const express = require("express")

const bodyParser = require("body-parser")
const cors = require("cors")

const app = express()

app.use(cors({origin: true}))
app.use(bodyParser.json())


const http = require('http')
var server = http.createServer(app)


exports.server = server


exports.run = () => server.listen(process.env.PORT, process.env.HOSTNAME, () => {
    console.log("Express server is running at PORT : " + process.env.PORT)
})