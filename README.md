# TLE API

[![build](https://travis-ci.com/ivanstan/tle-api.svg?branch=master)](https://travis-ci.com/ivanstan/tle-api)
![coverage](https://badgen.net/coveralls/c/github/ivanstan/tle-api)
![dependabot](https://badgen.net/dependabot/dependabot/dependabot-core/?icon=dependabot)
![status](https://badgen.net/uptime-robot/status/m781499721-d42767e28cc71aea507fb087)
![status](https://badgen.net/uptime-robot/month/m781499721-d42767e28cc71aea507fb087)
![status](https://badgen.net/uptime-robot/response/m781499721-d42767e28cc71aea507fb087)

<p align="center">
<img src="https://github.com/ivanstan/tle-api/blob/master/docs/logo192.png?raw=true"/>
</p>

Code repository that powers TLE API backend, listed on NASA API catalog 
https://api.nasa.gov/

API provides up to date two line element set records, the data is updated 
daily from [CelesTrak](https://celestrak.com/) and served in JSON format. A two-line element set (TLE) 
is a data format encoding a list of orbital elements of an 
Earth-orbiting object for a given point in time. 
For more information on TLE data format visit [Definition of 
Two-line Element Set Coordinate System](https://spaceflight.nasa.gov/realdata/sightings/SSapplications/Post/JavaSSOP/SSOP_Help/tle_def.html).

## Usage
Further documentation and response examples are available at: 
http://data.ivanstanojevic.me/api/tle/docs

###Available endpoints
The TLE API consists of two endpoints `GET http://data.ivanstanojevic.me`

| Endpoint | Description |
|----------|:------:|
| `GET /api/tle?search={q}` | Perform search by satellite name |
| `GET /api/tle/{q}` | Retrieve a single TLE record where query is satellite number |

Example query
http://data.ivanstanojevic.me/api/tle

# Client libraries

* JavaScript https://github.com/ivanstan/tle.js
* PHP https://github.com/ivanstan/tle-php 
* C# https://github.com/nichols-t/TLE.NET