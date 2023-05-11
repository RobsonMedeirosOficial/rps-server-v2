import { Socket } from "socket.io";

import { wsc } from "./classes/WSController";
import Player from "./classes/Player";


const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
export const io = require('socket.io')(server);
const PORT = 3000;


io.on('connection', async(socket:any) => {
  console.log(`Socket ${socket.id} connected`);

  let player = wsc.players.find((p:any)=>p.socket===socket);
  if (!player){

      player = new Player(wsc.players.length+"", socket);
      player.isReady=false;
      // player.randonRPS()
      player.rps=-1
      wsc.players.push(player);
      console.log(`Um novo player na area: player(${player.playerID})(${player.socket.id})`);
      // let room: Room | undefined = CreateOrJoinRoom(socket)
      wsc.CreateOrJoinRoom(socket)


      let p = wsc.ReturnPlayerChangedSocketType(player)
      // console.log(p);
      socket.emit('newPlayer', p)
      // io.in(player.roomID).emit('newPlayer', p)
      wsc.PlayersOnline();
    }

  // socket.on('pos_and_rps', async(data:any) => {
  //     io.in(data.roomID).emit("pos_and_rps",data)
  // });

  socket.on('typeRPS', async(data:any) => {
      // console.log("================================================ rpsType");
      // console.log(data);

      io.in(data.roomID).emit("typeRPS",data)
  });
  socket.on('endGame', async(data:any) => {
      console.log("================================================ endGame");
      console.log(data);

      io.in(data.roomID).emit("endGame","")
  });
  socket.on('sendPoints', async(data:any) => {

      console.log("================================================ sendPoints");
      // console.log(data);

      io.in(data.roomID).emit("current_points",data)
      let room = wsc.getRoomByRoomID(data.roomID)
console.log(`ROOOOOOOOOMMMMMMMMMMMMMMM`);
console.log(`IS RUNNING: ${room?.isGameRunning}`);


        if(room && room?.isGameRunning){

          if( data.countRock>=10 || data.countPaper>=10 || data.countScissor>=10)
          {
            console.log(`A PARTIDA ACABOU!!!!!!!!!!!!!!!!!!!!!!!!!`);
            let rpsList=[{rps:0,rpsAmount:0},{rps:1,rpsAmount:0},{rps:2,rpsAmount:0}]
            // Lista de rps com o rps e rpsAmount de cada peça
            rpsList[0].rpsAmount=data.countRock
            rpsList[1].rpsAmount=data.countPaper
            rpsList[2].rpsAmount=data.countScissor
            rpsList = rpsList.sort((a,b)=>b.rpsAmount - a.rpsAmount)

            let playerWinner = false
            let playerID =""
            let amount =0
            room.playerList.forEach((p:any)=>{
              if(p && p.rps===rpsList[0].rps){
                playerWinner=p
                playerWinner = true
                playerID=p.playerID
                amount=p.rpsAmount
              }
            })
            console.log(">>>>>>>>>>>>>>>>>>>>>>  playerWinner");
            console.log(playerWinner);
            
            if(playerWinner){
              // Temos um vencedor
              console.log(`\nVITÓRIA *************************************************************`);
              console.log(`O player(${playerWinner}) venceu | points: ${amount}`);
              room.SendEndGame()
            }else{
              // Temos um empate

              room.gameDraws++
              io.in(room.roomID).emit("gameDraw",""+room.gameDraws)
              console.log(`Enviando gameDraw(${room.gameDraws}) para todos da room(${room.roomID})`);
              // Vamos resetar os rps dos players
              room.playerList.forEach(p => {
                p.rps=-1;
              });
              room.SelectionTimer(10)

            }


            // room.CheckWinner(data)
          }
          // room.CheckWinner(data)
          room.isGameRunning=false
      }



  });

  socket.on('setReady', async(data:any) => {
      // console.log("================================================ setReady");
      // console.log(data);

      // let player = wsc.getPlayerBySocket(socket)

      // if(player){

      //   player.isReady=data.isBool
      //   let room = wsc.getRoomByRoomID(player.roomID)

      //   if(room){

      //     let isAllReady = true;
      //     room.playerList.forEach((p:any)=>{
      //       if(!p.isReady)
      //       {
      //         isAllReady=false
      //         return
      //       }
      //     })

      //     if(isAllReady && room.playerList.length>1){
      //       console.log(`\nOs players responderam que estão prontos para jogar!`);
      //       console.log(`Tempo para selecionar uma peça começa agora: `);
      //       console.log(`\nAgora é hora de embaralhar, o vencedor embaralha...`);

      //       room.SendGetWinner()

      //     }

      //   }
      // }
      // io.in(data.roomID).emit("typeRPS",data)
  });

  socket.on('instantiate', async(data:any) => {
    // console.log("================================================ instantiate");
    // console.log(data);
    io.in(data.roomID).emit("instantiate",data)

});

  socket.on('position', async(data:any) => {

    io.in(data.roomID).emit("position",data)
  // console.log(data);
  });

  socket.on('player_set_rps', async(data:any) => {
    let player = wsc.getPlayerBySocket(socket)
    if(player){
      let room = wsc.getRoomByRoomID(player.roomID)
      room?.SendRPSToAll(socket,data)
    }
  });

  // Remove o jogador desconectado
  socket.on('disconnect', () => {

    console.log("\n================================================= disconnect");

    let player = wsc.players.find((p:any)=>p.socket===socket)

    if(player){
      let room = wsc.rooms.find((r:any)=>r.roomID===player?.roomID)

      if(room){
        console.log(`O player(${player.playerID}) foi removido da room(${room.roomID})`);
        room.playerList=room.playerList.filter((p:any)=>p.socket!==socket)

        io.in(room.roomID).emit("removePlayer")

        if(room.playerList.length<=0){
          console.log(`A room(${room.roomID}) ficou vazia, por tanto será removida do servidor.`);
           clearInterval(room.setInterval)
           room.setInterval=null
           wsc.rooms = wsc.rooms.filter((r:any)=>r.roomID!=room?.roomID)
        }
        else{
          console.log(`A room(${room.roomID}) ficou com ${room.playerList.length} jogador(es).`);
        }
      }
      console.log(`O player(${player.playerID}) foi removido do servidor.`);
      wsc.players=wsc.players.filter((p:any)=>p.socket!=socket)
    }
    wsc.PlayersOnline();
  });


});



server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


app.get('/health', (req:any, res:any) => {
  res.json({'health': 'ok'});
});
app.get('/rooms', (req:any, res:any) => {
  let data={
    description:"Todas as rooms em execução",
    rooms:wsc.ReturnRooms(),
  }
  res.json(data);
});

app.get('/players', (req:any, res:any) => {


  const players = {
      description: 'Todos os players conectados.',
      playerList:wsc.ReturnPlayers(),
  }

  const json = JSON.stringify(players, null, 2)

  res.header('Content-Type', 'application/json')
  res.send(json)
})





