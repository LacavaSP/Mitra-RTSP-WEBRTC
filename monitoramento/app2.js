const NodeWebcam = require("node-webcam");

// Configurações para captura de vídeo
const webcamConfig = {
  width: 640,
  height: 480,
  quality: 100,
  device: 'rtsp://admin:JPJQMT@192.168.0.26/1',
  callbackReturn: "buffer",
  verbose: false
};

// Cria uma instância do NodeWebcam
const Webcam = NodeWebcam.create(webcamConfig);

// Função para iniciar a captura do vídeo
function startVideoCapture() {
  // Captura um frame de vídeo
  Webcam.capture("", (err, data) => {
    if (!err) {
      // Converte o frame capturado para base64
      const base64Frame = Buffer.from(data).toString('base64');

      // Exibe o base64 do frame capturado
      console.log(base64Frame);
    } else {
      console.error("Erro ao capturar vídeo:", err);
    }

    // Chama a função recursivamente para capturar o próximo frame
    setTimeout(startVideoCapture, 1000);
  });
}

// Inicia a captura do vídeo
startVideoCapture();
