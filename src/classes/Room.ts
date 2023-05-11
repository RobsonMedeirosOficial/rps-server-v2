import { Socket } from 'socket.io';
import { io } from '..'
import Player from "./Player";
import RPS from "./RPS";
import { wsc } from './WSController';

export default class Room {
    roomID: string;
    playerList: Player[];
    maxPlayer: number;
    timer: number;
    timerMax: number;
    setInterval:any;
    rpsList:RPS[];
    roomUpdateInterval:any;
    preGameDraws:number;
    gameDraws:number;
    constructor(id: string = "") {
      this.roomID = id;
      this.playerList = [];
      this.maxPlayer = 2;
      this.timer = 0; // removi a tipagem 'any' e atribui um valor inicial
      this.timerMax = 5;
      this.preGameDraws=0;
      this.gameDraws=0;
      this.rpsList=[new RPS("Rock",0),new RPS("Paper",1),new RPS("Scissor",2)]
    }
  

    SelectionTimer(timerMax: number){
      // Contagem de tempo limite
      this.timer = timerMax * 1;
      this.setInterval = setInterval(() => {
        if(this.timer > 0){
          // Envia a contagem de tempo para o client -------------------
          console.log(`Timer: ${this.timer}`);
          this.timer--;
          io.in(this.roomID).emit("timerRoom", this.timer.toString());
          // -----------------------------------------------------------
          
          
          
          // Vamos verificar se ainda há dois players na
          // if(false){
            // console.log(`LENGHT: ${this.playerList.length}`);
            
          if(this.playerList.length===2){
            // O tempo chegou a zero
            if(this.timer <=0){
              // precisamos destruir o contador
              this.StopTimer()

              // vamos verificar quem não selecionou a peça e selecionar 
              // randomicamente
              // this.CheckSelectionAndRondom()
              if(this.playerList[0].rps===-1 || this.playerList[1].rps===-1){
                let listRandom = [0, 1, 2];
                let rps =0
                this.playerList.forEach(player=>{
                  if(player.rps===-1){
                    rps = Math.floor(Math.random() * listRandom.length);
                    player.rps=rps
                    console.log(`O player(${player.playerID}) selecionou o rps(${player.rps}) randomicamente.`);
                    
                    player.socket.emit("player_random_rps",""+player.rps)
                  }
                })
              }


              console.log(`\nQual o resultado do pre-game???`);
              
              // no caso empate por 3 vezes o randon resultará
              // num desempate
              if(this.preGameDraws>1){

                    let listRandom = [0, 1, 2];
                    let rps = Math.floor(Math.random() * listRandom.length);
                    this.playerList[0].rps=rps
                    console.log(`O player(${this.playerList[0].playerID}) selecionou o rps(${this.playerList[0].rps}) randomicamente.`);
                    console.log(`E...`);
                    listRandom = listRandom.filter(i=>i!=rps)
                    rps = Math.floor(Math.random() * listRandom.length);
                    this.playerList[1].rps=rps
                    console.log(`O player(${this.playerList[1].playerID}) selecionou o rps(${this.playerList[1].rps}) randomicamente.`);
                    
                    this.playerList[0].socket.emit("player_random_rps",""+this.playerList[0].rps)
                    this.playerList[1].socket.emit("player_random_rps",""+this.playerList[1].rps)
                    // setTimeout(()=>{

                    //   },2000)
                    
                    // vamos verificar o vencedor
                    // winner = this.GetPlayerIDWinner()
                  }
                  
                  let winner = this.GetPlayerIDWinner()
                  
                  // vamos verificar se houve empate
                if(winner==="draw"){
                  
                  console.log(`\n EMPATE!!`);
                  console.log(`\n Vamos tentar outra vez...`);





                  // houve empate, precisamos reiniciar o pre-game
                  this.preGameDraws++
                  setTimeout(()=>{
                    io.in(this.roomID).emit("preGameAgain","")
                    this.SelectionTimer(timerMax)
                    this.playerList.forEach(p=>{
                      p.rps=-1
                    })
                  },2000)
                }else{
                  // houve um vencedor.

                  // vamos resetar o preGameDraws
                  this.preGameDraws=0
                  this.CountTimeWaitToScramble(5)
                  // vamos para proxima etapa, embaralhar
                  setTimeout(()=>{
                    io.in(this.roomID).emit("scramble",winner)
                    io.in(this.roomID).emit("setTimer","5")
    
                  },5000)

                }


                // Envia o resultado para todos os players da room
                io.in(this.roomID).emit("preGameResult",this.GetPreGameDataResult(winner))

                
              }
          }else{
            // Não há 2 players na room, a partida deve ser encerrada!
          }
        }
      }, 1000);
    }


