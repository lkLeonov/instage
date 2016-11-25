function _onDataLoaded(data) {

	if (data && data.media && data.media.nodes) {
		var newCollage = document.createElement("div");
		newCollage.className = 'collage';

		data.media.nodes.forEach(function(node){
			var div = document.createElement("div");
			var img = document.createElement("img");
			img.src = node.display_src;
			div.appendChild(img);
			newCollage.appendChild(div);
		});

		document.getElementById('main').appendChild(newCollage);
		
		var settings = {
			contW: 1280,
			contH: 1024
		};

		$('#main .collage').eq(0).clg(settings);

	}
	else {
		document.body.innerHTML = 'No available images'
	}
}


