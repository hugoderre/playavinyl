Search
INFO
SEARCH METHODS
Search tracks

Examples
https://api.deezer.com/search?q=eminem

Optionnal Parameters (for all methods)
Name	Description
strict	Disable the fuzzy mode (?strict=on)
order	Possible values : RANKING, TRACK_ASC, TRACK_DESC, ARTIST_ASC, ARTIST_DESC, ALBUM_ASC, ALBUM_DESC, RATING_ASC, RATING_DESC, DURATION_ASC, DURATION_DESC
Fields
Name	Description	Type
id	The track's Deezer id	int
readable	true if the track is readable in the player for the current user	boolean
title	The track's fulltitle	string
title_short	The track's short title	string
title_version	The track version	string
isrc	The track isrc	string
link	The url of the track on Deezer	url
duration	The track's duration in seconds	int
rank	The track's Deezer rank	int
explicit_lyrics	Whether the track contains explicit lyrics	boolean
preview	The url of track's preview file. This file contains the first 30 seconds of the track	url
artist	artist object containing : id, name, link, picture, picture_small, picture_medium, picture_big, picture_xl	object
album	album object containing : id, title, cover, cover_small, cover_medium, cover_big, cover_xl	object
Advanced search

Deezer provides a hidden feature that could help you to find artists, albums or a tracks. This feature is called Advanced Search. The only thing you have to do is to specify the need that you expect.

Here is the list of what you can specify:

Name	Description	Type	Example
artist	The artist name	string	https://api.deezer.com/search?q=artist:"aloe blacc"
album	The album's title	string	https://api.deezer.com/search?q=album:"good things"
track	The track's title	string	https://api.deezer.com/search?q=track:"i need a dollar"
label	The label name	string	https://api.deezer.com/search?q=label:"because music"
dur_min	The track's minimum duration in seconds	int	https://api.deezer.com/search?q=dur_min:300
dur_max	The track's maximum duration in seconds	int	https://api.deezer.com/search?q=dur_max:500
bpm_min	The track's minimum bpm	int	https://api.deezer.com/search?q=bpm_min:120
bpm_max	The track's maximum bpm	int	https://api.deezer.com/search?q=bpm_max:200
You can also mixed your search, by adding a space between each field, to be more specific.

Examples
https://api.deezer.com/search?q=artist:"aloe blacc" track:"i need a dollar"

https://api.deezer.com/search?q=bpm_min:120 dur_min:300