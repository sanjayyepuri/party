---
author: Sanjay Yepuri
state: Draft
discussion: TBD
---

# Technology Stack

## TL;DR
- NextJS
- Vercel Fluid Compute
- Neon Serverless PostgreSQL
- Managed Ory

## Background 

I seem to write a full stack application on a 4-year cadence. My first application was a classic MEAN application for hosting UIL Computer Science Tournaments in Texas. On top of this, we had a fairly complex backend using rabbitmq to schedule and execute competitor's submissions. This application ran in bare metal donated to me by HP Enterprise. We had about 500 users.

Four years later, I wrote a full stack application using React, Firebase, and Node.js. This time around, it was for a non-profit that a group of friends and I founded. Here, we initially packaged our application with docker and deployed to Heroku. Then later, due to scaling, we upgraded to GCP App Engine and Firebase. At peak, we had around 10,000 active users.

Now, once again, about 4 years later, I am building a full stack application. Technology has come a long way since my first two applications. With NextJS and the offerings of Vercel, I am able to one-click deploy this application. Now it's a matter of determining which hosted database, compute, and authentication to use. While doing so, I should also try to avoid vendor lock-in and ensure scalability and reliability.

I initially wanted to spin up my own VPC and have everything self-hosted. This kind of bogged down the project and disincentivized me from actually implementing the main idea. So, I decided to use whatever would get to production quickest. 

Most of the decisions below were made quickly. I totally expect to revisit these decisions as the project evolves.

## Compute 

The initial prototype I wrote used NextJS, so I researched Vercel Fluid Compute. Additionally, I looked at Cloudflare Workers. I decided to use Vercel Fluid Compute. Cost-wise, my current use case should fall within the free tier of Vercel Fluid Compute.

Both Cloudflare and Vercel had just released a Rust runtime for their serverless product. Based on my reading of the documentation, Vercel's offering seemed to have the least vendor lock-in. I could effectively write a normal Axum application and deploy it to Vercel Fluid Compute. Cloudflare Workers seemed to require the code to be compile down to WebAssembly. This meant I could only use the APIs and libraries they provided. 

I didn't really take a look at other options, my experience with other serverless offerings in the past required far more setup than Vercel. I was sold on the simplicity of the developer experience.


## Database

Impressed by Vercel's developer experience, I decided to find a hosted PostgreSQL with similar developer experience. Supabase and Neon came up as good options.

Supabase offers a massive number of features out of the box. Neon is just a managed PostgreSQL service, however, but its offering is serverless. Since there would be large gaps between hosting parties, this matched my mental model for the application.

I went with Neon. It was incredibly easy to setup and provides some nice features such as branching and rollbacks (I believe Supabase also offers these features). The only issue is that the total database size is small in its free tier. At the end of the day, since all I need is a standard postgres library, I should be able to switch easily.

## Authentication

For authentication, I decided to use Ory. However, I made this decision when I was planning on self-hosting everything. The neat part of Ory is that they open-sourced their software, which means I can self-host it if I want to. I decided to use their managed service to start, however, they don't have a free tier. 

I am currently looking into BetterAuth to abstract me from any one provider's libraries. This will allow me to switch between providers easily. Neon has recently launched an authentication product which is likely simplest to integrate but makes it difficult to switch between providers.
