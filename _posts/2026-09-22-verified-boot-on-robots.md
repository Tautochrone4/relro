---
layout: post
title: "Your robot boots anything on the SD card"
topic: Chain of trust
intro: "Verified boot is the cheapest control you will ever implement and the one most robotics platforms ship without. Here is what it costs and what it buys."
description: "Why verified boot matters on autonomous robots, what it costs to implement, and where robotics platforms usually break the chain."
---

Pull the storage out of a robot, mount it on a laptop, add a line to a startup
script, put it back. If the machine boots and runs your line, everything else in
the security programme is decoration.

This is not a hypothetical. It is the first thing we check, and it works far more
often than anyone expects — including on machines that already passed a
penetration test, because the test was run over the network while the interesting
attack needs ten minutes and a screwdriver.

## What the chain actually is

Each stage verifies the next before handing over control:

1. **Boot ROM** — immutable, burned into the silicon. It holds a hash of your
   public key in fuses. This is the only part you cannot change and the only part
   you do not have to trust anyone else for.
2. **First-stage bootloader** — verified by the ROM against that key.
3. **Bootloader** — verified by the first stage, usually as a signed FIT image
   with a rollback counter.
4. **Kernel and device tree** — verified by the bootloader.
5. **Root filesystem** — verified continuously by `dm-verity`, not once at
   startup. Every block is checked as it is read.
6. **Application layer** — and here is where almost every robot we look at stops.

Five links hold. The sixth is writable, unsigned, and the first thing an attacker
reaches.

## The part robotics gets wrong

In automotive the application layer is signed because the whole image is signed
and nothing writes to it in the field. Robots are different: teams want to drop a
new perception model or a tuned parameter file onto a running machine without
building a full image.

That convenience is the hole. A writable partition holding models, maps and
configuration is executable input to the autonomy stack even when it contains no
code. If the planner reads an unsigned map, the map is part of your trusted
computing base whether you declared it or not.

The fix is not to forbid field updates. It is to sign the artefacts and verify
them at load time:

```
# rootfs: verified continuously, read-only
/dev/mapper/vroot  /        ext4  ro,errors=remount-ro  0 1

# data: writable, never trusted, never executable
/dev/mmcblk0p4     /data    ext4  rw,nosuid,nodev,noexec  0 2
```

`noexec` is not the control. Verifying the signature on the model file before you
hand it to the planner is the control. `noexec` just removes the laziest path.

## What it costs

On a platform that already supports it — most i.MX, STM32MP, Jetson and Rockchip
parts do — the engineering is two to four weeks for a team that has done it
before, and considerably longer for one that has not, because the difficulty is
never the feature. It is the interactions: verified boot plus A/B update plus an
encrypted data partition plus factory provisioning, each of which breaks the
other in a way you only discover at two hundred units.

The recurring cost is the part people forget. Once you sign, you own a key
hierarchy, a signing process, a rotation plan and an answer to what happens when
a key leaks with machines already in the field. That is organisational work, and
no bootloader will do it for you.

## Where to start

Boot the machine, then run `cat /proc/cmdline` and look for a verity root hash.
If it is not there, nothing above the kernel is verified. That single command
tells you which half of this article applies to you.