    CountTimeWaitToScramble(timerMax:number){
      this.timer = timerMax;;
      this.setInterval = setInterval(() => {
        if(this.timer > 0){
          console.log(`Timer: ${this.timer}`);
          this.timer--;
          io.in(this.roomID).emit("timerRoom", this.timer.toString());
          if(this.timer <= 0){
            this.StopTimer()
            if(this.CheckPlayersInRoom()){
              console.log(`\nVamos esperar para embaralhar...`);
              this.CountTimeToScramble(5)

              }
            else{
              console.log("Um player está fora, precisamos reiniciar a room");
              io.in(this.roomID).emit("removePlayer","")
            }
  
  
  
          }
        }
      }, 1000);
    }

    CountTimeToScramble(timerMax:number){
      this.timer = timerMax;;
      this.setInterval = setInterval(() => {
        if(this.timer > 0){
          console.log(`Timer: ${this.timer}`);
          this.timer--;
          io.in(this.roomID).emit("timerRoom", this.timer.toString());
          if(this.timer <= 0){
            this.StopTimer()
            if(this.CheckPlayersInRoom()){
              console.log(`\nAgora é hora da batalha...`);
              console.log(`\nQue vença o melhor!!!`);
  
                io.in(this.roomID).emit("startGame","")
                this.CountTimeToEndGame(5)
              }
            else{
              console.log("Um player está fora, precisamos reiniciar a room");
              io.in(this.roomID).emit("removePlayer","")
            }
  
  
  
          }
        }
      }, 1000);
    }




    GetPreGameDataResult(result:string=""){
      let playerList:any[]=[]
      this.playerList.forEach(player => {
        let isWinner=false

        if(result===player.playerID){
          isWinner=true
        }

        playerList.push({
          playerID:player.playerID,
          rps:player.rps,
          isWinner,
        })
      });

      let preGameData:any={
        result,
        playerList,
      }
      return preGameData
    }


    CheckSelectionAndRondom(){
      if(this.playerList.length>1){

        // if(this.playerList[0].rps===-1 && this.playerList[1].rps===-1){
        //   console.log(`Os players não selecionaram as peças`);
          
        //   let listRandom = [0, 1, 2];
        //   let rps = Math.floor(Math.random() * listRandom.length);
        //   this.playerList[0].rps=rps
        //   console.log(`O player(${this.playerList[0].playerID}) selecionou o rps(${this.playerList[0].rps}) randomicamente.`);
        //   console.log(`E...`);
        //   listRandom = listRandom.filter(i=>i!=rps)
        //   rps = Math.floor(Math.random() * listRandom.length);
        //   this.playerList[1].rps=rps
        //   console.log(`O player(${this.playerList[1].playerID}) selecionou o rps(${this.playerList[1].rps}) randomicamente.`);
          
        //   this.playerList[0].socket.emit("player_random_rps",""+this.playerList[0].rps)
        //   this.playerList[1].socket.emit("player_random_rps",""+this.playerList[1].rps)

        // }else{


        // }

        
      }
    }






















