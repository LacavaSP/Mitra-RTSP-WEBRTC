const { spawn } = require('child_process');
const WebSocket = require('ws');
const express = require('express')
const fs = require('fs')
const path = require('path')
const wss = new WebSocket.Server({ port: 5661 });
const porta = 3030
const peers = new Map()
const offStreamImage = fs.readFileSync(path.join(__dirname, '/assets/offstream.jpg'))
wss.on('connection', (client) => {
    console.log('Novo cliente conectado!')
   // wsClients.push(client)
    client.send('Olá')
})
  

let urls = []
let stoppedStreams = []
// Comando ffmpeg para capturar os quadros e convertê-los em base64
 

let isStreaming = false


function buildFfmpegCommand(url) {
    return [
        '-i', url,
        '-vf', 'fps=15,scale=640:-1', // Reduz a taxa de quadros e a resolução (largura 640px, altura mantida proporcionalmente)
        '-f', 'image2pipe',
        '-c:v', 'mjpeg',
        '-timeout', '5',  // Codec de vídeo JPEG (MJPEG) 
        '-'
    ];
}

function startStream(streamData) {
  const command =  buildFfmpegCommand(streamData.link)
  const ffmpeg = spawn('ffmpeg', command);
 
 
  // Capturando a saída do ffmpeg (quadro)
  ffmpeg.stdout.on('data', (data) => {
    // Convertendo o quadro em base64
    const base64Frame = Buffer.from(data); 
    isStreaming = true 
    if (peers?.size > 0) {
        for (const client of peers.values()) {
           
            if (client?._channel?.readyState) {
                
                if (!client.invalidStrId && streamData.id === client.appData.streamId) {
                    client.send(base64Frame) 
                }

            }
         
        }
    }
    
  });
 

  // Lidando com o término do processo ffmpeg
  ffmpeg.on('close', (code) => {
    console.log(command)
    console.log(`Processo ffmpeg encerrado com código ${code}`); 
    isStreaming = false 
  });

  return ffmpeg
} 

const servidorHttp = express()

servidorHttp.use(express.json())
servidorHttp.use(express.static('public'))
servidorHttp.listen(porta, '192.168.0.10', () => console.log('http on'))


const io = require('socket.io-client');

// Conectar ao servidor Socket.IO
const {
  OFFER_EVENT,
  CANDIDATE_EVENT,
  ANSWER_EVENT
} = require('./shared/SocketEventsNames')

const socket = io('http://localhost:6060', {
    query: {
        dados: JSON.stringify({
            type: "streamer",
            channel: "camera1", 
        })
    }
});

// Evento 'connect': é acionado quando a conexão é estabelecida
socket.on('connect', () => {
    console.log('Conectado ao servidor Socket.IO');
});

// Evento 'disconnect': é acionado quando a conexão é encerrada
socket.on('disconnect', () => {
    console.log('Desconectado do servidor Socket.IO');
});

const SimplePeer = require('simple-peer');
const wrtc = require('wrtc')

// Função para criar um par
function genPeer(id, peerData) {
    const peer = new SimplePeer({
        initiator: true, // Define o par como o iniciador da conexão
        trickle: false, // Desativa o trickle ICE
        wrtc: wrtc
    });
 
    
    socket.on(CANDIDATE_EVENT, (data) => {
      console.log(data)
      if (data.id === id && data.candidate) {
          console.log('Candidato ICE recebido:', data.candidate);
          // Adicione o candidato ICE ao par
  
          peer.addIceCandidate(data.candidate)
              .then(() => {
                  console.log('Candidato ICE adicionado com sucesso!');
              })
              .catch((err) => {
                  console.error('Erro ao adicionar candidato ICE:', err);
              });
      }
    });
 
    // Ouvir o evento 'signal' para receber sinais de sinalização
    peer.on('signal', (offer) => {
        // Aqui, 'data' contém o sinal que deve ser enviado para o outro pa
        console.log('Sinal pronto para enviar para o outro par:'); 
        socket.emit(OFFER_EVENT, {
          id: id,
          offer: offer,
          type: 'streamer'
        })
    });

    peer.on('close', () => peers.delete(id))

    socket.on(ANSWER_EVENT, (data) => { 
       
        if (!peer.destroyed) {
            peer.signal(data.answer)
        }

    })
  
   
    peer.on('connect', () => {
        console.log('Conexão estabelecida! ');
        // Agora você pode começar a enviar e receber dados
        peer.appData = peerData
        peers.set(id, peer)
    
    });
 
    peer.on('data', (data) => {
        console.log('Dados recebidos:', data);
        const mensagem = JSON.parse(data)
        console.log(mensagem)

        if (mensagem.type === 'streamChange') {
                const obj = peers.get(id)
            console.log(stoppedStreams)
            if (urls.find((v) => v.id === mensagem.streamId)) {
                console.log('valido')
                obj.invalidStrId = false
                obj.appData.streamId = mensagem.streamId
            } else {
                console.log('invalido')
                obj.invalidStrId = true
                console.log(obj.appData)
                console.log(offStreamImage)
                obj.send(offStreamImage)
            }
         
        }

    });
 
    peer.on('error', (err) => {
        console.error('Erro:', err);
    });
  

    return peer;
}

// Evento 'call': é acionado quando um evento 'call' é recebido do servidor
socket.on('call', (data) => {
    const tipo = data?.type;
    const peerData = data.data
    const id = data?.id;
    if (tipo && tipo === 'listener') {
        console.log('Chamado aceito:', data);
        if (id) {
            const peer = genPeer(id, peerData); 
        }
    }
});


function configureVideoStreaming() {
    let data = [ ]

    urls = data

    for (const streamData of urls) {
        try {
            startStream(streamData)
        } catch (e) {
            console.log(e)
        }
    
    }
}

configureVideoStreaming()
 