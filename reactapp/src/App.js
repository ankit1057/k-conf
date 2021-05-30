import openSocket from 'socket.io-client'
import React from 'react';
// const socket = openSocket("http://192.168.13.63:5000", {query: {token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzIjoiaGVsbG93IiwiaWF0IjoxNjAwMzM1MDcyLCJleHAiOjE2MDAzMzUxOTJ9.0-OEnNnl_KNmeYLhVEOSME3U0hLFUwp-vySNNzSaLkM"}})



var socket = openSocket()


//Lifecycles calls
socket.on("connect", () => console.log("connect"))
socket.on("disconnect", () => console.log("disconnect"))
socket.on("connect_error", () => console.log("connect_error"))
socket.on("connect_timeout", () => console.log("connect_timeout"))
socket.on("reconnect_attempt", () => console.log("reconnect_attempt"))
socket.on("reconnect_error", () => console.log("reconnect_error"))
socket.on("reconnect_failed", () => console.log("reconnect_failed"))
socket.on("reconnecting", () => console.log("reconnecting"))
socket.on("reconnect", () => console.log("reconnect"))
socket.on("ping", () => console.log("ping"))
socket.on("pong", () => console.log("pong"))
socket.on("error", () => console.log("error"))



socket.on("receive", data => console.log("receive", data))
socket.on("ackSend", (...data) => console.log(data))


const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};
  


class WebRTCApp extends React.Component{
    state = {
        peer: null,
        connections: {},
        streamCanvas: [
          // <video autoPlay controls key={0} id="blankPeer" ref={this.handlePeer} ></video>
        ],
        canvasRefs: {},
    }
    componentDidMount(){
        
        socket.on("broadcaster", () => {
          socket.emit("watcher");
        });
        socket.on("watcher", this.watcherListener)
        socket.on("answer", this.answerListener)
        socket.on("candidate", this.candidateListener);
        socket.on("offer", this.offerListener);
        socket.on("disconnectPeer", this.onDisconectPeer);
        
    }

    startVideoFeed = () => {

      if(!!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia){
        
        const constraints = {
            // video: { facingMode: "user" }
            // // Uncomment to enable audio
            // // audio: true,
            video: {height:128, aspectRatio: 1.6, frameRate: 25}, 
            audio: {echoCancellation: true, noiseSuppression: true, channelCount: 1, autoGainControl: true, sampleRate: 44000, }
        };
        navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => {
          const video = document.getElementById("myStream")
          video.srcObject = stream
          video.play()
          socket.emit("broadcaster");
        })
        .catch(error => console.error(error));
      }
    }

  handlePeer = (ref) =>{
    const {canvasRefs} = this.state
    canvasRefs[ref.id] = ref
    ref.srcObject = new MediaStream()
    this.setState({canvasRefs})
  }
  watcherListener = (id) => {
    console.log("watcher =>", id, socket.id)
    const video = document.getElementById("myStream")
    let stream = video.srcObject;
    const peerConnection = new RTCPeerConnection(config);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("candidate", id, event.candidate);
      }
    };
    peerConnection
      .createOffer()
      .then(sdp => peerConnection.setLocalDescription(sdp))
      .then(() => {
        socket.emit("offer", id, peerConnection.localDescription);
      });
    this.state.connections[id] = peerConnection;
  }



    
  candidateListener = (id, candidate) => {
      this.state.connections[id].addIceCandidate(new RTCIceCandidate(candidate));
  }

  offerListener = (id, description) => {

    console.log("offer =>", id, socket.id)
    this.setState({streamCanvas: [...this.state.streamCanvas, 
      <video  key={this.state.streamCanvas.length} id={id} ref={this.handlePeer} ></video>
    ]}, () => {
      let video = document.getElementById(id)
      const peerConnection = new RTCPeerConnection(config);
      this.state.connections[id] = peerConnection
      peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit("answer", id, peerConnection.localDescription);
        });
      peerConnection.ontrack = event => {
        video.srcObject = event.streams[0];
        video.play()
      };
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("candidate", id, event.candidate);
        }
      };
    })
  }
  
  answerListener = (id, description) => {
        this.state.connections[id].setRemoteDescription(description);
  }
    
  onDisconectPeer = id => {
      this.state.connections[id].close();
      delete this.state.connections[id];
  }

  render(){
    console.log(this.state.streamCanvas)
    return <div className="App">
      <div>
        <video id="myStream" ></video>
        <button onClick={this.startVideoFeed}>Start my stream</button>
        <button onClick={() => this.forceUpdate()}>Update</button>
      </div>
      <div>
        <div>Received Streams</div>
        {this.state.streamCanvas}
      </div>
    </div>
  }
}

export default WebRTCApp