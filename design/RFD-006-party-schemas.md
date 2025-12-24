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
