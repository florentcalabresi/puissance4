sessionStorage.setItem('uidSession', sessionID);

$('.ui.button.authDiscord').on('click', function(){
    document.location.href = "/auth/start";
})