  //#endregion >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    Info(isLog:boolean){
      let info={
        roomID:this.roomID,
        playersAmount:this.playerList.length,
        playersMax: this.maxPlayer,
        timer: this.timer,
        timerMax: this.timerMax,
  
      }
      if(isLog){
      console.log(`\n===================================== ROOM INFO`);
      console.log(info);
      }
      return info
    }
  
    StartTimerCount(){
      // inicializa a contagem
      this.CountTimeToSelect()
    }

    StopTimer(){
      clearInterval(this.setInterval);
      this.setInterval=undefined
    }
  
    CountTimeToSelect(){
      this.timer = this.timerMax * 1;
      this.setInterval = setInterval(() => {
        if(this.timer > 0){
          console.log(`Timer: ${this.timer}`);
          this.timer--;
          io.in(this.roomID).emit("timerRoom", this.timer.toString());
  
          if(this.CheckPlayersInRoom()){
  
            if(this.playerList.length > 1){
              clearInterval(this.setInterval);
              this.setInterval=undefined
              console.log(`\nAgora é hora de embaralhar, o vencedor embaralha...`);
              let winner = this.GetPlayerIDWinner()
                io.in(this.roomID).emit("scramble",winner)
                this.CountTimeToScramble(5)
              }
            else{
              console.log("Um player está fora, precisamos reiniciar a room");
              io.in(this.roomID).emit("removePlayer","")
            }
  
  
          }
        }
      }, 1000);
    }
  
    CountTimeToEndGame(time:number){
      this.timer = time*1;
      
      this.setInterval = setInterval(() => {
        if(this.timer > 0){
          console.log(`Timer: ${this.timer}`);
          this.timer--;
          io.in(this.roomID).emit("timerRoom", this.timer.toString());
          if(this.timer <= 0){
            clearInterval(this.setInterval);
            this.setInterval=undefined
            console.log(`\A partida acabou!!`);  
          }
        }
      }, 1000);
    }

    CheckWinner(data:any){
  
      if(this.CheckPlayersInRoom()){
        let rpsList=[{rps:0,rpsAmount:0},{rps:1,rpsAmount:0},{rps:2,rpsAmount:0}]
        // Lista de rps com o rps e rpsAmount de cada peça
        rpsList[0].rpsAmount=data.countRock
        rpsList[1].rpsAmount=data.countPaper
        rpsList[2].rpsAmount=data.countScissor
    
        // Organiza a rpsList do maior para o menor
        rpsList = rpsList.sort((a,b)=>b.rpsAmount - a.rpsAmount)
        // Selecionamos o rps de maior valor e colocamos em rpsWinner
        let rpsWinner = rpsList[0]
    
        // Vamos distribuir os pontos de cada player de acordo com seu rps
        for (let pIndex = 0; pIndex < this.playerList.length; pIndex++) {
    
          if(this.playerList[pIndex].rps==0){
            this.playerList[pIndex].rpsAmount=data.countRock
          }
          if(this.playerList[pIndex].rps==1){
            this.playerList[pIndex].rpsAmount=data.countPaper
          }
          if(this.playerList[pIndex].rps==2){
            this.playerList[pIndex].rpsAmount=data.countScissor
          }
        }
    
        // Agora vamos organizar a playerList da room do maior para o menor em rpsAmount
        this.playerList = this.playerList.sort((a,b)=>b.rpsAmount - a.rpsAmount)
    
        // Vamos verificar se a partida está rodando e aplicar vitória por ponto
        if(this.timer>0){
          // Houve um vencedor por pontos maximo
          
          console.log(rpsList[0]);
          // REVIEW
          if(rpsList[0].rpsAmount>=60){
            if(this.playerList[0].rpsAmount != this.playerList[1].rpsAmount){
              // Houve um vencedor
              console.log(`\nVITÓRIA *************************************************************`);
              console.log(`O player(${this.playerList[0].playerID}) venceu | points: ${this.playerList[0].rpsAmount}`);
              console.log(`O player(${this.playerList[1].playerID}) perdeu | points: ${this.playerList[1].rpsAmount}`);
              this.SendEndGame()
      
            }else{
              // Houve empate 
              console.log(`\EMPATE *************************************************************`);
              console.log(`O player(${this.playerList[0].playerID}) empatou | points: ${this.playerList[0].rpsAmount}`);
              console.log(`O player(${this.playerList[1].playerID}) empatou | points: ${this.playerList[1].rpsAmount}`);
              this.SendEndGame()
            }
      
            if(this.playerList[0].rps!=rpsList[0].rps && this.playerList[1].rps!=rpsList[0].rps){
              // Não houve vencedor
              // Empate de zero 
              console.log(`\EMPATE ZERO A ZERO *************************************************************`);
              console.log(`O player(${this.playerList[0].playerID}) empatou | points: ${this.playerList[0].rpsAmount}`);
              console.log(`O player(${this.playerList[1].playerID}) empatou | points: ${this.playerList[1].rpsAmount}`);
              this.SendEndGame()
            }
            this.StopTimer()
          }
        }else{
          // Aqui vamos aplicar a vitória no final da partida
          this.SendEndGame()
          // this.StopTimer()
        }
      }else{
        console.log(`Um player saiu da partida, precisamos finaliza-la`);
        io.in(this.roomID).emit("removePlayer","")
        this.StopTimer()
      }
    }

    SendEndGame(isEndGame=false){
      let playerList:any[]=[]
      this.playerList.forEach(p => {
        playerList.push(
          {
            playerID:p.playerID,
            roomID:p.roomID,
            rps:p.rps,
            rpsAmount:p.rpsAmount
          }
        )
      });
      let d: any={
        playerList:playerList,
      }
  
      console.log(`\n<<<<<<<<<<<<<<<<<<<<<<<<<<< endGame`);
      console.log(d);
      io.in(this.roomID).emit("endGame",d)
      
    }






































    // SendGetWinner(){
  
  
    //   setTimeout(()=> {
    //     let winner = this.GetPlayerIDWinner()
    //     if(winner==="draw"){
    //       console.log(`Houve um empate, é preciso uma nova tentativa...`);
          
    //     }else{
    //       console.log(`O vencedor foi o player: ${winner} `);
          
    //     }
    //     io.in(this.roomID).emit("result",winner)
    //     this.CountTimeToSelect() 
    //   }, 3000);
      
    // }
  
    GetPlayerIDWinner(){
      if(this.playerList.length>1){
        let playerA = this.playerList[0]
        let playerB = this.playerList[1]
        console.log(`LENGHT: ${this.playerList.length}`);
        
        if(playerA && playerB){
          console.log(`playerA.rps: ${playerA.rps}`);
          console.log(`playerB.rps: ${playerB.rps}`);
  
          // Retorne o playerID de quem ganhou
          if(playerA.rps==0 && playerB.rps==1)return playerB.playerID
          if(playerA.rps==0 && playerB.rps==2)return playerA.playerID
          if(playerA.rps==1 && playerB.rps==0)return playerA.playerID
          if(playerA.rps==1 && playerB.rps==2)return playerB.playerID
          if(playerA.rps==2 && playerB.rps==0)return playerB.playerID
          if(playerA.rps==2 && playerB.rps==1)return playerA.playerID
          if(playerA.rps==playerB.rps)return "draw"
        }
      }
    }
  
    SendRPSToAll(socket:Socket,data:any=null){
      let player = wsc.getPlayerBySocket(socket)
      if(player){
        let room = wsc.getRoomByRoomID(player.roomID)
        if(room){
          if(data){
            console.log(data);
            player.rps=data.rps
          }
  
          let playerList:any[]=[]
          room.playerList.forEach(p => {
            playerList.push(
              {
                playerID:p.playerID,
                roomID:p.roomID,
                rps:p.rps,
                rpsAmount:p.rpsAmount
              }
            )
          });
          let d: any={
            playerList:playerList,
          }
  
          console.log(`\n<<<<<<<<<<<<<<<<<<<<<<<<<<< player_set_rps`);
          console.log(d);
  
          io.in(this.roomID).emit("player_set_rps",d)
        }
    
      }
    }
  

  
    
  
    RemovePlayer(socket:Socket) {
      const player: Player | undefined = wsc.getPlayerBySocket(socket);
  
      if (player) {
          console.log(`O player ${player.playerID} (${player.socket.id}) foi removido da room ${this.roomID}`);
        this.playerList=this.playerList.filter(p=>p.playerID!=player.playerID)
  
      }
      
      // Se a room ficou vazia, remove ela
      if (this.playerList.length <= 0) {
        wsc.RemoveRoom(this);
      }
      // Envia mensagem para os outros jogadores informando a saída deste jogador
      io.in(this.roomID).emit('removePlayer', player);
    }
  
    CheckPlayersInRoom(){
      let isInRoom = false
      if(this.playerList.length>1){
        isInRoom = true
      }

      return isInRoom
    }

    StartUpdate(timeToUpdate:number=500){
      console.log(`O update da room(${this.roomID}) foi iniciado para atualizações de ${timeToUpdate} milesegundos.`);
      
      this.roomUpdateInterval = setInterval(()=>{
        this.RoomUpdate()
      }, timeToUpdate);
    }

    StopUpdate(){
      console.log(`O update da room(${this.roomID}) foi finalizado.`);
      clearInterval(this.roomUpdateInterval)
      this.roomUpdateInterval=undefined
    }
    RoomUpdate(){
      // vamos checar se algum player está na room
    }
    //#endregion
  }