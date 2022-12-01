const { uuid } = require('uuidv4');
const { Server } = require("socket.io");
class Game {

    constructor(opts){
        this.code = opts.code;
        this.roomID = opts.roomID;
        this.io = new Server(opts.server);
        this.members = [];
        this.countMemberRequired = 2;
        this.roomName = 'game_room_'+this.roomID;
        console.log('New Room Game #'+this.roomID+' created')
        this.io.on('connection', socket => {
            console.log('Owner member join room game #'+this.roomID)
            socket.on('game_join', data => {
                if(data.rid == this.roomID)
                    socket.join(this.roomName)
                this.addMember({uid: data.uid, username: data.username, sid: socket.id, ready: false, role: ((this.members.length  == 0) ? "owner" : "player")})
                this.io.to(this.roomName).emit('game_member_list', {members: this.members})
                //if(this.countMemberRequired == this.members.length)
                    //this.io.to(this.roomName).emit('game_member_ready', {bool: true})
            })
            socket.on('game_member_ready', async data => {
                if(data.rid == this.roomID){
                    await this.editMember(data.uid, "ready", data.value).then(async () => {
                        this.io.to(this.roomName).emit('game_member_list', {members: this.members, cmr: this.countMemberRequired})
                        let allMembersReady = true;
                        for await (const mb of this.members){
                            if(!mb.ready){
                                allMembersReady = false;
                                break;
                            }
                        }
                        if(allMembersReady && this.countMemberRequired == this.members.length){
                            this.initPlateau();
                            this.io.to(this.roomName).emit('game_launching', {members: this.members, pturn: this.members[this.pturn], rows: this.rows, cols: this.cols, board: this.board})
                        }
                    })
                }
            })

            socket.on('game_plateau_click', async(data) => {
                var id = 0;
                for await(const mb of this.members){
                    if(mb.sid == socket.id)
                        break;
                    id++;
                }
                this.handle_click(id, data)
            })

            socket.on('game_chat_send', async (data) => {
                if(data.rid == this.roomID){
                    var member = await this.getMember(data.uid);
                    this.io.to(this.roomName).emit('game_chat_receive', {message: data.message, author: {username: member.username}})
                }
            })

            socket.on("disconnect", (reason) => {
                this.memberLeave(socket)
            });
        });
    }

    async addMember(data){
        this.members.push(data)
    }

    async getMember(uid){
        let member;
        for await (const mb of this.members){
            if(mb.uid === uid) {
                member = mb;
                break;
            }
        }
        return member;
    }

    async getSMember(sid){
        let member;
        for await (const mb of this.members){
            if(mb.sid === sid) {
                member = mb;
                break;
            }
        }
        return member;
    }

    async resetReadyMember(){
        return new Promise(async (resolve, reject) => {
            for await(const mb of this.members){
                mb.ready = false;
            }
            resolve();
        })
       
    }

    async editMember(uid, key, value){
        return new Promise(async (resolve, reject) => {
            var member = await this.getMember(uid)
            switch(key){
                case "ready":
                    member.ready = value;
                    break;
            }
            resolve();
        })
       
    }

    async memberLeave(socket){
        const instance = this;
        const member = await this.getMemberList(socket.id)
        this.members = this.members.filter(function(item) {
            return item.uid !== member.uid;
        });
        if(this.members.length == 0){
            console.log("Game #"+this.roomID+" is finished. Members list empty!")
            global.partyList = global.partyList.filter(function(item) {
                return item.code !== instance.code;
            });
        }else {
            this.io.to(this.roomName).emit('game_member_list', {members: this.members, cmr: this.countMemberRequired})
            if(this.countMemberRequired !== this.members.length){
                this.io.to(this.roomName).emit('game_returnlist', {members: this.members, cmr: this.countMemberRequired})
            }
        }
    }

    async getMemberList(sid){
        let member;
        for await (const mb of this.members){
            if(mb.sid === sid){
                member = mb;
                break;
            }
        }
        return member;
    }

    initPlateau(rows=6, cols=7) {
        this.rows = rows;
        this.cols = cols;
        this.board = Array(this.rows);
        for (let i = 0; i < this.rows; i++) {
        this.board[i] = Array(this.cols).fill(0);
        }
        this.pturn = 0;
        this.turn = 1;
        this.moves = 0;
        this.winner = null;
    }

    set(row, column, player) {
        this.board[row][column] = player;
        this.moves++;
    }

    play(column) {
        let row;
        for (let i = 0; i < this.rows; i++) {
            if (this.board[i][column] == 0) {
                row = i;
                break;
            }
        }
        if (row === undefined) {
            return null;
        } else {
            this.set(row, column, this.turn);
            return row;
        }
    }
    
    handle_click(id, etdc) {
        if (this.winner !== null)
            return;
        
        if ((this.turn)-1 !== id)
            return;

        let column = etdc;
        if (column !== undefined) {
            column = parseInt(column);
            let row = this.play(parseInt(column));
            
            if (row !== null) {
                if (this.win(row, column, this.turn)) {
                    this.winner = this.members[(this.turn)-1];
                } else if (this.moves >= this.rows * this.columns) {
                    this.winner = 0;
                }
                this.turn = 3 - this.turn;
                switch (this.winner) {
                    case null: 
                        this.io.to(this.roomName).emit('game_update_plateau', {rows: this.rows, cols: this.cols, board: this.board, pturn: this.members[(this.turn)-1]})
                        break;
                    case 0: 
                        this.resetReadyMember().then(() => {
                            this.io.to(this.roomName).emit('game_finish', {winner: null, members: this.members})
                        })
                        break;
                    default:
                        this.resetReadyMember().then(() => {
                            this.io.to(this.roomName).emit('game_finish', {winner: this.winner, members: this.members})
                        })
                        break;
                }
            }
        }
    }

    win(row, column, player) {
        let count = 0;
        for (let j = 0; j < this.cols; j++) {
            count = (this.board[row][j] == player) ? count+1 : 0;
            if (count >= 4) return true;
        }
        
        count = 0;
        for (let i = 0; i < this.rows; i++) {
            count = (this.board[i][column] == player) ? count+1 : 0;
            if (count >= 4) return true;
        }

        count = 0;
        let shift = row - column;
        for (let i = Math.max(shift, 0); i < Math.min(this.rows, this.cols + shift); i++) {
            count = (this.board[i][i - shift] == player) ? count+1 : 0;
            if (count >= 4) return true;
        }

        count = 0;
        shift = row + column;
        for (let i = Math.max(shift - this.cols + 1, 0); i < Math.min(this.rows, shift + 1); i++) {
            count = (this.board[i][shift - i] == player) ? count+1 : 0;
            if (count >= 4) return true;
        }
        
        return false;
        }

    reset() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = 0;
            }
        }
        this.move = 0;
        this.winner = null;
    }




}

module.exports = Game;