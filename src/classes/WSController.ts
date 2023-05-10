
import { Socket } from "socket.io"
import { io } from '..'

import Player from "./Player";
import Room from "./Room";

export class WSController{
players: Player[] = [];
countPlayer:number =0
countRoom:number =0
rooms: Room[] = [];

constructor(){}

PlayersOnline(){
  io.emit("playersOnline",this.players.length.toString())
  return this.players.length
}

ReturnRooms(){
  let roomList: any[] = []

  this.rooms.forEach(rm => {
    roomList.push({
      roomID: rm.roomID,
      playersAmount: rm.playerList.length,
    })
  });

  return roomList;
}

ReturnPlayers(){

  let playerList:any = []
  this.players.forEach((p) => {
      if (p) {
          playerList.push({
            playerID : p.playerID,
            roomID : p.roomID,
            socket : p.socket?.id,
            rps : p.rps, // Nave prefab
            position : p.position,
            rotation : p.rotation,

          })
      }
  })



  return playerList

}


// function RemovePlayer(socket:Socket){
//   let player: Player | undefined = getPlayerBySocket(socket);
//   if(player){
//       this.players=this.players.filter((p:any) => p.playerID!==player?.playerID)
//     }
// }

RemoveRoom(room:Room){
  if(room){
      const index = this.rooms.indexOf(room);
      if (index !== -1) {
        this.rooms.splice(index, 1);
        console.log(`A Room(${room.roomID}) foi removida de rooms.`);
      }
    }
}

LOG(roomName:string){

// obter o objeto de sockets conectados à room
const socketsInRoom = io.sockets.adapter.rooms[roomName];

// verificar se a room existe e tem sockets conectados
if (socketsInRoom && socketsInRoom.sockets) {
  const numSocketsInRoom = Object.keys(socketsInRoom.sockets).length;
  console.log(`A room '${roomName}' tem ${numSocketsInRoom} sockets conectados.`);
} else {
  console.log(`A room '${roomName}' não existe ou não tem sockets conectados.`);
}

}

getPlayerBySocket(socket:Socket) {
  // Verifica se o jogador já está registrado e cria um novo jogador se necessário
  return this.players.find(p => p.socket.id === socket.id);
}

getRoomByRoomID(roomID:string) {
  // Verifica se o jogador já está registrado e cria um novo jogador se necessário
  return this.rooms.find(r => r.roomID === roomID);
}

ReturnPlayerChangedSocketType(player:Player){
  // Aqui estamos usando este processo para mudar o tipo da propriedade socket na cópia Player
  let pCopy: Partial<Player> = { ...player };
  delete pCopy.socket;
  let p = { ...pCopy, socket: player.socket.id };
  return p
}


CreateOrJoinRoom(socket:Socket){
    //#######################################################################
    //#1) O primeiro jogador a se conectar cria a room.
    
    //#2) O segundo jogador a se conectar procura uma room com espaço e entra
    // senão ele cria uma room.

    //#3) No momento que aroom é preenchida com dois jogadores o tempo de selecionar
    // a peça é iniciado.
    //#######################################################################





  let player: Player | undefined = this.getPlayerBySocket(socket)
  if(player){

    let room = this.rooms.find(r=>r.playerList.length < r.maxPlayer)


    if(room){
      console.log(`O player(${player.playerID}) encontrou a room(${room.roomID}) e entrou.`);
      
      // Junte este player a room
      player.roomID=room.roomID
      player.socket.join(room.roomID)
      room.playerList.push(player)

      // se a room estiver cheia finalmente, fale para o primeiro player que pode instanciar
      if(room.playerList.length>=room.maxPlayer){
        room.playerList[0].socket.emit("can_instantiate")
        io.in(room.roomID).emit("setTimer","10")
        //-------------------------
        setTimeout(() => {
          room?.SelectionTimer(10);
        }, 2)
        
        
      }

      room.SendRPSToAll(socket)
    }else{
      // Crie uma nova room
      room = new Room(`${this.countRoom++}`)
      if(room){
        this.rooms.push(room)
        room.maxPlayer=2
        room.timerMax=5
        console.log(`O player(${player.playerID}) não encontrou uma room disponível\n então criou a room(${room.roomID}) e entrou.`);
        player.roomID=room.roomID
        player.socket.join(room.roomID)
        room.playerList.push(player)
        }
    }

    if(room){

      
      room.Info(true)
    }

  }
}




}



export const wsc = new WSController();


/*

1) O primeiro jogador a se conectar cria a room.


2) O segundo jogador a se conectar procura uma room com espaço e entra
senão ele cria uma room.


3) No momento que aroom é preenchida com dois jogadores o tempo de selecionar
a peça é iniciado.


4) após o tempo será verificado o vencedor.


5) no caso de empate reinicie o tempo e verifique o vencedor.


6) no caso de empate seguidos por três vezes cada um jogador terá sua peça
aleatoriamente selecionado e com isso não haverá um empate.


7) no caso de um vencedor iniciará o tempo para embaralhar.


8) após o tempo de embaralhar a partida começa de fato.


9) no caso de empate os jogadores voltarão ao passo 3.
no caso de 3 empates seguidos a partida acaba e ambos os jogadores pontuam
serão creditados.

10) no caso de um vencedor a partida acaba e o vencedor é creditado.
a room é destruida e os jogadores são desconectados.



*/