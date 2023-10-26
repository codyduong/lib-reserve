# KU Library Reservation

> To reserve a room for a large rotating friend group that needs a dedicated study room throughout the day.

A CLI and CI/CD cronjob reservation system.

## Installation and Usage
TODO

## Usage
TODO

## Technical Details

Language is TypeScript with Server being [Bun]().

We use the accessible page at `https://calendar.lib.ku.edu/r/accessible/availability?` since the checksums are all exposed in the HTML response, rather
than dynamically added with each jquery request/POST on the page using [FullCalendar](https://fullcalendar.io/). They are probably embedded in some HTML element, but I could not be assed to find it.

We use this url `https://calendar.lib.ku.edu/r/accessible/availability?lid=17465&zone=0&gid=36998&capacity=2&space=0&date=2023-10-19` to see all spaces supporting 5-8 people in Anschutz on a given date.

Rank the spaces in criteria:
- By availability (24 hours is best)
- By size/capacity (prefer larger rooms)
- By floor (only floor 4)

The weighted matrix chart also prioritizes room with the best time
- 8am-8pm: 1x
- 8pm-8am: 0.5x
- Size
  - TODO (prioritize largest rooms in library)

This is customizable.



<!-- Checksum flow
https://fullcalendar.io/docs/event-object
`calEvent.extendedProps` -> `{checksum: "dc6413121eba304ab876d626dd6241e1" itemId: 147416, status: 0}`
`calEvent.extendedProps.checksum` -> `dc6413121eba304ab876d626dd6241e1` -->


<!-- ### Add
Request Headers
```http
POST /spaces/availability/booking/add HTTP/2
Host: calendar.lib.ku.edu
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: application/json, text/javascript, */*; q=0.01
Accept-Language: en-US,en;q=0.7,es-ES;q=0.3
Accept-Encoding: gzip, deflate, br
Referer: https://calendar.lib.ku.edu/space/147416
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: 194
Origin: https://calendar.lib.ku.edu
DNT: 1
Connection: keep-alive
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
TE: trailers
```

Request Body
```
{
	"add[eid]": "147416",
	"add[gid]": "36998",
	"add[lid]": "17465",
	"add[start]": "2023-10-21+12:00",
	"add[checksum]": "01ed625e8e7fdc5c06675f1bbfae4f11",
	"lid": "17465",
	"gid": "36998",
	"start": "2023-10-15",
	"end": "2023-10-22"
}
```

Response Headers
```http
HTTP/2 200 OK
server: nginx
date: Wed, 18 Oct 2023 17:50:45 GMT
content-type: application/json
vary: Accept-Encoding
x-backend-server: libcal-us-3.springyaws.com
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
x-frame-options: deny
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: upgrade-insecure-requests
x-content-encoding-over-network: gzip
X-Firefox-Spdy: h2
```


### Times
Request Headers
```http
POST /ajax/space/times HTTP/2
Host: calendar.lib.ku.edu
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: text/html, */*; q=0.01
Accept-Language: en-US,en;q=0.7,es-ES;q=0.3
Accept-Encoding: gzip, deflate, br
Referer: https://calendar.lib.ku.edu/space/147416
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: 330
Origin: https://calendar.lib.ku.edu
DNT: 1
Connection: keep-alive
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
TE: trailers
```

Request Body
```json
{
	"patron": "",
	"patronHash": "",
	"bookings[0][id]": "61667820",
	"bookings[0][eid]": "147416",
	"bookings[0][seat_id]": "0",
	"bookings[0][gid]": "36998",
	"bookings[0][lid]": "17465",
	"bookings[0][start]": "2023-10-21+12:00",
	"bookings[0][end]": "2023-10-21+14:00",
	"bookings[0][checksum]": "526ca0a1fdc9f5a26c77276ec5ff5c16"
}
```

Response Headers
```http
HTTP/2 200 OK
server: nginx
date: Wed, 18 Oct 2023 17:50:47 GMT
content-type: text/html; charset=utf-8
vary: Accept-Encoding
x-backend-server: libcal-us-3.springyaws.com
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
x-frame-options: deny
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: upgrade-insecure-requests
x-content-encoding-over-network: gzip
X-Firefox-Spdy: h2
```

Response (very verbose html response) -->

### Book
Request Headers
```http
POST /ajax/space/book HTTP/2
Host: calendar.lib.ku.edu
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: application/json, text/javascript, */*; q=0.01
Accept-Language: en-US,en;q=0.7,es-ES;q=0.3
Accept-Encoding: gzip, deflate, br
Referer: https://calendar.lib.ku.edu/space/147416
Content-Type: multipart/form-data; boundary=---------------------------2688966210486268014669843600
Content-Length: 1154
Origin: https://calendar.lib.ku.edu
DNT: 1
Connection: keep-alive
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
```
Boundary seems to be randomly generated, just use unix time

<!-- Checksum method unknown, just generate using add POST to TIMES
526ca0a1fdc9f5a26c77276ec5ff5c16
526ca0a1fdc9f5a26c77276ec5ff5c16
-->

Request Body
```http
-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="session"

37979923
-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="fname"

Cody
-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="lname"

Duong
-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="email"

codyduong@ku.edu
-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="bookings"

[{"id":1,"eid":147416,"seat_id":0,"gid":36998,"lid":17465,"start":"2023-10-21 12:00","end":"2023-10-21 14:00","checksum":"526ca0a1fdc9f5a26c77276ec5ff5c16"}]
-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="returnUrl"

/space/147416
-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="pickupHolds"


-----------------------------2688966210486268014669843600
Content-Disposition: form-data; name="method"

12
-----------------------------2688966210486268014669843600--
```

### 200
Response Headers
```http
HTTP/2 200 OK
server: nginx
date: Wed, 18 Oct 2023 17:38:41 GMT
content-type: application/json
vary: Accept-Encoding
x-backend-server: libcal-us-5.springyaws.com
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
x-frame-options: deny
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: upgrade-insecure-requests
x-content-encoding-over-network: gzip
X-Firefox-Spdy: h2
```

Response
```json
{
	"bookId": "cs_nMl7gnsv",
	"html": "\n\n\n            <h1 class=\"margin-top-none s-lc-eq-success-title\">\n            <i class=\"fa fa-check-square-o fa-lg s-lc-green\" aria-hidden=\"true\"></i>\n            Booking Confirmed\n        </h1>\n\n        <p>\n            You will receive an email confirmation at codyduong@ku.edu. Please check your spam folder or contact the library with any questions.\n        </p>\n    \n                    \n            <div class=\"s-lc-eq-success-section s-lc-eq-success-resource\">\n                    <h2>\n                Space Information\n            </h2>\n        \n        <dl class=\"s-lc-spacious-lines s-lc-dl-left margin-bottom-none\">\n            <dt>\n    Location:\n</dt>\n<dd>\n    Anschutz Library\n    \n</dd>\n\n            \n                            <dt>\n    Space:\n</dt>\n<dd>\n    Anschutz 427\n                \n</dd>\n            \n            \n            \n    <dt>\n    Date:\n</dt>\n<dd>\n    Saturday, October 21, 2023\n    \n</dd>\n\n            <dt>\n            Time:\n        </dt>\n        <dd>\n            12:00pm\n            -\n            2:00pm\n        </dd>\n    \n        </dl>\n    </div>\n\n    <div class=\"s-lc-eq-success-section s-lc-eq-success-user\">\n    <h2>\n        User Information\n    </h2>\n\n    <dl class=\"s-lc-spacious-lines s-lc-dl-left margin-bottom-none\">\n        <dt>\n    Full Name:\n</dt>\n<dd>\n    Cody Duong\n    \n</dd>\n\n        <dt>\n    Email:\n</dt>\n<dd>\n    codyduong@ku.edu\n    \n</dd>\n    </dl>\n</div>\n\n    \n            <div id=\"s-lc-eq-success-buttons\" class=\"margin-top-xlg\">\n            \n            <a href=\"https://calendar.lib.ku.edu/space/147416\" class=\"btn btn-primary\">\n                Make Another Booking\n            </a>\n\n                    </div>\n    ",
	"bookingCost": 0
}
```

### 500
Response Headers
```html
HTTP/2 500 Internal Server Error
server: nginx
date: Wed, 18 Oct 2023 17:50:27 GMT
content-type: text/plain; charset=utf-8
strict-transport-security: max-age=63072000; includeSubDomains; preload
X-Firefox-Spdy: h2
```

Response
```html
<p>Anschutz 427: Sorry, this exceeds the 120 minute per day limit across all locations.</p>
```