import './App.css';
import React, { useEffect } from 'react';
import CameraComponent from './components/CameraComponent';

function App() {
  const [peerDataChannel, setPeerDataChannel] = React.useState(null)
 
  const changeStream = (streamId) => { 
    const mensagem = {
      type: "streamChange",
      streamId: streamId
    }
    peerDataChannel.send(JSON.stringify(mensagem))
  }
  return (
    <div className="App">
     
        <CameraComponent
          height={480}
           setDataChannel={setPeerDataChannel}
          width={640}
          buttons={[<><button>1</button></>, <><button>2</button></>]}
          /*loadingComponent={
          <>
            <div>
              INSIRA AQUI SEU COMPONENTE DE LOADING CUSTOMIZADO
            </div>
          </>}*/
        ></CameraComponent>
        <>
            {peerDataChannel && (
              <>
                <button type='button' onClick={() => changeStream("1")}>1</button>
                <button type='button' onClick={() => changeStream("2")}>2</button>
              </>
            )}
        </>
     
    </div>
  );
}

export default App;
