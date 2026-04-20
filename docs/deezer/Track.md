Track
INFO
ACTIONS
A track object

Examples
https://api.deezer.com/track/3135556

Fields
Name	Description	Type
id	The track's Deezer id	int
readable	true if the track is readable in the player for the current user	boolean
title	The track's fulltitle	string
title_short	The track's short title	string
title_version	The track version	string
unseen	The track unseen status	boolean
isrc	The track isrc	string
link	The url of the track on Deezer	url
share	The share link of the track on Deezer	url
duration	The track's duration in seconds	int
track_position	The position of the track in its album	int
disk_number	The track's album's disk number	int
rank	The track's Deezer rank	int
release_date	The track's release date	date
explicit_lyrics	Whether the track contains explicit lyrics	boolean
explicit_content_lyrics	The explicit content lyrics values (0:Not Explicit; 1:Explicit; 2:Unknown; 3:Edited; 6:No Advice Available)	int
explicit_content_cover	The explicit cover value (0:Not Explicit; 1:Explicit; 2:Unknown; 3:Edited; 6:No Advice Available)	int
preview	The url of track's preview file. This file contains the first 30 seconds of the track	url
bpm	Beats per minute	float
gain	Signal strength	float
available_countries	List of countries where the track is available	list
alternative	Return an alternative readable track if the current track is not readable	track
contributors	Return a list of contributors on the track	list
md5_image		string
track_token	The track token for media service	string
artist	artist object containing : id, name, link, share, picture, picture_small, picture_medium, picture_big, picture_xl, nb_album, nb_fan, radio, tracklist, role	object
album	album object containing : id, title, link, cover, cover_small, cover_medium, cover_big, cover_xl, release_date	object
