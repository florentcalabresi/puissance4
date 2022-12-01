var socket = io();

let ready = false;

var initDom = async() => {
    $('#quitGame').click(function( event ) {
        document.location.href = "/"
    });


    var clipboard = new ClipboardJS('#copyCode');
    clipboard.on('success', async function(e) {
        await Toast.fire({
            icon: "success",
            title: "Code copié avec succès !"
        })
        e.clearSelection();
    });
    
    $('#readyGame').click(function(event) {  
        ready = !ready;
        socket.emit('game_member_ready', {rid: roomID, value: ready, uid: sessionStorage.getItem('uidSession')})
    })

    $('#toggleCode').click(function(event) {
        var spanCodeStr = $('span#codeStreamer');
        if(spanCodeStr.hasClass('chide'))
            spanCodeStr.html(codeStreamer)
        else
            spanCodeStr.html('*******')
        spanCodeStr.toggleClass("chide")
    })
}

initDom();

var updateMemberList = async(members, cmr) => {
    $('#membersList').empty();
    ((cmr == members.length) ? $('.ui.card.loadingPlayer').hide() : $('.ui.card.loadingPlayer').show())
    members.forEach((member) => {
        $('#membersList').append(
            '<div class="flex item">'+
                '<img class="ui avatar image" src="/img/avatar.png">'+
                '<div class="content">'+
                    '<a class="header">'+member.username+'</a>'+
                    '<div class="description">'+member.role+' - '+((member.ready) ? "Prêt" : "Non prêt")+'</div>'+
                '</div>'+
            '</div>')
    })
}

socket.on('game_member_list', (data) => {
    updateMemberList(data.members, data.cmr)
})

socket.on('game_launching', (ldata) => {
    axios.get('/game/plateau').then((data) => {
        console.log(ldata)
        $('#gamePlateau').html(data.data)
        var element = document.querySelector('#gamePlateauTable');
        
        let table = document.createElement('table');
        for (let i = ldata.rows - 1; i >= 0; i--) {
            let tr = table.appendChild(document.createElement('tr'));
            for (let j = 0; j < ldata.cols; j++) {
                let td = tr.appendChild(document.createElement('td'));
                let colour = ldata.board[i][j];
                if (colour)
                    td.className = 'player' + colour;
                td.dataset.column = j;
            }
        }
        element.appendChild(table)
        element.addEventListener('click', (event) => {
            socket.emit('game_plateau_click', event.target.dataset.column)
        });

        let member;
        for(const mb of ldata.members){
            if(mb.sid === socket.id) {
                member = mb;
                break;
            }
        }
        
        if(ldata.pturn.sid === socket.id){
            $('.ui.message.spturn').removeClass('hide')
        }else{
            $('.ui.message.wpturn').removeClass('hide')
        }

        $('#chatInput').on("keydown", function(e) {
            if($(this).val()){
                if(e.keyCode == 13) {
                    socket.emit('game_chat_send', {message: $(this).val(), rid: roomID, uid: sessionStorage.getItem('uidSession')})
                    $(this).val(" ");
                }
            }
        });
    }).catch((err) => {
        console.log(err)
    })

    socket.on('game_returnlist', (ldata) => {
        axios.get('/game?code='+codeStreamer).then((data) => {
            $('#gamePlateau').html(data.data)
            updateMemberList(ldata.members)
            initDom();
        })
    })

    socket.on('game_finish', (ldata) => {
        
        if(ldata.winner == null)
            document.location.href = "/";
        else {
            console.log(ldata.winner.sid, " is a winner")
            if(ldata.winner.sid == socket.id){
                Swal.fire({
                    title: "Bravo!",
                    text: "Tu as gagné ! Tu es fort !",
                    icon: "success",
                    closeOnConfirm: false
                }).then(function() {
                    axios.get('/game/?code='+codeStreamer).then((data) => {
                        $('#gamePlateau').html(data.data)
                        updateMemberList(ldata.members)
                        initDom();
                    })
                }); 
            }else{
                Swal.fire({
                    title: "Oh non!",
                    text: "Vous avez perdus :( Entrainez-vous!",
                    icon: "error",
                    closeOnConfirm: false
                }).then(function() {
                    axios.get('/game/?code='+codeStreamer).then((data) => {
                        $('#gamePlateau').html(data.data)
                        updateMemberList(ldata.members)
                        initDom();
                    })
                });
            }
        }
    })
})

socket.on('game_update_plateau',  (ldata) => {
    

    if(ldata.pturn.sid === socket.id){
        $('.ui.message.spturn').removeClass('hide')
        $('.ui.message.wpturn').addClass('hide')
    }else{
        $('.ui.message.wpturn').removeClass('hide')
        $('.ui.message.spturn').addClass('hide')
    }

    var element = document.querySelector('#gamePlateauTable');
    let table = document.createElement('table');
    for (let i = ldata.rows - 1; i >= 0; i--) {
        let tr = table.appendChild(document.createElement('tr'));
        for (let j = 0; j < ldata.cols; j++) {
            let td = tr.appendChild(document.createElement('td'));
            let colour = ldata.board[i][j];
            if (colour)
                td.className = 'player' + colour;
            td.dataset.column = j;
        }
    }
    element.innerHTML = "";
    element.appendChild(table)
    
})

socket.emit('game_join', {rid: roomID, username: username, uid: sessionStorage.getItem('uidSession')})

socket.on('game_chat_receive',  (ldata) => {
    $('.chat .content #chatList').append(
        '<div class="flex item">'+
            '<img class="ui avatar image" src="/img/avatar.png">'+
            '<div class="content">'+
                '<a class="header">'+ldata.author.username+'</a>'+
                '<div class="description">'+ldata.message+'</div>'+
            '</div>'+
        '</div>')

        
    $('.chat .content #chatList')[0].scrollTo(0, document.body.scrollHeight);
})