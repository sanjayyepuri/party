---
author: Sanjay Yepuri
state: Draft
discussion: TBD
---

# Party Schema and Design

The party application is designed to simplify the guest list and management of parties I host. The party itself should have basic details of when and where as well as maybe special data bespoke to the party. Additionally, it should track the RSVPs for each guest. 

There are two main parts this should focus on. The flow of the guest and the creation of the party. The guest flow involves the guest logging and viewing all past and present parties. Then they can manage their RSVP for each party. 

The party creation flow involves the host creating a party and then the application sending out notifications to all guests. To begin with, all guests can RSVP to all parties. This means that if a user is able to log into the application, they have everything they need.

## Guest Flow

The user will be able to login into the application. This will use Ory today (this is something we should reconsider after the initial MVP). This means that we will need to join the user identifier provided by Ory with our own database. 

- During account creation, we should create entries in own database?
- Alternatively, we could use the user information stored in Ory's database and render that to the page. That way we only store the party information. 

Once we have an authorized user, they can then manage RSVPs. Every party should have a unique identifier. Then there will a list of RSVPs containing the user id, party id and rsvp status. Whenever a guest updates their RSVP via the application, either a new RSVP is created or an existing one is updated. 

 - We should also eventually store any plus-one information in the RSVP data as well. 
 
## Party Creation

When a party is created all guest on the application should receive a notification. Ideally a text message or email. This means we should able to scan all guests and get their contact information. (Would need to see if this is possible via ory today).

Once, the party is created, a guest should be able to navigate to a unique link and manage their RSVP once logged in.
