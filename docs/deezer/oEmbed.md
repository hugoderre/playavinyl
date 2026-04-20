oEmbed

oEmbed is a format for allowing an embedded representation of a URL on third party sites.
For more informations, read the oEmbed documentation.

Endpoint
https://api.deezer.com/oembed?url={encoded_url}

Example
https://api.deezer.com/oembed?url=https://www.deezer.com/album/302127&maxwidth=700&maxheight=300&tracklist=true&format=json




{
  "version": "1.0",
  "type": "rich",
  "cache_age": 86400,
  "provider_name": "Deezer",
  "provider_url": "https://www.deezer.com",
  "entity": "album",
  "id": 302127,
  "url": "https://www.deezer.com/en/album/302127",
  "author_name": "Daft Punk",
  "title": "Discovery",
  "thumbnail_url": "https://cdn-images.dzcdn.net/images/cover/5718f7c81c27e0b2417e2a4c45224f8a/1000x1000.jpg",
  "thumbnail_width": 1000,
  "thumbnail_height": 1000,
  "width": 700,
  "height": 300,
  "html": "<iframe id=\"deezer-widget\" src=\"https://widget.deezer.com/widget/dark/album/302127?app_id=457142&autoplay=false&radius=true&tracklist=true\" width=\"700\" height=\"300\" allowtransparency=\"true\" allowfullscreen=\"true\" allow=\"encrypted-media\"></iframe>"
}

Compatible URLs
https://www.deezer.com/album/{id}
https://www.deezer.com/episode/{id}
https://www.deezer.com/playlist/{id}
https://www.deezer.com/show/{id}
https://www.deezer.com/track/{id}
and

https://deezer.page.link/{identifier}
Mandatory params
Name	Description	Type
url	The Deezer URL to parse	string
Optional params
Name	Description	Default	Type
autoplay	Play the music on load.	false	boolean
format	The response format. Should be either "json" or "xml".	'json'	string
maxwidth	The maximum width of the embedded resource.	420	int
maxheight	The maximum height of the embedded resource.	420	int
radius	Add a radius visual effect.	true	boolean
tracklist	Display the tracklist.	false	boolean
Fields
Name	Description	Type
version	The oEmbed version number.	string
type	The oEmbed resource type.	string
cache_age	The recommended number of seconds to cache the response.	int
provider_name	The name of the resource provider.	string
provider_url	The URL of the resource provider.	string
entity	The Deezer resource type.	string
id	The Deezer ID of the resource.	int
url	The URL of the resource.	string
author_name	The name of the author/owner of the resource.	string
title	A text title, describing the resource.	string
thumbnail_url	A URL to a thumbnail image representing the resource.	string
thumbnail_width	The width of the thumbnail.	int
thumbnail_height	The height of the thumbnail.	int
width	The width in pixels required to display the HTML.	int
height	The height in pixels required to display the HTML.	int
html	The HTML required to display the resource.	string