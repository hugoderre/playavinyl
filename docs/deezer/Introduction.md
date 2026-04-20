Introduction
Unlimited Access, without stress, without identification. Deezer Simple API provides a nice set of services to build up web applications allowing the discovery of Deezer's music catalogue.

Requests
You may use ordinary HTTP GET messages. The base URL for each API method looks like the following

https://api.deezer.com/version/service/id/method/?parameters

Query quota
The number of requests per second is limited to 50 requests / 5 seconds.

Requests format examples
https://api.deezer.com/user/2529
https://api.deezer.com/user/2529/playlists
https://api.deezer.com/album/302127

Response format
In order to search the specified artist name 'eminem', and get xml back, you can do :

GET /search/artist/?q=eminem&index=0&limit=2&output=xml

The available formats are those following :
Description	Accept Header	Extension
JSON	application/json	.json
JSONP	application/json	.json
XML	application/xml, text/xml	.xml
PHP	application/xml, application/json	.php

Encoding
All requests and responses must be in UTF-8.

More documentation available on :
http://tools.ietf.org/html/rfc2279