import React, { useEffect } from 'react';
import io from 'socket.io-client';

function CameraComponent({width, height, loadingComponent, setDataChannel}) {
    const [isLoading, setIsLoading] = React.useState(true)

    useEffect(() => {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        const { RTCPeerConnection } = window;

        class User {
            constructor(id) {
                this.id = id;
                this.pc = null;
            }
        }

        function createPeer(user, socket) {
            const rtcConfiguration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    {
                        urls: 'turn:195.35.37.40:3478',
                        username: 'userRTC',
                        credential: '12345678'
                    }
                ]
            }

            const pc = new RTCPeerConnection(rtcConfiguration);
            
            pc.ondatachannel = (event) => {
                setDataChannel(event.channel)
                event.channel.onmessage = (event) => { 
                    const image = new Image();
                    if (isLoading) {
                        setIsLoading(false )
                    }
                    image.onload = function() {
                        // Limpa o canvas e desenha a imagem
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    }; 
                    image.src = 'data:image/jpeg;base64,' + arrayBufferToBase64(event.data);  
                };
            };
           
            pc.onicecandidate = (event) => {
                if (!event.candidate) {
                    return;
                }
                socket.emit('candidate', {
                    id: socket.id,
                    candidate: event.candidate,
                    type: 'listener',
                });
            };

            return pc;
        }

        function arrayBufferToBase64(buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        }

        const users = new Map();
        const socket = io('http://92.119.129.85:6060', {
            query: {
                dados: JSON.stringify({
                    type: "listener",
                    channel: "camera1", 
                    streamId: "1"
                })
            }, 
        });

        socket.on('connect', () => {
            console.log('Conectado ao servidor');
        });

        socket.on('disconnect', () => {
            console.log('Desconectado do servidor');
            socket.disconnect();
        });

        socket.on('candidate', function (data) {
            if (data.type === 'streamer') {
                let user = users.get(data.id);
                if (!user) {
                    user = new User(data.id);
                    user.pc = createPeer(user, socket);
                    users.set(data.id, user);
                }
                user.pc.addIceCandidate(data.candidate).then(() => {
                    console.log('Candidato adicionado com sucesso');
                }).catch((error) => {
                    console.error('Erro ao adicionar candidato:', error);
                });
            }
        });
        
        socket.on('offer', function (data) {
            let user = users.get(data.id);
            console.log('oferta recebida')
            if (!user) {
                user = new User(data.id);
                user.pc = createPeer(user, socket);
                users.set(data.id, user);
            }
            user.pc.setRemoteDescription(data.offer).then(() => {

                user.pc.createAnswer().then((answer) => {
                    return user.pc.setLocalDescription(answer);
                }).then(() => {
                    console.log('respondendo')
                    socket.emit('answer', {
                        id: user.id,
                        answer: user.pc.localDescription
                    });
                }).catch((error) => {
                    console.error('Erro ao criar e enviar resposta:', error);
                });
            }).catch((error) => {
                console.error('Erro ao configurar descrição remota:', error);
            });
        });

        return () => {
            // Limpar o contexto e desconectar o socket quando o componente é desmontado
            context.clearRect(0, 0, canvas.width, canvas.height);
            socket.disconnect();
        };
    }, []);

    return <>
            <div>
                  {isLoading && 
                        (<>
                            {
                                loadingComponent ? 
                                (loadingComponent) 
                                :
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '30px',
                                        height: height ? height : '480px',
                                        width: width ? width : '640px',
                                        backgroundColor: 'black',
                                        color: 'white',
                                        fontWeight: 'bolder'
                                    }}>
                                       <span>
                                        Carregando...
                                       </span>
                                    </div>
                                </>
                            }
                            
                        </>)
                  }
                  <canvas id="canvas" style={{
                        display: isLoading ? 'none' : 'block',
                        height: height ? height : '480px',
                        width: width ? width : '640px'
                    }}></canvas>
            </div>
    </>  
}

export default CameraComponent;
