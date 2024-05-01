const fs = require('fs')
const express  = require('express')
const setupFile = JSON.parse(fs.readFileSync('rtcServerConfig.json', 'utf-8'))
const expressServer = express()
const nodeJsHttpModule = require('http')

const cors = require('cors')
const exp = require('constants') 
const channelService = require('./services/ChannelService')()

expressServer.use(cors({
    allowedHeaders: '*',
    origin: '*',
    credentials: false,
    exposedHeaders: '*',
    methods: '*'
}))
expressServer.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permite solicitações de qualquer origem
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'); // Permitir métodos específicos
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Permitir cabeçalhos específicos
    next();
});

const backendServer = nodeJsHttpModule.createServer(expressServer)

class WebRTCServerApp {

    constructor() {

        if (!setupFile) {
            throw new Error("I can't find the RTC Server config file. Are u sure that created it?")
        } else {
            if (!setupFile.port) {
                throw new Error("The express http server port does not exists. You need to create it.")
            }
            if (!setupFile.address) {
                throw new Error("The express http server address does not exists. I'll presume that must be localhost.")
            }
        }
        
        this.port = setupFile.port
        this.address = setupFile.address ? setupFile.address : 'localhost' 
    }

    initEntireApplication() {
        backendServer.listen(this.port, this.address, this.whenBackendAppHasBeenInitialized)
        return expressServer
    }

    whenBackendAppHasBeenInitialized() {
        const WebRTCGatewayService = require('./services/WebRTCGatewayService')(backendServer)
        console.log('The ExpressJS HTTP Server from WebRTC Server APP has been successfully initialized.') 
      /*  const io = require('socket.io')(backendServer, {
            cors: {
                origin: "*",
                methods: "*"
              }
        })
        io.on('connection', (socket) => {
            console.log('ola')
        })*/
    }
    

}

const app = new WebRTCServerApp()

//RUN LINE
const serverHTTP = app.initEntireApplication()

serverHTTP.get('/rtcServer/channels', async (req, res) => {
    console.log(channelService)
    const channels = await (channelService.listChannels())
    console.log(channels)
    return res.status(200).json(channels)
}) 