Global parameters
Deezer API provides you some global parameters in order to simplify and organize your requests

Pagination parameters
When the return of your request is a list of objects, you do not have to get the whole result in one time, you can paginate it if you want. Some parameters can be used to constrain the number of objects the request returns

To do this, you must pass the following parameters:
index
The offset of the first object you want to get

limit
the maximum number of objects to return
Requests examples
https://api.deezer.com/playlist/4341978/tracks?index=0&limit=10
https://api.deezer.com/playlist/4341978/tracks?index=3&limit=7
https://api.deezer.com/playlist/4341978/tracks?limit=2

Access token
Deezer API uses the OAuth 2.0 protocol for authentication and authorization as mentionned here.
This protocol provides an access token according to the permissions you need to interact with the user, and what he accepts to share with your application.
Once you get it, you can use it easily thanks to the parameter access_token in your request. This token expires after a defined duration automatically, and has to be renewed.

Request methods
Deezer API is a RESTful API, it means you have to use GET HTTP request in order to get informations, POST HTTP request to update/add datas and DELETE HTTP request to delete them.
A special parameter request_method is provided in order to override the HTTP request and allows to POST or DELETE request by using GET HTTP request instead.
Requests examples
https://api.deezer.com/album/302127?note=5&request_method=POST