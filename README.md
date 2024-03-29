# KU Library Reservation

> [!CAUTION]
> This could get you suspended or faced with discplinary action if you aren't careful. Don't abuse this and DDOS
> your library. 

> [!NOTE]
> It is recommended to create a fork of this repository to modify the source code as needed. 
> While the code was made with the vision of being highly configurable for many use-cases, a lot of it is untested.
> I make no gurantees made about the functionality of the program for any person(s)' particular use-case.

To reserve a room for a large rotating friend group that needs a dedicated study room throughout the day.

A CLI or server which reserves library rooms at the University of Kansas. 
It may similarly work on other systems powered by the same [Springshare](https://www.springshare.com/) system.

It has a highly configurable input system. See [Configuration](#configuration) 

## Installation and Usage

### From Source
The code can be run from source with [Bun](https://bun.sh/). View [Installation | Bun Docs](https://bun.sh/docs/installation).

Once installed the program can be run with.
```sh
# bun run reserve
bun run reserve:dry # do a test run
```
A sample output which displays scoring details of rooms as well as available timeslots is shown:
```
DEBUG LOG (DRY RUN) - 2023-11-07
SCORING
429:109.373
◈◈◈◈◈◈◈◈◈◈◈◈◈◈◈◈◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇
203D,203E,203F,203G,203H,203I,203J,203K,203L,425,426,427,428,430,431:0


STARTING DRY RUN
RESERVING Anschutz 429
08:00:00-10:00:00|38911226
#dry_runFoobar|email@ku.edu
10:00:00-12:00:00|38911227
#dry_runFoobar|email@ku.edu
12:00:00-14:00:00|38911228
#dry_runFoobar|email@ku.edu
14:00:00-16:00:00|38911229
#dry_runFoobar|email@ku.edu
16:00:00-18:00:00|38911230
#dry_runFoobar|email@ku.edu
18:00:00-20:00:00|38911231
#dry_runFoobar|email@ku.edu
20:00:00-22:00:00|38911232
#dry_runFoobar|email@ku.edu
22:00:00-23:59:59|38911233
#dry_runFoobar|email@ku.edu
◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆


Only reserved 1 out of 2 requsted. Was there enough valid rooms?
```
Note the SCORING legend is as follows:
* `{roomId}:{score}` the room availbility will only display if score is nonzero
* `◆` unavailable slot
* `◈` blacklisted slot, but available to reserve
* `◇` open slot

The RUN legend is as follows:
* `{time}|{session_id}`
* `#{booking id}|{email}|{fname} {lname}` booking id can be used to cancel or view reservation details
* `◇` did not reserve
* `◆` reserved

<!-- ### From Docker
TODO -->

## Usage

### Command Line Arguments
```
Options:
  -d, --dry                       Enable dry run
  -c, --configuration <filepath>  Specify configuration file location (default: "./configuration.json")
  -h, --help                      display help for command
```

### Configuration
View an example configuration at [`./configuration-EXAMPLE.json`](./configuration-EXAMPLE.json).

Or view the full [`./schema.json`](./schema.json).

### Setting Up
The code can be dockerized according to the [`Dockerfile`](./Dockerfile) and can run as a server or as a script. 
Read more in [Technical Details](#technical-details).

## Technical Details

Implemented with Typescript and run with [Bun](https://bun.sh/). 
It runs on a Cloud Run container linked to a Artifact Registry image. 
A Cloud Schedular is also configured to run at midnight every night at CDT.

### Implementation

We use the accessible page at `https://calendar.lib.ku.edu/r/accessible/availability` since the checksums embedded in the `<input>` with a `data-crc` attribute. 
These checksums are needed for the POST request to lock and reserve our page.

We will append some URL parameters (`?lid=17465&zone=0&gid=36998&capacity=2&space=0&date=01-01-2023`). 
Location ID (LID) corresponds to physical building, while Group ID (GID) corresponds to category of room. 
Capacity is a array index (1-indexed) associated with mapping capacity ranges of rooms to elements in an array. (IE. `capacity=2, indexes to 5-8, from [1-4, 5-8, 9-12]`).
A zero or falsy capacity value indicates all values

Rank the spaces in criteria and as specified by our `configuration.json`
* By availability
  * Supports whitelist/blacklist (times to reserve)
  * Supports required times (times required, otherwise don't reserve)
  * Supports continuity (ie. requiring some amount of adjacent time slots)
* By size/capacity
  * Supports blacklist
  * TODO whitelist
* By time desireability 
  * Currently a sinosidal CDF centered around noon
  * TODO custom functionality

We will have to submit a `POST` request to `https://calendar.lib.ku.edu/ajax/space/times` to receive a HTML response embedded with our new session token. 
This has the side-effect of preventing anyone else from reserving that room for 5 minutes while our session is active (ie. locked timeslot). On program failure
we will always cleanup the sessions (view [`./src/cleanup.ts`](./src/cleanup.ts)) if we failed to reserve them to avoid blocking future interactions (ie. to allow retry).

Once we receive our session token, we will select or pop a random user from allotted users, then reserve the maximum contigious times
(since all times reserved must be contigious) and send multiple `POST` to `https://calendar.lib.ku.edu/ajax/space/book`. We will double check the response
to verify we have reserved our timeslots.

All logs are optionally linked to a webook (discord) specifically, on failure it will ping necessary users as well.
 
<!--
gcloud init
https://stackoverflow.com/a/49958213/17954209
gcloud components install docker-credential-gcr
sudo usermod -a -G docker ${USER}
-->
