const ioModule = require('socket.io')
const {
    CONNECTION_EVENT,
    ANSWER_EVENT,
    OFFER_EVENT,
    DISCONNECT_EVENT,
    CANDIDATE_EVENT,
    CALL_EVENT
      
} = require('../shared/SocketEventsNames')
const ChannelService = require('./ChannelService')()

class WebRTCGatewayService {

    constructor(backendServer) { 
        console.log('importado') 
        this.turnOn(backendServer)
        this.channels = []
        this.channelService = ChannelService
    }

    turnOn(backendServer) {
 
         this.socketListener = ioModule(backendServer, {
            cors: {
                origin: "*",
                methods: "*"
              }
        })

        this.socketListener.on(CONNECTION_EVENT, async (socket) => {
            const connectionData = JSON.parse(socket.handshake.query.dados)
            const clientChannel = connectionData.channel
            const type = connectionData.type
        
            if (!connectionData.type || !connectionData.channel || (connectionData?.type !== 'streamer' && !connectionData.streamId)) {
                socket.disconnect()
            }
        
           /* if (!(await this.channelService.verifyIfChannelExists(clientChannel))) {
                console.log('Channel does not exist')
                socket.disconnect()
            }*/
        
            console.log(`Client ${socket.id} entering ${clientChannel} as a ${type}`)
            socket.join(clientChannel)
         
            socket.to(clientChannel).emit(CALL_EVENT, {
                id: socket.id,
                type: type,
                data: connectionData
            })
         
            socket.on(OFFER_EVENT, (data) => {
                console.log(`Origin socket ${socket.id} offering to ${data.id}`)
                const connectionDataOffer = JSON.parse(socket.handshake.query.dados)
         
                socket.to(data.id).emit(OFFER_EVENT, {
                    id: socket.id,
                    offer: data.offer
                })
            })
         
            socket.on(ANSWER_EVENT, (data) => {
                console.log(`Socket ${socket.id} answering to ${data.id}`)
        
                socket.to(data.id).emit(ANSWER_EVENT, {
                    id: socket.id,
                    answer: data.answer
                })
            })
        
            socket.on(CANDIDATE_EVENT, (data) => {
                console.log(`${socket.id} sending a candidate to ${data.id}`)
                socket.to(data.id).emit(CANDIDATE_EVENT, {
                    id: socket.id,
                    candidate: data.candidate,
                    type: data.type
                })
            })
        
            socket.on(DISCONNECT_EVENT, () => {
                console.log(`${socket.id} disconnected`)  
            })
        })
        
        this.socketListener.on('error', (erro) => console.log(erro))
    }
}

module.exports = (backendServer) => {
    return new WebRTCGatewayService(backendServer)
}