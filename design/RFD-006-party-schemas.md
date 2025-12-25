---
author: Sanjay Yepuri
state: Draft
discussion: TBD
---

# Party Schemas

These are the set of entities that make up a party. We will have a Party, Guest, and RSVP tables.

## Party Table

The party table stores information regarding each party. Every field should be self explanatory. The slug is a going to be a generated url slug for the party. This will enable the name to have no restriction on the text used.


| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| party_id    | UUID      | Unique identifier for the party |
| name        | String    | Human readable unique name for the party |
| time        | Timestamp | Time of the party |
| location    | String    | Location of the party |
| description | String    | Description of the party |
| slug        | String    | Human readable unique slug for the party |
| created_at  | Timestamp | Timestamp when the party was created |
| updated_at  | Timestamp | Timestamp when the party was last updated |
| deleted_at  | Timestamp | Timestamp when the party was soft deleted (null if not deleted) |


## Guest Table

The guest table stores information regarding each guest. It also contains a foreign key to the user table used for authentication. This is important to be able to retrieve only the guest belonging to the current user.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| guest_id    | UUID      | Unique identifier for the guest |
| name        | String    | Human readable unique name for the guest |
| email       | String    | Email of the guest |
| phone       | String    | Phone number of the guest |
| created_at  | Timestamp | Timestamp when the guest was created |
| updated_at  | Timestamp | Timestamp when the guest was last updated |
| deleted_at  | Timestamp | Timestamp when the guest was soft deleted (null if not deleted) |


## RSVP Table

The RSVP table stores the state of each guest's RSVP for a particular party. 

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| rsvp_id     | UUID      | Unique identifier for the rsvp |
| party_id    | UUID      | Unique identifier for the party |
| guest_id    | UUID      | Unique identifier for the guest |
| status      | String    | Status of the rsvp |
| created_at  | Timestamp | Timestamp when the rsvp was created |
| updated_at  | Timestamp | Timestamp when the rsvp was last updated |
| deleted_at  | Timestamp | Timestamp when the rsvp was soft deleted (null if not deleted) |q
