---
layout: post
title: "ROS 2 discovery trusts everyone on the subnet"
topic: Middleware
intro: "SROS 2 exists, works, and is switched off on almost every robot in production. The reasons are worth taking seriously — and so are the consequences."
description: "Why ROS 2 and DDS security is usually disabled in production robots, what it actually protects, and how to turn it on without stalling the team."
---

Default ROS 2 has no authentication. Any node that reaches the network can
discover every topic, subscribe to the camera feed, and publish to `/cmd_vel`.
That is not a vulnerability; it is the documented behaviour, and it is the right
default for a laboratory.

It is the wrong default for a machine carrying a pallet past a person.

## What SROS 2 gives you

DDS security brings authentication between participants, access control per
topic, and encryption on the wire. It is built into the middleware and it works.

What stops teams is not the feature. It is what the feature does to their day:

- Every node needs an identity, a certificate and a permissions file
- Discovery slows down, sometimes noticeably on constrained compute
- A developer who adds a node now needs a key before it can talk to anything
- Debugging gets harder in exactly the moments when you want it easy

So it gets deferred to "before launch", and before launch there is no time.

## The phased approach that actually lands

We have watched the all-at-once version fail enough times to stop trying it.
What works is closer to how automotive rolled out kernel hardening: introduce the
mechanism long before you enforce it.

1. **Inventory first.** Record every participant, every topic, and who publishes
   to it. Most teams cannot produce this list, which is itself the finding.
2. **Enable authentication only.** No access control, no encryption. Nodes get
   identities and must prove them. Nothing else changes.
3. **Add access control in permissive mode.** Log what would have been denied.
   Run for two weeks. The log is your real topic map, as opposed to the one in
   the architecture document.
4. **Enforce.** By now the exceptions are known and the team is not surprised.
5. **Encrypt selectively.** Command and teleoperation paths first. Full
   encryption of high-rate sensor topics is expensive and rarely the priority.

The point of the order is that no step blocks the rest of engineering. A security
change that stops forty people working gets reverted on Friday, and you do not
get a second attempt that year.

## The separate question

Even a fully secured DDS domain does not answer the harder problem: your
teleoperation channel is, by design, a remote way to make the machine move. It
deserves stronger protection than any topic, and in most systems it has less —
frequently a long-lived token, a VPN and an optimistic assumption about the
operator's laptop.

That is a different article. But if you are deciding where to spend the next
month, spend it there rather than on encrypting lidar scans.
