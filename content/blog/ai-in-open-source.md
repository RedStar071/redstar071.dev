---
title: how i use AI in open source
description: "AI can help me maintain my projects, but the decisions and responsibility stay with me."
date: 2026-10-02
minRead: 3
---

AI is changing how we write software, including open source. i use it to explore solutions, understand errors and prepare changes. when that work becomes public, i want it to be clear who did what.

[Harlan Wilton's post on using AI in open source](https://harlanzw.com/blog/ai-in-open-source/) helped me think through this. these are the rules i want to follow in my own projects.

## my rules

- AI can help me work, but it doesn't speak for me. if an agent prepares part of a public contribution, i disclose it.
- agents can work autonomously only in projects i maintain, where i can check the result.
- before submitting a contribution prepared by an agent to someone else's project, i verify the change and take responsibility for it.
- pull request descriptions should explain the problem, the solution and what was checked. no generic filler or claims i can't verify.
- automated reviews can flag risks. approvals and merges stay with a person.
- changes stay visible in the project's history. if something is unclear, i stop and check it.

## where it helps

in projects i maintain, like WolfStar and my tools for Discord and the web, an agent can help investigate an issue, find the relevant code or prepare a fix. before proposing it, i check that the problem is reproducible, that the solution fits the project and that there's a useful check to catch regressions.

context matters even more when contributing to someone else's project. the code doesn't always explain a maintainer's conventions, priorities or previous decisions. when those are unclear, i ask before preparing a contribution.

## automated reviews

an agent can read a pull request and look for edge cases, missing checks or possible regressions. its comment should name the commit it reviewed and separate confirmed problems from questions. a convincing review can still be wrong, so the maintainer decides what to do with it.

if the agent prepares a fix, i check it and keep the change traceable. i keep control of approvals, merges and decisions that affect the project's direction.

## when AI gets it wrong

a passing test doesn't prove everything works, and a confident explanation doesn't make a change correct. i'm responsible for the code i choose to publish and the tools i trust with the work.

if you find a problem in a change made with AI assistance, open an issue in the project. i want to understand what happened and improve both the code and the process.
