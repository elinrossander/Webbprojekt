

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
	
var content = document.getElementById("getStartedDiv");
	content.style.display = "none";							//Gömmer sökfältet vid inloggning
	
if (error) {
    alert('There was an error during the authentication');
} else {
    if (access_token) {
		content.style.display = "block";
		document.getElementById("mainContent").style.display = "block";		//Visar sökfältet igen
		// render oauth info
		oauthPlaceholder.innerHTML = oauthTemplate({
			access_token: access_token,
			refresh_token: refresh_token
		});

		
		/**
		*
		*	Hämtar info om inloggade användaren.
		*	Vi kan använda detta till nån liten "användarinfo"-flik, kanske? 
		*
		*/
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
	
	var filter = document.getElementById("filterSearch");
	var dataList = document.getElementById("filter");
	
	/*
	*	hämtar kategorier från spotify och lägger till dem som sökalternativ
	*/
	if (access_token) {
			$.ajax({
				url: 'https://api.spotify.com/v1/browse/categories',
				headers: {
					'Authorization': 'Bearer ' + access_token
				},
				success: function(response) {
					var items = response.categories.items;
					for(i=0;i<items.length;i++){
						dataList.innerHTML += "\n<option value=\"" + items[i].id + "\">"
					}
				}
			});
		}	
		
		
	/*
	*Körs när man söker/trycker på "Go!"-knappen
	*/
	document.getElementById("getStarted").addEventListener("click", function aSong(){
		var stuffContent = document.getElementById("mainContent");
		
		
		if (access_token) {
			$.ajax({
				url: 'https://api.spotify.com/v1/browse/categories/' + filter.value,	// hämtar den valda kategorin
				headers: {
					'Authorization': 'Bearer ' + access_token
				},
				success: function(response) {
				var image = response.icons;
					stuffContent.innerHTML = "<p>" + response.name + "</p>"
							+ "<img src=\"" + image[0].url + "\"/>";
					
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
							url:'https://api.spotify.com/v1/browse/categories/' + filter.value + '/playlists',		//hämtar kategorins alla playlists
							headers: {
								'Authorization': 'Bearer ' + access_token
							},
							success: function(response){
								var lists = response.playlists.items;
								var listNr; 
										
								while(lists[listNr] == null){							//slumpar fram en playlist. while-loopen körs tills den hittar en lista som inte är 'null'
									listNr = Math.floor(Math.random() * lists.length);
								}
									
								$.ajax({
									url:  lists[listNr].href ,							//hämtar vald playlist
									headers: {
										'Authorization': 'Bearer ' + access_token
									},
									success: function(response){
										var tracks = response.tracks.items;
										var trackNr;	
										
										while(tracks[trackNr] == null 							//slumpar fram en låt från vald playlist. while-loopen körs tills den hittar en låt vars värden inte är 'null'
											|| tracks[trackNr].track.artists[0].name == null 
											|| tracks[trackNr].track.name == null
											|| tracks[trackNr].track.preview_url == null){
											trackNr = Math.floor(Math.random() * tracks.length);
										}
												
										var track = tracks[trackNr];
										
										/*
										*visar låtinfo, audio-spelare samt en knapp för att hitta ny låt
										*/
										stuffContent.innerHTML = "<h3> Song name: " + track.track.artists[0].name + " - " + track.track.name + "</h3>"
										+ "<audio controls><source src=\"" + track.track.preview_url + "\" type=\" audio/mpeg\"></audio>"
										+ "\n<div>"
										+ "\n<button id=\"newSong\"> New song! </button>"
										+ "</div>";
										
										/*
										*Listener som startar om sök-funktionen på nytt ifall man trycker på "ny låt"
										*/
										document.getElementById("newSong").addEventListener("click", function(){
											aSong();
										});
												
									}
								});
							}
						});											
					
				}
			});
		}
	});								
});