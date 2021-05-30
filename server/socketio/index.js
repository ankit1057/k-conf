const {server} = require("..")
const io = require("socket.io")(server)



const connections = {}
var broadcaster = null

io.sockets.on("connection", socket => {
    console.log("Connected", socket.id)

    socket.on('send', ([id, data]) => {
        const receiver = connections[id]
        if(!receiver) socket.emit("ackSend", {status: "failed", code: 404, receiver: id})
        else if(receiver.connected) receiver.emit("receive", data)
    });

    // WebRTC handshaking
    socket.on("broadcaster", () => {
        console.log("broadcaster", socket.id)
        broadcaster = socket.id;
        socket.broadcast.emit("broadcaster");
    });
    socket.on("watcher", () => {
        console.log("watcher", socket.id)
        socket.to(broadcaster).emit("watcher", socket.id);
    });
    socket.on("disconnect", () => {
        console.log("disconnect", socket.id)
        socket.to(broadcaster).emit("disconnectPeer", socket.id);
    });
    socket.on("offer", (id, message) => {
        console.log("offer", id, socket.id)
        socket.to(id).emit("offer", socket.id, message);
    });
    socket.on("answer", (id, message) => {
        console.log("answer", id, socket.id)
      socket.to(id).emit("answer", socket.id, message);
    });
    socket.on("candidate", (id, message) => {
        console.log("candidate", id, socket.id)
      socket.to(id).emit("candidate", socket.id, message);
    });
    
})

