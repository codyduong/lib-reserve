# KU Library Reservation

> To reserve a room for a large rotating friend group that needs a dedicated study room throughout the day.

A CLI and CI/CD cronjob reservation system.

## Installation and Usage

TODO

## Usage

TODO

## Technical Details

Implemented with Typescript [Bun](https://bun.sh/).

We use the accessible page at `https://calendar.lib.ku.edu/r/accessible/availability?` since the checksums embedded in the `<input>` with a `data-crc` attribute. 
These checksums are needed for the POST request to lock and reserve our page.

We will append some URL parameters (`?lid=17465&zone=0&gid=36998&capacity=2&space=0&date=01-01-2023`). Location ID (LID) corresponds to physical building,
while Group ID (GID) corresponds to category of room. Capacity is a array index (1-indexed) associated with mapping capacity ranges of rooms to elements in an array. (IE. `capacity=2, indexes to 5-8, from [1-4, 5-8, 9-12]`)

Rank the spaces in criteria and as specified by our `configuration.json`
* By availability (24 hours is best)
* By size/capacity (prefer larger rooms)
* By floor (only floor 4)

We will have to submit a `POST` request to `https://calendar.lib.ku.edu/ajax/space/times` to receive a HTML response embedded with our new session token. 
This has the side-effect of preventing anyone else from reserving that room for 5 minutes while our session is active (ie. locked timeslot).

Once we receive our session token, we will select or pop a random user from allotted users, then reserve the maximum contigious times
(since all times reserved must be contigious) and send multiple `POST` to `https://calendar.lib.ku.edu/ajax/space/book`. We will double check the response
to verify we have reserved our timeslots.

This whole program is run on a cron-job at midnight CST and reserves rooms 7 days in advance (or whatever configuration is set to). Optionally it is also linked to
a Discord webhook which can log debug messages and reservations.
