

     /**
         * Obtains parameters from the hash of the URL
         * @return Object
         */
function getHashParams() {
    var hashParams = {};
    var e, 
		r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

var oauthSource = document.getElementById('oauth-template').innerHTML,
    oauthTemplate = Handlebars.compile(oauthSource),
    oauthPlaceholder = document.getElementById('oauth');

var params = getHashParams();
var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;
	
	
if (error) {
    alert('There was an error during the authentication');
} else {
    if (access_token) {
		// render oauth info
		oauthPlaceholder.innerHTML = oauthTemplate({
			access_token: access_token,
			refresh_token: refresh_token
		});

		$.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                  'Authorization': 'Bearer ' + access_token
            },
            success: function(response) {

                $('#login').hide();
                $('#loggedin').show();
            }
        });
    } else {
        // render initial screen
        $('#login').show();
        $('#loggedin').hide();
    }

	document.getElementById('obtain-new-token').addEventListener('click', function refreshToken() {
        $.ajax({
			url: '/refresh_token',
            data: {
                'refresh_token': refresh_token
            }
        }).done(function(data) {
            access_token = data.access_token;
            oauthPlaceholder.innerHTML = oauthTemplate({
                access_token: access_token,
                refresh_token: refresh_token
            });
        });
    }, false);
}	

$(document).ready(function(){
	document.getElementById("getStarted").addEventListener("click", function(){
		var stuffContent = document.getElementById("mainContent");
		document.getElementById("getStartedDiv").innerHTML = "";
		if (access_token) {
			$.ajax({
				url: 'https://api.spotify.com/v1/browse/categories/party',
				headers: {
					'Authorization': 'Bearer ' + access_token
				},
				success: function(response) {
				var image = response.icons;
					stuffContent.innerHTML = "<p>" + response.name + "</p>"
							+ "<img src=\"" + image[0].url + "\"/>"
							+ "<button id=\"getSong\" > get a song! </button>";
						
					document.getElementById("getSong").addEventListener("click", function aSong(){
						$.ajax({
							url: '/refresh_token',
							data: {
								'refresh_token': refresh_token
							}
						}).done(function(data) {
							access_token = data.access_token;
							oauthPlaceholder.innerHTML = oauthTemplate({
								access_token: access_token,
								refresh_token: refresh_token
							});
						});
						$.ajax({
							url:'https://api.spotify.com/v1/browse/categories/party/playlists',
							headers: {
								'Authorization': 'Bearer ' + access_token
							},
							success: function(response){
								var lists = response.playlists.items;
								var listNr; 
										
								while(lists[listNr] == null){
									listNr = Math.floor(Math.random() * lists.length);
								}
									
								console.log(listNr);
									
								$.ajax({
									url:  lists[listNr].href ,
									headers: {
										'Authorization': 'Bearer ' + access_token
									},
									success: function(response){
										var tracks = response.tracks.items;
										var trackNr = Math.floor(Math.random() * tracks.length);
										
										while(tracks[trackNr] == null 
											|| tracks[trackNr].track.artists[0].name == null 
											|| tracks[trackNr].track.name == null
											|| tracks[trackNr].track.preview_url == null){
											trackNr = Math.floor(Math.random() * tracks.length);
										}
												
										var track = tracks[trackNr];
										
										stuffContent.innerHTML = "<h3> Song name: " + track.track.artists[0].name + " - " + track.track.name + "</h3>"
										+ "<audio controls><source src=\"" + track.track.preview_url + "\" type=\" audio/mpeg\"></audio>"
										+ "<button id=\"newSong\"> New song! </button>";
												
										document.getElementById("newSong").addEventListener("click", function(){
											aSong();
										});
												
									}
								});
							}
						});						
					});
				}
			});
		}
	});								
});