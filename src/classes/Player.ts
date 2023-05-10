import { Socket } from "socket.io";

export default class Player {
  roomID: string;
  playerID: string;
  socket: Socket;
  rps: number;
  rpsAmount: number;
  position: { x: number; y: number; z: number; };
  rotation: { x: number; y: number; z: number; };
  // GAME SETTINGS -----------------------------
  isReady: boolean;
  points: number;

  // -------------------------------------------

  constructor(playerID:string, socket:Socket) {
    this.playerID = playerID;
    this.roomID = "";
    this.socket = socket;
    this.rps = 0;
    this.rpsAmount=0;
    this.isReady=false;
    this.points=0;
  
    this.position = {x:0,y:0,z:0};
    this.rotation = {x:0,y:0,z:0};
  }
  getType(){
    return this.rps;
  }

  randonRPS(){
    this.rps=Math.floor(Math.random() * 2);
  }

}