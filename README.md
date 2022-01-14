# TLE API

<!-- [![build](https://travis-ci.com/ivanstan/tle-api.svg?branch=master)](https://travis-ci.com/ivanstan/tle-api) -->
<!-- ![dependabot](https://badgen.net/dependabot/dependabot/dependabot-core/?icon=dependabot) -->
![coverage](https://badgen.net/coveralls/c/github/ivanstan/tle-api)
![status](https://badgen.net/uptime-robot/status/m781499721-d42767e28cc71aea507fb087)
![status](https://badgen.net/uptime-robot/month/m781499721-d42767e28cc71aea507fb087)
![status](https://badgen.net/uptime-robot/response/m781499721-d42767e28cc71aea507fb087)

Code repository that powers TLE API backend, listed on NASA API catalog 
https://api.nasa.gov/

API provides up to date two line element set records, the data is updated 
daily from [CelesTrak](https://celestrak.com/) and served in JSON format. A two-line element set (TLE) 
is a data format encoding a list of orbital elements of an 
Earth-orbiting object for a given point in time. 

## Usage
Further documentation and response examples are available at: 
https://tle.ivanstanojevic.me/

### Available endpoints
The TLE API consists of two endpoints `GET http://tle.ivanstanojevic.me`

| Endpoint | Description |
|----------|:------:|
| `GET /api/tle?search={query}` | Perform search by satellite name |
| `GET /api/tle/{id}` | Retrieve a single TLE record where id is satellite number |

Example query
http://tle.ivanstanojevic.me/api/tle

# Third party client libraries

* JavaScript https://github.com/ivanstan/tle.js
* PHP https://github.com/ivanstan/tle-php 
* C# https://github.com/nichols-t/TLE.NET
