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

I seem to write a full stack application on a 4-year cadence. My first application was a classic MEAN stack for hosting UIL Computer Science Tournaments in Texas. On top of this, we had a fairly complex backend using rabbitmq to schedule and execute competitor's submissions. This application ran in bare metal donated to me by HP Enterprise. We had about 500 users.

Four years later, I wrote a full stack application using React, Firebase, and Node.js. This time around, it was for a non-profit that a group of friends and I founded. Here, we initially packaged our application with docker and deployed to Heroku. Then later, due to scaling, we upgraded to GCP App Engine and Firebase. At peak, we had around 10,000 active users.

Now, once again, about 4 years later, I am building a full stack application. Technology has come a long way since my first two applications. With NextJS and the offerings of Vercel, I am able to one-click deploy the frontend. Now it's a matter of determining which hosted database, compute, and authentication to use. While doing so, I should also try to avoid vendor lock-in and ensure scalability and reliability.

I initially wanted to spin up my own VPC and have everything self-hosted. This kind of bogged down the project and disincentivized me from actually implementing the main idea. So, I decided to use whatever would get to production quickest. 

Most of the decisions were made quickly. I totally expect to revisit these them as the project evolves.

## Compute 

The initial prototype I wrote used NextJS, so I ended up selecting Vercel Fluid Compute. Additionally, I looked at Cloudflare Workers.

Vercel's offering seemed to have the least vendor lock-in and my usage should fall within the free tier. Both Cloudflare and Vercel had just released a Rust runtime for their serverless product. Based on my reading of the documentation, Vercel supports using Axum. Cloudflare Workers seemed to require the code to be compile down to WebAssembly. This meant I could only use the APIs and libraries they provided. 

Moreover, I was sold on the simplicity of the developer experience. My past experiences with serverless compute required setting up quite a bit more boiler plate.

## Database

Impressed by Vercel's developer experience, I decided to find hosted PostgreSQL with similar one. Supabase and Neon came up as good options.

Neon's product better matched my applications usage pattern since it's serverless. There will be large gaps between hosting parties so having decided CPU feels wasteful. Supabase offers a massive number of features out of the box though. Oddly this made it feel overkill to what I required.

Neon was incredibly easy to setup and provides some nice features such as branching and rollbacks. The only issue is that the total database size is small in its free tier. At the end of the day, since all I need is a standard postgres library, I should be able to switch easily.

## Authentication

For authentication, I decided to use Ory. However, I made this decision when I was planning on self-hosting everything. The neat part of Ory is that they open-sourced their software, which means I can self-host it if I want to. I decided to use their managed service to start. 

The main problem is that Ory Network does not currently offer a free tier. To help switch providers down the line, I am currently looking into BetterAuth. This will allow me to switch between providers easily. Neon has recently launched an authentication product which is likely simplest to integrate. Alternatively, I could switch to Supabase which is a complete backend as a service.
